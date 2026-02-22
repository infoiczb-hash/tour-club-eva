'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { InquiryStatus } from '@prisma/client';

export async function getInquiriesAction() {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' }, // Свежие сверху
    });
    return { success: true, data: inquiries };
  } catch (error) {
    console.error("Get Inquiries Error:", error);
    return { success: false, error: "Ошибка загрузки обращений" };
  }
}

export async function updateInquiryStatusAction(id: string, status: InquiryStatus) {
  try {
    await prisma.inquiry.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Не удалось обновить статус" };
  }
}

export async function deleteInquiryAction(id: string) {
    try {
      await prisma.inquiry.delete({ where: { id } });
      revalidatePath('/admin');
      return { success: true };
    } catch (error) {
      return { success: false, error: "Ошибка удаления" };
    }
}