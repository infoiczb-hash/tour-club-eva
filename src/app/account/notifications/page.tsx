import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, XCircle, Gift, Info, Bell, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Уведомления | ЭВА Турклуб',
};

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) redirect('/account');

  const notifications = await prisma.notification.findMany({
    where: { memberId: profile.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Помечаем все как прочитанные при открытии страницы
  const hasUnread = notifications.some(n => !n.isRead);
  if (hasUnread) {
    await prisma.notification.updateMany({
      where: { memberId: profile.id, isRead: false },
      data: { isRead: true },
    });
  }

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
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-10 px-4 md:px-0">

      {/* ── Заголовок ───────────────────────────────────────────── */}
      <div>
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider mb-5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          В личный кабинет
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-inner shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Уведомления
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {notifications.length > 0
                ? `${notifications.length} уведомлений`
                : 'Все уведомления'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Список ──────────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-white/5 rounded-3xl overflow-hidden shadow-lg">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 mb-4">
              <Bell className="w-7 h-7" />
            </div>
            <p className="text-white font-bold text-base">Пока тихо 🏔</p>
            <p className="text-slate-400 text-sm mt-1 max-w-xs leading-relaxed">
              Здесь появятся уведомления о ваших турах и бонусах
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((n) => {
              const wasUnread = !n.isRead;

              const content = (
                <div className={`
                  flex items-start gap-4 p-5 md:p-6 transition-colors
                  ${wasUnread ? 'bg-teal-500/5' : ''}
                  hover:bg-white/3
                `}>
                  {/* Иконка типа */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner ${getIconBg(n.type)}`}>
                    {getIcon(n.type)}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                      <p className="text-sm font-bold text-white leading-snug">
                        {n.title || 'Уведомление'}
                      </p>
                      <span className="text-xs text-slate-500 sm:text-right shrink-0">
                        {new Date(n.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {/* Индикатор непрочитанного */}
                  {wasUnread && (
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                  )}
                </div>
              );

              return n.link ? (
                <Link key={n.id} href={n.link} className="block transition-colors">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}