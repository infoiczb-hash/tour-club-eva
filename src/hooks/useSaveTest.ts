// src/hooks/useSaveTest.ts
"use client";

import { useCallback } from 'react';
import { useToast } from '@/shared/context/ToastContext';
import { saveTestResult } from '@/features/account/actions/saveTestResult';

export function useSaveTest() {
  const { showToast } = useToast();

  const saveResult = useCallback(async (testSlug: string, resultData: any) => {
    try {
      const res = await saveTestResult({ testSlug, result: resultData });
      
      // Если экшен вернул needsAuth: true, значит юзер не залогинен
      if (res && !res.success && res.needsAuth) {
        showToast('Войдите в личный кабинет, чтобы результат сохранился навсегда', 'info');
      } else if (res && !res.success && res.error) {
        console.error('Ошибка сохранения теста:', res.error);
      }
    } catch (error) {
      console.error('Failed to save test result:', error);
    }
  }, [showToast]);

  return { saveResult };
}