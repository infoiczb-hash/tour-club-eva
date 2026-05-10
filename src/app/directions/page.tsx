import React from 'react';
import DirectionsClient from './DirectionsClient';

/**
 * Оптимизация производительности:
 * 1. Чистый Server Component. HTML улетает в браузер мгновенно.
 * 2. revalidate = 86400 (ISR) — кэширует страницу на 24 часа.
 * 3. Metadata наследуется из родительского layout.tsx (устраняем дублирование).
 */
export const revalidate = 86400; 

export default function DirectionsPage() {
  return <DirectionsClient />;
}