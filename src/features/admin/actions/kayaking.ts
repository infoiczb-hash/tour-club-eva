'use server';

import { prisma } from '@/lib/prisma';
import { parseBookingGroup, assignBoatsWithPassengers } from '@/features/kayaking/kayakLogic';
import { BookingGroup, Assignment, BoatPassenger, Boat } from '@/features/kayaking/types';
import { sendManifestToTelegramAction } from './manifest';
import { BookingStatus } from '@prisma/client';

export type ActionResponse<T = any> = { success: boolean; data?: T; error?: string };

// Статусы броней, которые должны попадать в байдарки (Оплачено + Ожидание оплаты)
const ACTIVE_STATUSES: BookingStatus[] = ['confirmed', 'pending'];

// 1. Получение списка будущих туров-байдарок
export async function getKayakingTourDates() {
  try {
    const now = new Date();
    const tourDates = await prisma.tourDate.findMany({
      where: {
        startDate: { gte: now },
        tour: { category: { slug: 'kayaking' }, isActive: true, deletedAt: null },
      },
      include: {
        tour: { select: { id: true, title: true, slug: true } },
        _count: { select: { bookings: { where: { status: { in: ACTIVE_STATUSES } } } } },
      },
      orderBy: { startDate: 'asc' },
    });
    return { success: true, data: { tourDates } };
  } catch (error) {
    return { success: false, error: 'Ошибка загрузки дат' };
  }
}

// 2. Получение текущей рассадки или запуск автомата
export async function getBoatAssignments(tourDateId: string): Promise<ActionResponse> {
  try {
    const tourDate = await prisma.tourDate.findUnique({
      where: { id: tourDateId },
      include: {
        bookings: {
          where: { status: { in: ACTIVE_STATUSES } },
          include: { member: { select: { name: true, phone: true } } },
        },
        boatAssignments: true,
      },
    });

    if (!tourDate) return { success: false, error: 'Дата тура не найдена' };

    const k2Count = tourDate.boatsK2Count || 0;
    const k3Count = tourDate.boatsK3Count || 0;
    const guidesCount = tourDate.guidesCount || 1;
    const groups: BookingGroup[] = tourDate.bookings.map(b => parseBookingGroup(b));

    // Если в базе уже сохранена ручная рассадка
    if (tourDate.boatAssignments.length > 0) {
      const assignments = tourDate.boatAssignments.map(a => ({
        bookingId: a.bookingId,
        passengerId: (a as any).passengerId,
        passengerName: (a as any).passengerName,
        boatType: a.boatType,
        boatIndex: a.boatIndex
      }));

      // 🔥 ВЫЧИСЛЯЕМ БЕРЕГ: Ищем тех, кого нет в лодках
      const assignedIds = new Set(assignments.map(a => a.passengerId));
      const unassigned: BoatPassenger[] = [];

      groups.forEach(group => {
        group.passengers.forEach((p, idx) => {
          const pId = `${group.bookingId}-${idx}`;
          if (!assignedIds.has(pId)) {
            unassigned.push({
              bookingId: group.bookingId,
              passengerId: pId,
              shortId: group.shortId,
              name: p.name,
              isChild: p.ticketType === 'child' || (p.age !== undefined && p.age < 14),
              isChildUnder7: group.hasChildUnder7 || (p.age !== undefined && p.age < 7),
              hasDog: group.hasDog || !!p.hasDog
            });
          }
        });
      });

      return { success: true, data: { assignments, unassigned, groups, boatsK2Count: k2Count, boatsK3Count: k3Count, guidesCount, warnings: [] } };
    }

    // Если рассадки нет - запускаем авто-алгоритм
    const { boats, unassignedPassengers, warnings } = assignBoatsWithPassengers(groups, k3Count, k2Count, guidesCount);
    
    const assignments = boats.flatMap(b => b.assignedPassengers.map(p => ({
      bookingId: p.bookingId, 
      passengerId: p.passengerId, 
      passengerName: p.name, 
      boatType: b.type, 
      boatIndex: b.index
    })));

    return { 
      success: true, 
      data: { assignments, unassigned: unassignedPassengers, groups, warnings, boatsK2Count: k2Count, boatsK3Count: k3Count, guidesCount } 
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ошибка при формировании рассадки' };
  }
}

// 3. Сохранение параметров флота
export async function updateTourDateBoats(tourDateId: string, boatsK2Count: number, boatsK3Count: number, guidesCount: number): Promise<ActionResponse> {
  try {
    await prisma.tourDate.update({
      where: { id: tourDateId },
      data: { boatsK2Count, boatsK3Count, guidesCount }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Ошибка сохранения настроек флота' };
  }
}

// 4. Сохранение финальной рассадки пассажиров
export async function saveBoatAssignments(tourDateId: string, assignments: Assignment[]): Promise<ActionResponse> {
  try {
    await prisma.$transaction([
      prisma.boatAssignment.deleteMany({ where: { tourDateId } }),
      prisma.boatAssignment.createMany({ 
        data: assignments.map(a => ({ 
          tourDateId,
          bookingId: a.bookingId,
          passengerId: a.passengerId,
          passengerName: a.passengerName,
          boatType: a.boatType,
          boatIndex: a.boatIndex
        })) 
      }),
    ]);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ошибка сохранения рассадки в базу' };
  }
}

// 5. Отправка манифеста + рассадки в Telegram
export async function sendKayakingManifest(tourDateId: string, frontendBoats: Boat[]): Promise<ActionResponse> {
  try {
    const tourDate = await prisma.tourDate.findUnique({
      where: { id: tourDateId },
      include: {
        tour: true,
        bookings: { where: { status: { in: ACTIVE_STATUSES } } },
      },
    });
    
    if (!tourDate) return { success: false, error: 'Дата не найдена' };

    // 1. ПОДГОТОВКА ДАННЫХ ИЗ БАЗЫ (Самый надежный источник)
    const passengerJackets = new Map<string, string>();
    const passengerTypes = new Map<string, string>();
    const bookingCommentsMap = new Map<string, string>();
    const bookingHasChildMap = new Map<string, boolean>(); // 🔥 Трекаем детей по броням, а не по людям

    tourDate.bookings.forEach(booking => {
      if (booking.comment) bookingCommentsMap.set(booking.id, booking.comment);
      // Запоминаем, есть ли в этой брони ребенок до 7 лет
      bookingHasChildMap.set(booking.id, booking.hasChildUnder7 || false);

      const guests = Array.isArray(booking.guests) ? booking.guests : [];
      guests.forEach((g: any, idx: number) => {
        const pId = `${booking.id}-${idx}`;
        passengerJackets.set(pId, g.jacket);
        let typeShort = g.type || 'Взр';
        if (typeShort.includes('Взрослый')) typeShort = 'Взр';
        if (typeShort.includes('Детский')) typeShort = 'Дет';
        passengerTypes.set(pId, g.isMain ? 'Заказчик' : typeShort);
      });
    });

    // 2. СЧИТАЕМ МАТЕМАТИКУ
    let totalClientsCount = 0;
    let guidesCount = 0;
    let extraKidsCount = 0; 
    let totalSeats = 0;
    let totalPaddles = 0;

    const jacketCounts: Record<string, number> = {};
    let guideJacketsCount = 0;      // 🔥 Отдельный счетчик для гидов
    let childUnder7JacketsCount = 0; // 🔥 Отдельный счетчик для малышей

    const processedBookings = new Set<string>(); // Чтобы не посчитать ребенка дважды для одной семьи
    const shownComments = new Set<string>();
    let boatRowsText = '';

    frontendBoats.forEach(boat => {
      if (boat.assignedPassengers.length === 0) return;

      const capacity = boat.type === 'K3' ? 3 : 2;
      boatRowsText += `\n<b>${boat.id} (${boat.assignedPassengers.length}/${capacity}):</b>\n`;

      let boatHasDog = false;
      let boatHasChild = false;
      const boatComments: string[] = [];

      boat.assignedPassengers.forEach((p, idx) => {
        const isGuide = p.passengerId.startsWith('guide-');
        
        if (isGuide) {
          guidesCount++;
          totalSeats++;
          totalPaddles++;
          guideJacketsCount++; // Гиду даем его личный тип жилета
          boatRowsText += `${idx + 1}. 🚣 Гид ${guidesCount}\n`;
        } else {
          totalClientsCount++;
          totalSeats++;
          totalPaddles++;

          // Обычный жилет клиента
          const pJacket = passengerJackets.get(p.passengerId) || (p.isChild ? 'Детский' : 'L');
          jacketCounts[pJacket] = (jacketCounts[pJacket] || 0) + 1;

          // 🔥 ПРОВЕРЯЕМ БРОНЬ НА НАЛИЧИЕ МАЛЫША
          // Если мы видим пассажира из новой брони, проверяем, есть ли там ребенок <7
          if (!processedBookings.has(p.bookingId)) {
            processedBookings.add(p.bookingId); // Помечаем бронь как обработанную
            
            if (bookingHasChildMap.get(p.bookingId)) {
              extraKidsCount++;            // +1 Человек на воду
              totalSeats++;                // +1 Сидушка
              childUnder7JacketsCount++;   // +1 Спец. жилет
              // Весло НЕ даем
            }
          }

          // Для вывода предупреждений под лодкой
          if (bookingHasChildMap.get(p.bookingId)) boatHasChild = true;
          if (p.hasDog) boatHasDog = true;
          
          if (!shownComments.has(p.bookingId)) {
            const comment = bookingCommentsMap.get(p.bookingId);
            if (comment) boatComments.push(`💬 <i>Комментарий: ${comment}</i>`);
            shownComments.add(p.bookingId);
          }

          const pType = passengerTypes.get(p.passengerId) || 'Взр';
          boatRowsText += `${idx + 1}. ${p.name} (${pType})\n`;
        }
      });

      if (boatHasChild || boatHasDog) {
        const features = [];
        if (boatHasChild) features.push('+ ребенок до 7 лет');
        if (boatHasDog) features.push('+ собака 🐶');
        boatRowsText += `⚠️ <i>Особенности: ${features.join(', ')}</i>\n`;
      }
      if (boatComments.length > 0) boatRowsText += boatComments.join('\n') + '\n';
    });

    // 3. ФОРМИРУЕМ ИТОГОВЫЙ ТЕКСТ
    const dateStr = tourDate.startDate.toLocaleDateString('ru-RU');
    const totalOnWater = totalClientsCount + extraKidsCount; 
    const totalJackets = totalSeats; // Жилетов ровно столько же, сколько мест (16)

    let message = `📋 <b>${tourDate.tour.title} (${dateStr})</b>\n`;
    message += `👥 Всего на воде: ${totalOnWater} чел + ${guidesCount} Гид\n\n`;

    message += `📦 <b>СНАРЯЖЕНИЕ К ВЫДАЧЕ:</b>\n`;
    message += `💺 Сидушки: ${totalSeats} шт. <i>(все места)</i>\n`;
    message += `🛶 Весла: ${totalPaddles} шт. <i>(без учета детей до 7 лет)</i>\n`;
    message += `🦺 Жилеты (Всего: ${totalJackets} шт.):\n`;

    // 🔥 Спец. жилеты выводим сверху
    if (guideJacketsCount > 0) {
        message += `• Спас жилет гида: ${guideJacketsCount} шт.\n`;
    }
    if (childUnder7JacketsCount > 0) {
        message += `• Спас жилет детский до 7 лет: ${childUnder7JacketsCount} шт.\n`;
    }

    // Остальные жилеты
    Object.entries(jacketCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([size, count]) => {
        message += `• ${size}: ${count} шт.\n`;
      });

    message += `\n---\n🚣 <b>РАССАДКА ПО ЛОДКАМ:</b>\n`;
    message += boatRowsText;

    // 4. ОТПРАВКА В ТЕЛЕГРАМ
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    
    if (botToken && chatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
      });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Ошибка при отправке манифеста' };
  }
}

// Обновление галочек (собака / ребенок) из таблицы админки
export async function toggleBookingFlag(bookingId: string, field: 'hasDog' | 'hasChildUnder7', value: boolean) {
  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { [field]: value }
    });
    return { success: true };
  } catch (error) {
    console.error('Toggle Error:', error);
    return { success: false, error: 'Ошибка при сохранении' };
  }
}