"use client";

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function AxeReporter() {
  useEffect(() => {
    // Работает только в режиме разработки (npm run dev)
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      import('@axe-core/react').then((axe) => {
        axe.default(React, ReactDOM, 1000); // 1000 - это задержка в 1 секунду
      });
    }
  }, []);

  return null; // Компонент не имеет визуальной части
}