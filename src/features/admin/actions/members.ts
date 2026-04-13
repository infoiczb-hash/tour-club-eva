'use server';

import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { logSystemAction } from '@/lib/audit';

export interface GetMembersParams {
  page: number;
  limit?: number;
  search?: string;
  level?: string;
}

/**
 * Получение списка всех участников для таблицы
 */
export const getMembersAction = withAdminAuth(async (params: GetMembersParams) => {
  const { page, limit = 20, search, level } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.MemberProfileWhereInput = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { telegram: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (level) {
    where.level = level;
  }

  try {
    const [members, total] = await Promise.all([
      prisma.memberProfile.findMany({
        where,
        orderBy: { joinedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          avatarUrl: true,
          level: true,
          totalTours: true,
          balance: true,
          joinedAt: true,
        }
      }),
      prisma.memberProfile.count({ where }),
    ]);

    return { success: true, members, total };
  } catch (error: any) {
    console.error('getMembersAction error:', error);
    return { success: false, error: 'Ошибка при загрузке списка участников' };
  }
});

/**
 * Получение детальной информации об участнике для Drawer
 */
export const getMemberDetailsAction = withAdminAuth(async (memberId: string) => {
  try {
    const member = await prisma.memberProfile.findUnique({
      where: { id: memberId },
      include: {
        bookings: { 
          include: { 
            tour: {
              select: { title: true }
            } 
          },
          orderBy: { createdAt: 'desc' }
        },
        reviews: true,
      }
    });

    if (!member) return { success: false, error: 'Профиль участника не найден' };
    
    return { success: true, data: member };
  } catch (error: any) {
    console.error('getMemberDetailsAction error:', error);
    return { success: false, error: error.message || 'Ошибка при получении данных участника' };
  }
});

/**
 * Ручное изменение баланса участника (бонусов)
 */
export const adjustBalanceAction = withAdminAuth(async (memberId: string, amount: number, reason: string) => {
  try {
    // 1. Обновляем баланс
    const updatedMember = await prisma.memberProfile.update({
      where: { id: memberId },
      data: { 
        balance: { increment: amount } 
      }
    });

    // 2. Логируем действие в системный аудит
    await logSystemAction('MEMBER_BALANCE_ADJUSTED', {
      targetId: memberId,
      changes: { 
        adjustment: amount, 
        reason: reason, 
        newTotalBalance: updatedMember.balance 
      }
    });

    return { success: true, data: updatedMember };
  } catch (error: any) {
    console.error('adjustBalanceAction error:', error);
    return { success: false, error: error.message || 'Ошибка при изменении баланса' };
  }
});