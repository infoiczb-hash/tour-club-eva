// src/features/admin/actions/members.ts
'use server';

import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActorType } from '@prisma/client';

// ─── Типы ────────────────────────────────────────────────────────────────────

export type MemberSortField = 'joinedAt' | 'totalTours' | 'balance' | 'updatedAt';
export type MemberFilterLevel = 'all' | 'Первопроходец' | 'Искатель' | 'Следопыт' | 'Мастер троп' | 'Легенда';
export type MemberFilterActivity = 'all' | 'active' | 'sleeping'; // active = тур за 90 дней

export interface GetMembersParams {
  search?: string;
  level?: MemberFilterLevel;
  activity?: MemberFilterActivity;
  page?: number;
  limit?: number;
  sortBy?: MemberSortField;
  sortDir?: 'asc' | 'desc';
}

// ─── 1. Список участников (таблица) ──────────────────────────────────────────

export const getMembersAction = withAdminAuth(async (params: GetMembersParams = {}) => {
  try {
    const {
      search = '',
      level = 'all',
      activity = 'all',
      page = 1,
      limit = 30,
      sortBy = 'joinedAt',
      sortDir = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const where: any = {};

    // Поиск по имени / телефону / telegram
    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { telegram: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Фильтр по уровню
    if (level !== 'all') {
      where.level = level;
    }

    // Фильтр по активности (тур за последние 90 дней)
    if (activity === 'active') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      where.bookings = {
        some: {
          status: 'confirmed',
          createdAt: { gte: ninetyDaysAgo },
        },
      };
    } else if (activity === 'sleeping') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      where.NOT = {
        bookings: {
          some: {
            status: 'confirmed',
            createdAt: { gte: ninetyDaysAgo },
          },
        },
      };
    }

    const [membersRaw, total] = await Promise.all([
      prisma.memberProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortDir },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          telegram: true,
          avatarUrl: true,
          level: true,
          totalTours: true,
          totalKm: true,
          balance: true,
          role: true,
          joinedAt: true,
          updatedAt: true,
          tgChatId: true,
          _count: {
            select: { bookings: true, reviews: true },
          },
        },
      }),
      prisma.memberProfile.count({ where }),
    ]);

    // Добавляем заглушку для tags, чтобы UI не падал, пока мы не добавим их в схему БД
    const members = membersRaw.map(m => ({ ...m, tags: [] }));

    return { success: true, members, total, page, limit };
  } catch (error) {
    console.error('getMembersAction error:', error);
    return { success: false, error: 'Ошибка загрузки участников' };
  }
});

// ─── 2. Детальный профиль участника (drawer) ─────────────────────────────────

export const getMemberDetailAction = withAdminAuth(async (memberId: string) => {
  try {
    const memberRaw = await prisma.memberProfile.findUnique({
      where: { id: memberId },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            tour: { select: { title: true, slug: true, coverImage: true, location: true } },
            tourDate: { select: { startDate: true, endDate: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            tour: { select: { title: true, slug: true } },
          },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        watchLists: {
          include: {
            tour: { select: { title: true, slug: true, coverImage: true } },
          },
        },
        waitlists: {
          include: {
            tour: { select: { title: true, slug: true } },
            tourDate: { select: { startDate: true } },
          },
        },
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        promoCode: true,
      },
    });

    if (!memberRaw) {
      return { success: false, error: 'Участник не найден' };
    }

    // 🔥 ИЗВЛЕКАЕМ ИСТОРИЮ БАЛАНСА ИЗ НАШЕЙ ТАБЛИЦЫ ЛОГОВ
    const balanceLogs = await prisma.adminLog.findMany({
      where: {
        targetId: memberId,
        action: 'MEMBER_BALANCE_ADJUSTED'
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Агрегируем финансы
    const confirmedBookings = memberRaw.bookings.filter(b => b.status === 'confirmed');
    const totalSpent = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalBookings = memberRaw.bookings.length;

    // Считаем рефералов
    const referralsCount = memberRaw.promoCode
      ? await prisma.booking.count({
          where: { promoCodeId: memberRaw.promoCode.id },
        })
      : 0;

    const member = { ...memberRaw, tags: [], balanceLogs };

    return {
      success: true,
      member,
      stats: {
        totalSpent,
        totalBookings,
        confirmedCount: confirmedBookings.length,
        referralsCount,
      },
    };
  } catch (error) {
    console.error('getMemberDetailAction error:', error);
    return { success: false, error: 'Ошибка загрузки профиля' };
  }
});

// ─── 3. Начислить / списать баланс ───────────────────────────────────────────

export const adjustBalanceAction = withAdminAuth(async (
  memberId: string,
  amount: number,        
  reason: string,
  adminNote?: string,
) => {
  try {
    if (amount === 0) return { success: false, error: 'Сумма не может быть 0' };
    if (!reason.trim()) return { success: false, error: 'Укажите причину' };

    const result = await prisma.$transaction(async (tx) => {
      // Проверяем что баланс не уйдёт в минус при списании
      if (amount < 0) {
        const current = await tx.memberProfile.findUnique({
          where: { id: memberId },
          select: { balance: true },
        });
        if (!current) throw new Error('Участник не найден');
        if (current.balance + amount < 0) {
          throw new Error(`Недостаточно баланса. Текущий: ${current.balance} ₽`);
        }
      }

      const updated = await tx.memberProfile.update({
        where: { id: memberId },
        data: { balance: { increment: amount } },
        select: { balance: true, name: true },
      });

      // Пишем в наш универсальный лог (ВМЕСТО BalanceLog)
      await tx.adminLog.create({
        data: {
          actorType: ActorType.ADMIN,
          action: 'MEMBER_BALANCE_ADJUSTED',
          targetId: memberId,
          changes: {
            amount,
            reason,
            adminNote: adminNote || null,
            newBalance: updated.balance
          },
        },
      });

      return updated;
    });

    revalidatePath('/admin');
    return { success: true, newBalance: result.balance, name: result.name };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Ошибка операции с балансом';
    console.error('adjustBalanceAction error:', error);
    return { success: false, error: msg };
  }
});

// ─── 4. Сменить уровень вручную ───────────────────────────────────────────────

export const updateMemberLevelAction = withAdminAuth(async (
  memberId: string,
  level: string,
) => {
  try {
    await prisma.memberProfile.update({
      where: { id: memberId },
      data: { level },
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('updateMemberLevelAction error:', error);
    return { success: false, error: 'Ошибка обновления уровня' };
  }
});