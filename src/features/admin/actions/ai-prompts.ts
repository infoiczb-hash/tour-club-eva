// src/features/admin/actions/ai-prompts.ts
'use server';

import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth';
import { z } from 'zod';

export const getAiPromptsAction = withAdminAuth(async () => {
  try {
    const prompts = await prisma.aiPrompt.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: prompts };
  } catch (error) {
    console.error("getAiPromptsAction Error:", error);
    return { success: false, error: 'Ошибка загрузки шаблонов' };
  }
});

export const saveAiPromptAction = withAdminAuth(async (title: string, prompt: string) => {
  try {
    // Базовая Zod-валидация перед записью
    const schema = z.object({
      title: z.string().min(1),
      prompt: z.string().min(5)
    });
    const parsed = schema.safeParse({ title, prompt });
    
    if (!parsed.success) return { success: false, error: 'Некорректные данные' };

    const newPrompt = await prisma.aiPrompt.create({
      data: parsed.data
    });
    
    return { success: true, data: newPrompt };
  } catch (error) {
    console.error("saveAiPromptAction Error:", error);
    return { success: false, error: 'Ошибка сохранения шаблона' };
  }
});

export const deleteAiPromptAction = withAdminAuth(async (id: string) => {
  try {
    await prisma.aiPrompt.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("deleteAiPromptAction Error:", error);
    return { success: false, error: 'Ошибка удаления шаблона' };
  }
});