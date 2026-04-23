'use server';

import { prisma } from '@/lib/prisma';
import { parseBookingGroup, assignBoatsWithPassengers } from '@/features/kayaking/kayakLogic';
import { BookingGroup, Assignment } from '@/features/kayaking/types';
import { sendManifestToTelegramAction } from './manifest';

export type ActionResponse<T = any> = { success: boolean; data?: T; error?: string };

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
        _count: { select: { bookings: { where: { status: 'confirmed' } } } },
      },
      orderBy: { startDate: 'asc' },
    });
    return { success: true, data: { tourDates } };
  } catch (error) {
    return { success: false, error: 'Ошибка загрузки дат' };
  }
}

export async function getBoatAssignments(tourDateId: string): Promise<ActionResponse> {
  try {
    const tourDate = await prisma.tourDate.findUnique({
      where: { id: tourDateId },
      include: {
        bookings: {
          where: { status: 'confirmed' },
          include: { member: { select: { name: true, phone: true } } },
        },
        boatAssignments: true,
      },
    });

    if (!tourDate) return { success: false, error: 'Дата не найдена' };

    const k2Count = tourDate.boatsK2Count || 0;
    const k3Count = tourDate.boatsK3Count || 0;
    const guidesCount = tourDate.guidesCount || (k2Count + k3Count > 12 ? 2 : 1);
    const groups: BookingGroup[] = tourDate.bookings.map(b => parseBookingGroup(b));

    if (tourDate.boatAssignments.length > 0) {
      const assignments = tourDate.boatAssignments.map(a => ({
        bookingId: a.bookingId,
        passengerId: (a as any).passengerId,
        passengerName: (a as any).passengerName,
        boatType: a.boatType,
        boatIndex: a.boatIndex
      }));
      return { success: true, data: { assignments, unassigned: [], groups, boatsK2Count: k2Count, boatsK3Count: k3Count, guidesCount, warnings: [] } };
    }

    const { boats, unassignedPassengers, warnings } = assignBoatsWithPassengers(groups, k3Count, k2Count, guidesCount);
    const assignments = boats.flatMap(b => b.assignedPassengers.map(p => ({
      bookingId: p.bookingId, passengerId: p.passengerId, passengerName: p.name, boatType: b.type, boatIndex: b.index
    })));

    return { success: true, data: { assignments, unassigned: unassignedPassengers, groups, warnings, boatsK2Count: k2Count, boatsK3Count: k3Count, guidesCount } };
  } catch (error) {
    return { success: false, error: 'Ошибка загрузки рассадки' };
  }
}

export async function updateTourDateBoats(tourDateId: string, boatsK2Count: number, boatsK3Count: number, guidesCount: number): Promise<ActionResponse> {
  try {
    await prisma.tourDate.update({
      where: { id: tourDateId },
      data: { boatsK2Count, boatsK3Count, guidesCount }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Ошибка сохранения настроек' };
  }
}

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
    return { success: false, error: 'Ошибка сохранения в базу' };
  }
}

export async function sendKayakingManifest(tourDateId: string): Promise<ActionResponse> {
  try {
    const tourDate = await prisma.tourDate.findUnique({
      where: { id: tourDateId },
      include: {
        tour: true,
        bookings: { where: { status: 'confirmed' }, include: { member: true } },
        boatAssignments: true,
      },
    });
    
    if (!tourDate) return { success: false, error: 'Дата не найдена' };

    const assignmentsMap = new Map<string, string[]>();
    for (const a of tourDate.boatAssignments) {
      const key = `${a.boatType}-${a.boatIndex}`;
      if (!assignmentsMap.has(key)) assignmentsMap.set(key, []);
      assignmentsMap.get(key)!.push((a as any).passengerName);
    }

    let boatSection = '\n🚣 РАССАДКА ПО ЛОДКАМ:\n';
    if (assignmentsMap.size === 0) {
      boatSection += '\n⚠️ Рассадка не назначена\n';
    } else {
      for (const [boatKey, names] of assignmentsMap) {
        boatSection += `\n<b>${boatKey}</b>: ${names.join(', ')}\n`;
      }
    }

    const participants = tourDate.bookings.flatMap((b) => {
      const main = {
        name: b.name, phone: b.phone, comment: b.comment, status: b.status,
        ticketType: 'adult', isMain: true, bookingId: b.id, shortId: b.shortId,
      };
      const guests = (b.guests as any[])?.map((g) => ({
        name: g.name, ticketType: g.ticketType || 'adult', phone: g.phone, age: g.age,
        isMain: false, bookingId: b.id, shortId: b.shortId,
      })) || [];
      return [main, ...guests];
    });

    const totalTickets = tourDate.bookings.reduce((sum, b) => {
      return sum + (b.ticketsAdult || 0) + (b.ticketsChild || 0) + (b.ticketsMember || 0) + ((b.ticketsFamily || 0) * 3);
    }, 0);

    const manifestResult = await sendManifestToTelegramAction({
      tourName: tourDate.tour.title,
      date: tourDate.startDate.toLocaleDateString('ru-RU'),
      totalTickets,
      participants,
    });

    if (!manifestResult.success) return { success: false, error: manifestResult.error };

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_MANIFEST_CHAT_ID;
    
    if (botToken && chatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🚣‍♀️ *Рассадка для тура*: ${tourDate.tour.title}\n📅 *Дата*: ${tourDate.startDate.toLocaleDateString('ru-RU')}\n${boatSection}`,
          parse_mode: 'HTML',
        }),
      });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Ошибка манифеста' };
  }
}