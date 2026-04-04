// src/features/admin/actions/inquiries.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { InquiryStatus } from '@prisma/client';
// 1. Меняем импорт: берем нашу новую обертку
import { withAdminAuth } from '@/lib/auth';

// 2. Оборачиваем функцию в withAdminAuth и делаем ее стрелочной
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

// 3. Аналогично для обновления статуса
export const updateInquiryStatusAction = withAdminAuth(async (id: string, status: InquiryStatus) => {
  try {
    await prisma.inquiry.update({ where: { id }, data: { status } });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Update Inquiry Status Error:', error);
    return { success: false, error: 'Не удалось обновить статус' };
  }
});

// 4. И для удаления
export const deleteInquiryAction = withAdminAuth(async (id: string) => {
  try {
    await prisma.inquiry.delete({ where: { id } });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Delete Inquiry Error:', error);
    return { success: false, error: 'Ошибка удаления' };
  }
});