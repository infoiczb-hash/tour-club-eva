'use client';

import { useRef, useEffect } from 'react';

interface Props {
  next: string;
}

export default function TelegramLoginWidget({ next }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Очищаем контейнер, чтобы скрипт не задублировался при HMR в Next.js
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    // Твой юзернейм бота
    script.setAttribute('data-telegram-login', 'authevaclub_bot'); 
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12'); // Скругляем углы
    
    // 🔥 ИСПРАВЛЕНИЕ: Передаем безопасный URL для callback-а с прикрепленным параметром next
    // Используем encodeURIComponent для безопасной передачи пути через URL
    const authUrl = `${window.location.origin}/api/auth/telegram?next=${encodeURIComponent(next)}`;
    script.setAttribute('data-auth-url', authUrl);
    
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    containerRef.current.appendChild(script);
  }, [next]); // Добавили next в массив зависимостей, чтобы скрипт обновлялся, если путь изменится

return (
  <div
    ref={containerRef}
    role="region"
    aria-label="Войти через Telegram"
    className="flex justify-center w-full bg-slate-800/50 py-3 rounded-xl border border-white/10 min-h-[50px]"
  />
);
}