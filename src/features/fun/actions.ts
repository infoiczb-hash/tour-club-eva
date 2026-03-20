// src/features/fun/actions.ts
'use server';

import { getTours } from '@/features/tours/api';

export async function getToursForQuizAction() {
  try {
    return await getTours();
  } catch (error) {
    console.error("Failed to fetch tours", error);
    return [];
  }
}