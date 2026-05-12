'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Bell, CheckCircle2, AlertCircle, XCircle, Gift, Info, CheckCheck,
} from 'lucide-react';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../actions/notifications';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: string;
  title: string | null;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Монтирование — нужно для createPortal (SSR safe)
  useEffect(() => {
    setIsMounted(true);
    setIsMobile(window.innerWidth < 768);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchNotifications = async () => {
    const res = await getUserNotifications();
    if (res.success) {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Закрытие по клику вне обоих элементов (кнопка + дропдаун)
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  // Закрытие по Escape + блокировка скролла на мобиле
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onEsc);
    if (isMobile) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    setIsOpen(false);
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'error':   return <XCircle      className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertCircle  className="w-5 h-5 text-amber-400" />;
      case 'bonus':   return <Gift         className="w-5 h-5 text-purple-400" />;
      default:        return <Info         className="w-5 h-5 text-sky-400" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'error':   return 'bg-red-500/10 border-red-500/20';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'bonus':   return 'bg-purple-500/10 border-purple-500/20';
      default:        return 'bg-sky-500/10 border-sky-500/20';
    }
  };

  // ── Содержимое дропдауна ─────────────────────────────────────────────────
  const dropdownContent = (
    <>
      {/* Затемнение — только мобиле */}
      <div
        className="fixed inset-0 z-[998] bg-black/50 md:hidden"
        onClick={() => setIsOpen(false)}
      />

      {/* Панель */}
      <div
        ref={dropdownRef}
        className={cn(
          'z-[999] bg-slate-900 border border-white/8 shadow-2xl overflow-hidden',
          // Мобиле — bottom sheet прибит к низу viewport
          'fixed bottom-0 left-0 right-0 rounded-t-3xl',
          // Десктоп — позиционируем через style относительно кнопки
          'md:fixed md:bottom-auto md:left-auto md:rounded-2xl md:w-96',
        )}
        style={!isMobile && buttonRef.current ? (() => {
          const rect = buttonRef.current!.getBoundingClientRect();
          return {
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          };
        })() : undefined}
      >
        {/* Drag handle (мобиле) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
          <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
            Уведомления
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-teal-500/15 text-teal-400 text-xs rounded-full border border-teal-500/20 font-bold">
                {unreadCount}
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Прочитать все
            </button>
          )}
        </div>

        {/* Список */}
        <div className="max-h-[60vh] md:max-h-[420px] overflow-y-auto overscroll-contain">
          {notifications.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-300 font-bold text-sm">Пока тихо 🏔</p>
              <p className="text-slate-500 text-xs mt-1">Новые уведомления появятся здесь</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || '#'}
                  onClick={() => handleMarkAsRead(n.id, n.isRead)}
                  className={cn(
                    'flex items-start gap-3 px-5 py-4 border-b border-white/5 transition-colors active:bg-white/5',
                    n.isRead ? 'hover:bg-white/3' : 'bg-teal-500/5 hover:bg-teal-500/8'
                  )}
                >
                  {/* Иконка */}
                  <div className={cn(
                    'flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center mt-0.5',
                    getIconBg(n.type)
                  )}>
                    {getIcon(n.type)}
                  </div>

                  {/* Текст */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm leading-snug',
                      n.isRead ? 'font-medium text-slate-300' : 'font-bold text-white'
                    )}>
                      {n.title || 'Уведомление'}
                    </p>
                    <p className={cn(
                      'text-xs mt-1 leading-relaxed line-clamp-2',
                      n.isRead ? 'text-slate-500' : 'text-slate-300'
                    )}>
                      {n.message}
                    </p>
                    <span className="text-[11px] text-slate-500 mt-1.5 block">
                      {new Date(n.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Индикатор непрочитанного */}
                  {!n.isRead && (
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-teal-400 rounded-full shadow-[0_0_6px_rgba(45,212,191,0.5)]" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Подвал */}
        <Link
          href="/account/notifications"
          onClick={() => setIsOpen(false)}
          className="block px-5 py-4 text-xs font-black uppercase tracking-widest text-center text-slate-400 hover:text-white bg-slate-950/50 transition-colors border-t border-white/5"
        >
          Смотреть все →
        </Link>
      </div>
    </>
  );

  return (
    <div className="relative">
      {/* ── Колокольчик ───────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-full hover:bg-white/5 transition-colors"
        aria-label="Уведомления"
        aria-expanded={isOpen}
      >
        <Bell className={cn(
          'w-6 h-6 transition-colors',
          isOpen ? 'text-white' : 'text-slate-400 hover:text-white'
        )} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-0.5 text-xs  font-black text-white bg-teal-500 border-2 border-slate-900 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Портал — рендерим прямо в body, минуя любые родители ─── */}
      {isOpen && isMounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}