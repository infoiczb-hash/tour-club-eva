'use client';

import { useState, useEffect, useRef } from 'react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Закрытие по клику вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Закрытие по Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setIsOpen(false);
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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

  return (
    <div className="relative" ref={dropdownRef}>

      {/* ── Колокольчик ─────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/5 transition-colors"
        aria-label="Уведомления"
      >
        <Bell className={cn(
          "w-6 h-6 transition-colors",
          isOpen ? "text-white" : "text-slate-400 hover:text-white"
        )} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-0.5 text-[10px] font-black text-white bg-teal-500 border-2 border-slate-900 rounded-full shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Дропдаун ────────────────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Затемнение на мобиле */}
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/*
            Мобиле: фиксированный слой на весь экран снизу (bottom sheet)
            Десктоп: обычный дропдаун справа от кнопки
          */}
          <div className={cn(
            "z-50 bg-slate-900 border border-white/8 shadow-2xl overflow-hidden",
            // Мобиле — bottom sheet
            "fixed bottom-0 left-0 right-0 rounded-t-3xl",
            // Десктоп — дропдаун
            "md:absolute md:bottom-auto md:left-auto md:right-0 md:top-full md:mt-2 md:w-96 md:rounded-2xl"
          )}>

            {/* Шапка */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              {/* Мобильный drag-handle */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full md:hidden" />
              <h3 className="font-black text-white text-sm uppercase tracking-wider mt-1 md:mt-0">
                Уведомления
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-teal-500/15 text-teal-400 text-xs rounded-full border border-teal-500/20">
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
                        n.isRead
                          ? 'hover:bg-white/3'
                          : 'bg-teal-500/5 hover:bg-teal-500/8'
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
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
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
      )}
    </div>
  );
}