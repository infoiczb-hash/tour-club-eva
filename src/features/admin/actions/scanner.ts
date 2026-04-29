// src/features/admin/actions/scanner.ts
'use server';

import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { BookingStatus } from '@prisma/client';

// --- ТИПЫ ДЛЯ ВОЗВРАЩАЕМЫХ ДАННЫХ (DTO) ---
export type ScannedBookingDTO = {
  id: string;
  shortId:  string;
  status: BookingStatus;
  userName: string;
  userPhone: string;
  totalTickets: number;
  totalPrice: number;
  amountPaid: number;
  discount: number;
  currency: string;
  paymentMethod: string | null;
  checkedIn: boolean;
  checkedInAt: Date | null;
  tour: { title: string };
  tourDate: { startDate: Date; time: string | null } | null;
};

export type ScannedMemberDTO = {
  id: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  level: string;
  balance: number;
  totalTours: number;
};

export type ScanResult = 
  | { success: true; type: 'booking'; data: ScannedBookingDTO }
  | { success: true; type: 'member'; data: ScannedMemberDTO }
  | { success: false; error: string };

/**
 * Вспомогательная функция для безопасного извлечения параметров из строки сканирования
 */
function parseQrUrl(rawText: string): { type: 'booking' | 'member' | null, value: string | null } {
  try {
    const url = new URL(rawText, process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club');
    const b = url.searchParams.get('b');
    const m = url.searchParams.get('m');
    
    if (b) return { type: 'booking', value: b };
    if (m) return { type: 'member', value: m };
  } catch {
    // Если это не URL, а просто строка (например, ввели вручную "123")
    if (/^\d+$/.test(rawText.trim())) return { type: 'booking', value: rawText.trim() };
  }
  
  return { type: null, value: null };
}

/**
 * Проверяет, является ли строка валидным UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * 1. Универсальный обработчик отсканированного QR-кода
 */
export const processScanAction = withAdminAuth(async (qrText: string): Promise<ScanResult> => {
  try {
    if (!qrText || !qrText.trim()) {
      return { success: false, error: 'QR-код пуст' };
    }

    const { type, value } = parseQrUrl(qrText);

    if (!type || !value) {
      return { success: false, error: 'Неверный формат QR-кода. Ожидается билет или клубная карта.' };
    }

    // --- СЦЕНАРИЙ А: БИЛЕТ (БРОНЬ) ---
      if (type === 'booking') {
        // value — это либо строка shortId (например "A4F9"), либо UUID (id)
        const isUUID = isValidUUID(value);

        // Делаем ОДИН запрос. TypeScript идеально запомнит тип благодаря const
        const booking = await prisma.booking.findFirst({
          where: isUUID ? { id: value } : { shortId: value.toUpperCase() },
          include: {
            tour: { select: { title: true, currency: true } },
            tourDate: { select: { startDate: true, time: true } }
          }
        });

        if (booking) {
          const totalTickets = 
            (booking.ticketsAdult || 0) + 
            (booking.ticketsChild || 0) + 
            (booking.ticketsMember || 0) + 
            ((booking.ticketsFamily || 0) * 3);

          return { 
            success: true, 
            type: 'booking', 
            data: {
              id: booking.id,
              shortId: booking.shortId,
              status: booking.status,
              userName: booking.name,
              userPhone: booking.phone,
              totalTickets,
              totalPrice: booking.totalPrice,
              amountPaid: booking.amountPaid,
              discount: booking.discount,
              currency: booking.tour.currency || 'RUB',
              paymentMethod: booking.paymentMethod,
              checkedIn: (booking as any).checkedIn || false, 
              checkedInAt: (booking as any).checkedInAt || null,
              tour: { title: booking.tour.title },
              tourDate: booking.tourDate
                ? { startDate: booking.tourDate.startDate, time: booking.tourDate.time }
                : null
            } 
          };
        }
      }
    // --- СЦЕНАРИЙ Б: УЧАСТНИК КЛУБА (MEMBER) ---
    if (type === 'member') {
      // memberId всегда UUID
      if (!isValidUUID(value)) {
        return { success: false, error: 'Неверный формат ID участника' };
      }
      const member = await prisma.memberProfile.findUnique({
        where: { id: value },
        select: {
          id: true, name: true, phone: true, avatarUrl: true, 
          level: true, balance: true, totalTours: true
        }
      });

      if (member) {
        return { success: true, type: 'member', data: member };
      }
    }

    return { success: false, error: 'Запись не найдена в базе данных' };
  } catch (error: unknown) {
    console.error('Scanner Process Error:', error);
    return { success: false, error: 'Внутренняя ошибка при расшифровке QR-кода' };
  }
});

/**
 * 2. Отметка присутствия (Чекин)
 */
export const checkInBookingAction = withAdminAuth(
  withAdminAudit({
    actionName: 'CHECK_IN_BOOKING',
    getTargetId: (bookingId: string) => bookingId,
  })(async (bookingId: string) => {
    try {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId }});
      if (!booking) throw new Error('Бронь не найдена');

      const isCurrentlyCheckedIn = (booking ).checkedIn || false;

      await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          checkedIn: !isCurrentlyCheckedIn, 
          checkedInAt: !isCurrentlyCheckedIn ? new Date() : null 
        } 
      });
      
      revalidatePath('/admin');
      
      return { 
        success: true, 
        checkedIn: !isCurrentlyCheckedIn 
      };
    } catch (error: unknown) {
      console.error('CheckIn Error:', error);
      return { success: false, error: 'Ошибка при отметке присутствия' };
    }
  })
);