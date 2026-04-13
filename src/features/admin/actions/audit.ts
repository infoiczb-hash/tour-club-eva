// src/features/admin/actions/audit.ts
'use server';

import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth';
import { ActorType } from '@prisma/client';

export interface GetLogsParams {
  page: number;
  limit?: number;
  actorType?: 'USER' | 'SYSTEM' | 'ALL';
  search?: string;
}

export const getAdminLogsAction = withAdminAuth(async (params: GetLogsParams) => {
  const { page, limit = 50, actorType, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (actorType && actorType !== 'ALL') {
    where.actorType = actorType;
  }

  if (search) {
    where.OR = [
      { actorName: { contains: search, mode: 'insensitive' } },
      { actionName: { contains: search, mode: 'insensitive' } },
      { targetId: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminLog.count({ where }),
    ]);

    return { success: true, logs, total };
  } catch (error) {
    console.error('Fetch logs error:', error);
    return { success: false, error: 'Ошибка при загрузке логов', logs: [], total: 0 };
  }
});