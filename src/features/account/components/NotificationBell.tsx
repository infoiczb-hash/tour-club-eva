'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, AlertCircle, XCircle, Gift, Info, CheckCheck } from 'lucide-react';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../actions/notifications';

interface NotificationBellProps {
  memberId: string;
}

export function NotificationBell({ memberId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🔥 ОБНОВЛЕННЫЙ БЛОК ЗАГРУЗКИ (С АВТООБНОВЛЕНИЕМ)
  useEffect(() => {
    const fetchNotifs = async () => {
      const res = await getUserNotifications(memberId);
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    };

    // 1. Загружаем сразу при открытии сайта
    fetchNotifs();

    // 2. Включаем тихий опрос сервера каждые 60 секунд (60000 мс)
    const intervalId = setInterval(fetchNotifs, 60000);

    // 3. Убиваем таймер, если пользователь ушел с сайта, чтобы не было утечек памяти
    return () => clearInterval(intervalId);
  }, [memberId]);

  // Закрываем по клику вне окна
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    
    // Оптимистичный UI (сразу гасим точку, не дожидаясь сервера)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    setIsOpen(false);

    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead(memberId);
  };

  // Выбираем иконку по типу
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'bonus': return <Gift className="w-5 h-5 text-purple-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* САМ КОЛОКОЛЬЧИК */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 border-2 border-white rounded-full dark:border-gray-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ВЫПАДАЮЩИЙ СПИСОК */}
      {isOpen && (
        <div className="absolute right-0 z-50 w-80 md:w-96 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden">
          
          {/* Шапка списка */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Уведомления</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <CheckCheck className="w-4 h-4" />
                Прочитать все
              </button>
            )}
          </div>

          {/* Список пушей */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                Нет новых уведомлений 🏔
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <Link 
                    key={n.id} 
                    href={n.link || '#'}
                    onClick={() => handleMarkAsRead(n.id, n.isRead)}
                    className={`flex items-start gap-3 p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-xs text-gray-400 mt-2 block">
                        {new Date(n.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Подвал со ссылкой на архив */}
          <Link 
            href="/account/notifications" 
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-sm text-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-50 dark:bg-gray-800/50 transition-colors border-t border-gray-100 dark:border-gray-800"
          >
            Смотреть все
          </Link>
        </div>
      )}
    </div>
  );
}