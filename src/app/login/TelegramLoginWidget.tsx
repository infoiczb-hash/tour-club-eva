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
    
    // Передаем URL для callback-а на наш сервер
    // При желании можно прокинуть параметр next в API роут, если он умеет его читать:
    // `${window.location.origin}/api/auth/telegram?next=${encodeURIComponent(next)}`
    script.setAttribute('data-auth-url', `${window.location.origin}/api/auth/telegram`);
    
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    containerRef.current.appendChild(script);
  }, [next]);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center w-full bg-slate-800/50 py-3 rounded-xl border border-white/10 min-h-[50px]"
    />
  );
}