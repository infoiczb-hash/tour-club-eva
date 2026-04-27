import { BookingGroup, Boat, AssignmentResult, TicketType, Passenger, BoatPassenger } from './types';

// ==========================================
// 1. УТИЛИТЫ И ХЕЛПЕРЫ (Pure Functions)
// ==========================================

export function computePaidSeats(booking: any): number {
  let paid = (booking.ticketsAdult || 0) +
             (booking.ticketsChild || 0) +
             (booking.ticketsMember || 0);
  if (booking.ticketsFamily) paid += (booking.ticketsFamily * 3);
  return paid;
}

function mapTicketType(typeStr?: string): TicketType {
  const lower = typeStr?.toLowerCase() || '';
  if (lower.includes('клубный') || lower.includes('член клуба')) return 'member';
  if (lower.includes('детский') || lower.includes('ребёнок')) return 'child';
  if (lower.includes('семейный')) return 'family';
  return 'adult'; // Дефолт
}

function getAvailableSeats(boat: Boat): number {
  return boat.paidCapacity - boat.assignedPassengers.length;
}

// Конвертер: превращает Passenger (БД) в BoatPassenger (для Drag-and-Drop)
function createBoatPassengers(group: BookingGroup): BoatPassenger[] {
  return group.passengers.map((p, idx) => ({
    bookingId: group.bookingId,
    passengerId: `${group.bookingId}-${idx}`,
    shortId: group.shortId,
    name: p.name,
    isChild: p.ticketType === 'child' || (p.age !== undefined && p.age < 14),
    isChildUnder7: group.hasChildUnder7 || (p.age !== undefined && p.age < 7),
    hasDog: group.hasDog || !!p.hasDog
  }));
}

// ==========================================
// 2. БИЗНЕС-ЛОГИКА (Расчеты)
// ==========================================

/**
 * Рассчитывает идеальный флот для заданного числа пассажиров.
 * Приоритет всегда отдается лодкам К3 (максимизация вместимости).
 */
export function calculateRecommendedFleet(totalPassengers: number): { k3: number; k2: number } {
  if (totalPassengers === 0) return { k3: 0, k2: 0 };
  
  const k3 = Math.floor(totalPassengers / 3);
  const remainder = totalPassengers % 3;
  const k2 = Math.ceil(remainder / 2); // Если остаток 1 или 2 человека, нужна одна К2

  return { k3, k2 };
}

/**
 * Парсит сырую бронь из БД в типизированную структуру BookingGroup.
 * Поддерживает как новые поля (hasDog), так и старые комментарии (fallback).
 */
export function parseBookingGroup(booking: any): BookingGroup {
  const paidSeats = computePaidSeats(booking);
  const comment = (booking.comment || '').toLowerCase();

  // 1. Читаем флаги: приоритет у новых полей БД, fallback - регулярки по комментам
  let hasChildUnder7 = booking.hasChildUnder7 ?? (/ребёнок\s*до\s*7/i.test(comment));
  let hasDog = booking.hasDog ?? (/собака/i.test(comment));

  const passengers: Passenger[] = [];
  const guests = Array.isArray(booking.guests) ? booking.guests : [];

  // 2. Генерируем массив пассажиров
  if (guests.length > 0) {
    guests.forEach((g: any, i: number) => {
      passengers.push({
        name: g.name || `${booking.name} (Гость ${i + 1})`,
        ticketType: mapTicketType(g.ticketType || g.type),
        age: g.age ? Number(g.age) : undefined,
        hasDog: !!g.hasDog,
      });
    });
  } else {
    // Генерация "заглушек", если имена гостей не вписаны
    const baseName = booking.name || 'Участник';
    for (let i = 0; i < (booking.ticketsAdult || 0); i++) passengers.push({ name: `${baseName} (Взр)`, ticketType: 'adult' });
    for (let i = 0; i < (booking.ticketsChild || 0); i++) passengers.push({ name: `${baseName} (Дет)`, ticketType: 'child' });
    for (let i = 0; i < (booking.ticketsMember || 0); i++) passengers.push({ name: `${baseName} (Клуб)`, ticketType: 'member' });
    for (let i = 0; i < (booking.ticketsFamily || 0); i++) {
      passengers.push({ name: `${baseName} (Сем-Взр)`, ticketType: 'family' });
      passengers.push({ name: `${baseName} (Сем-Взр)`, ticketType: 'family' });
      passengers.push({ name: `${baseName} (Сем-Реб)`, ticketType: 'family' });
    }
  }

  // 3. Финальная проверка флагов по возрасту конкретных гостей
  if (!hasChildUnder7 && passengers.some(p => p.age !== undefined && p.age < 7)) hasChildUnder7 = true;
  if (!hasDog && passengers.some(p => p.hasDog)) hasDog = true;

  return {
    bookingId: booking.id,
    shortId: booking.shortId || 0,
    name: booking.name || 'Без имени',
    comment: booking.comment || '',
    passengers,
    paidSeats,
    hasChildUnder7,
    hasDog,
    phone: booking.phone,
    memberName: booking.member?.name,
    adultsCount: booking.ticketsAdult || 0,
    childCount: booking.ticketsChild || 0,
    memberCount: booking.ticketsMember || 0,
    familyCount: booking.ticketsFamily || 0,
  };
}

// ==========================================
// 3. АЛГОРИТМ РАССАДКИ (Core Engine)
// ==========================================

export function assignBoatsWithPassengers(
  groups: BookingGroup[],
  k3Count: number,
  k2Count: number,
  guidesCount: number
): AssignmentResult {
  const warnings = new Set<string>(); // Set исключает дублирование одинаковых варнингов
  const boats: Boat[] = [];
  const unassignedPassengers: BoatPassenger[] = [];

  // 1. Инициализация флота
  for (let i = 1; i <= k3Count; i++) boats.push({ id: `K3-${i}`, type: 'K3', index: i, paidCapacity: 3, bonusCapacity: 1, assignedPassengers: [], guideAssigned: false });
  for (let i = 1; i <= k2Count; i++) boats.push({ id: `K2-${i}`, type: 'K2', index: i, paidCapacity: 2, bonusCapacity: 1, assignedPassengers: [], guideAssigned: false });

  // 2. Сортировка групп: сначала семьи с малышами, затем по убыванию размера (3 -> 2 -> 1)
  const sortedGroups = [...groups].sort((a, b) => {
    if (a.hasChildUnder7 !== b.hasChildUnder7) return a.hasChildUnder7 ? -1 : 1;
    return b.paidSeats - a.paidSeats;
  });

  // 3. Рассадка пассажиров
  for (const group of sortedGroups) {
    // ВЗРЫВ ГРУППЫ: Если людей больше 3, ломаем бронь на пассажиров и кидаем на берег
    if (group.paidSeats > 3) {
      warnings.add(`⚠️ Семья/группа "${group.name}" (${group.paidSeats} чел.) слишком велика для одной лодки. Пассажиры оставлены на берегу.`);
      unassignedPassengers.push(...createBoatPassengers(group));
      continue;
    }

    // Ищем первую подходящую лодку, куда влезет вся группа целиком
    const targetBoat = boats.find(b => getAvailableSeats(b) >= group.paidSeats);

    if (targetBoat) {
      targetBoat.assignedPassengers.push(...createBoatPassengers(group));
    } else {
      warnings.add(`❌ Не хватило байдарок для группы "${group.name}". Добавьте флот.`);
      unassignedPassengers.push(...createBoatPassengers(group));
    }
  }

  // 4. Интеграция Гидов (создаем их как физические карточки пассажиров)
  for (let i = 1; i <= guidesCount; i++) {
    const guidePassenger: BoatPassenger = {
      bookingId: `sys-guide-${i}`, // Системный ID брони
      passengerId: `guide-${i}`,   // Системный ID пассажира
      shortId: 0,
      name: `🚣 Гид ${i}`,
      isChild: false,
      isChildUnder7: false,
      hasDog: false
    };

    // Умный поиск места для гида: сначала ищем лодку, где УЖЕ есть клиенты, но осталось место.
    // Если таких нет — сажаем в любую пустую.
    const bestBoatForGuide = 
      boats.find(b => b.assignedPassengers.length > 0 && getAvailableSeats(b) >= 1) ||
      boats.find(b => getAvailableSeats(b) >= 1);

    if (bestBoatForGuide) {
      bestBoatForGuide.assignedPassengers.push(guidePassenger);
      bestBoatForGuide.guideAssigned = true;
    } else {
      warnings.add(`⚠️ Мест для Гида ${i} не осталось. Добавьте флот.`);
      unassignedPassengers.push(guidePassenger);
    }
  }

  return { 
    boats, 
    unassignedPassengers, 
    warnings: Array.from(warnings) 
  };
}