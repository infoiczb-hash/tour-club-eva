// src/features/admin/actions/inquiries.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { InquiryStatus } from '@prisma/client';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit'; //   Добавлено ядро аудита

// ЧТЕНИЕ: Аудит не нужен
export const getInquiriesAction = withAdminAuth(async () => {
  try {
    // Внутри больше нет await requireAuth()! Обертка уже проверила права.
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: inquiries };
  } catch (error) {
    console.error('Get Inquiries Error:', error);
    return { success: false, error: 'Ошибка загрузки обращений', data: [] };
  }
});

// ОБНОВЛЕНИЕ: Завернуто в аудит
export const updateInquiryStatusAction = withAdminAuth(
  withAdminAudit({
    actionName: 'UPDATE_INQUIRY_STATUS',
    getTargetId: (id: string, _status: InquiryStatus) => id,
  })(async (id: string, status: InquiryStatus) => {
    try {
      await prisma.inquiry.update({ where: { id }, data: { status } });
      revalidatePath('/admin');
      return { success: true };
    } catch (error) {
      console.error('Update Inquiry Status Error:', error);
      return { success: false, error: 'Не удалось обновить статус' };
    }
  })
);

// УДАЛЕНИЕ: Завернуто в аудит
export const deleteInquiryAction = withAdminAuth(
  withAdminAudit({
    actionName: 'DELETE_INQUIRY',
    getTargetId: (id: string) => id,
  })(async (id: string) => {
    try {
      await prisma.inquiry.delete({ where: { id } });
      revalidatePath('/admin');
      return { success: true };
    } catch (error) {
      console.error('Delete Inquiry Error:', error);
      return { success: false, error: 'Ошибка удаления' };
    }
  })
);