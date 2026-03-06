'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { InquiryStatus } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

// Только для админа — список заявок
export async function getInquiriesAction() {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: inquiries };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Unauthorized', data: [] };
    console.error('Get Inquiries Error:', error);
    return { success: false, error: 'Ошибка загрузки обращений', data: [] };
  }
}

export async function updateInquiryStatusAction(id: string, status: InquiryStatus) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    await prisma.inquiry.update({ where: { id }, data: { status } });
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    return { success: false, error: 'Не удалось обновить статус' };
  }
}

export async function deleteInquiryAction(id: string) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    await prisma.inquiry.delete({ where: { id } });
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    return { success: false, error: 'Ошибка удаления' };
  }
}