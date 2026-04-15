// src/app/admin/scan/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminScanRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const bookingId = searchParams.get('b');
    const memberId = searchParams.get('m');

    // Формируем URL для редиректа в основную админку
    // Мы передаем параметры b или m, чтобы AdminDashboard знал, что нужно открыть вкладку сканера с результатом
    let targetUrl = '/admin?tab=scan';
    
    if (bookingId) targetUrl += `&b=${bookingId}`;
    if (memberId) targetUrl += `&m=${memberId}`;

    router.replace(targetUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <Loader2 size={48} className="animate-spin text-teal-500 mb-4" />
      <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
        Обработка QR-кода...
      </h1>
      <p className="text-sm text-slate-700 mt-2">
        Перенаправляем в панель управления
      </p>
    </div>
  );
}