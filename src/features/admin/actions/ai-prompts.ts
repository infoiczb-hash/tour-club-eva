// src/features/admin/actions/ai-prompts.ts
'use server';

import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Строгая Zod-схема с защитой от пробелов и лимитами длины
const promptSchema = z.object({
  title: z.string().trim().min(1, 'Название обязательно').max(100, 'Название не более 100 символов'),
  prompt: z.string().trim().min(5, 'Промпт слишком короткий').max(5000, 'Промпт не более 5000 символов')
});

export const getAiPromptsAction = withAdminAuth(async () => {
  try {
    const prompts = await prisma.aiPrompt.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100 // Защита от перегрузки памяти (Пагинация/Лимит)
    });
    return { success: true, data: prompts };
  } catch (error) {
    console.error("getAiPromptsAction Error:", error);
    return { success: false, error: 'Ошибка загрузки шаблонов' };
  }
});

export const saveAiPromptAction = withAdminAuth(async (title: string, prompt: string) => {
  try {
    const parsed = promptSchema.safeParse({ title, prompt });
    
   if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Ошибка валидации' };
    }

    const newPrompt = await prisma.aiPrompt.create({
      data: parsed.data
    });
    
    return { success: true, data: newPrompt };
  } catch (error) {
    console.error("saveAiPromptAction Error:", error);
    return { success: false, error: 'Ошибка сохранения шаблона' };
  }
});

// Добавлен недостающий Update Action для полноты CRUD
export const updateAiPromptAction = withAdminAuth(async (id: string, title: string, prompt: string) => {
  try {
    const parsed = promptSchema.safeParse({ title, prompt });
    
  if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Ошибка валидации' };
    }

    const updatedPrompt = await prisma.aiPrompt.update({
      where: { id },
      data: parsed.data
    });
    
    return { success: true, data: updatedPrompt };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: 'Шаблон не найден' };
    }
    console.error("updateAiPromptAction Error:", error);
    return { success: false, error: 'Ошибка обновления шаблона' };
  }
});

export const deleteAiPromptAction = withAdminAuth(async (id: string) => {
  try {
    await prisma.aiPrompt.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    // Перехват исключения P2025, если запись уже была удалена
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: 'Шаблон уже удален или не существует' };
    }
    console.error("deleteAiPromptAction Error:", error);
    return { success: false, error: 'Ошибка удаления шаблона' };
  }
});