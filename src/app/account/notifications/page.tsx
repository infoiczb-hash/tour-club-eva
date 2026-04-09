import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, XCircle, Gift, Info, Bell, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Уведомления | ЭВА Турклуб',
};

export default async function NotificationsPage() {
  // 1. Проверяем авторизацию
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Ищем профиль туриста
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!profile) {
    redirect('/account');
  }

  // 3. Достаем последние 100 уведомлений (этого хватит за глаза на несколько лет)
  const notifications = await prisma.notification.findMany({
    where: { memberId: profile.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // 4. Магия UX: если есть непрочитанные, гасим их прямо в момент открытия страницы
  const hasUnread = notifications.some(n => !n.isRead);
  if (hasUnread) {
    await prisma.notification.updateMany({
      where: { memberId: profile.id, isRead: false },
      data: { isRead: true }
    });
  }

  // 5. Выбор иконки
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'error': return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning': return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'bonus': return <Gift className="w-6 h-6 text-purple-500" />;
      default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Кнопка "Назад" для мобилок */}
      <Link 
        href="/account" 
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        В личный кабинет
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
          <Bell className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Уведомления
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-900/50 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {notifications.length === 0 ? (
           <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium">
             У вас пока нет уведомлений 🏔
           </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {notifications.map((n) => {
              const content = (
                <div className={`flex items-start gap-4 p-5 md:p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <p className={`text-base ${!n.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                        {n.title}
                      </p>
                      <span className="text-xs font-medium text-gray-400 sm:text-right">
                        {new Date(n.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className={`text-sm ${!n.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="flex-shrink-0 w-2.5 h-2.5 mt-2.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                  )}
                </div>
              );

              return n.link ? (
                <Link key={n.id} href={n.link} className="block group">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}