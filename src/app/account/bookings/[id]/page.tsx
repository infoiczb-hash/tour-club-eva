import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, MapPin, Users, Phone, 
  MessageCircle, CreditCard, AlertTriangle, 
  Info, CalendarClock, ExternalLink, Lock, Backpack 
} from "lucide-react";
import QRCode from "react-qr-code"; // ✅ ДОБАВИЛИ НАСТОЯЩИЙ QR
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatTourDate } from "@/utils/date";

type Guest = {
  name: string;
  ticketType?: string;
  equipment?: string[];
  [key: string]: unknown;
};

function getStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "PENDING":
    case "ОЖИДАЕТ ОПЛАТЫ":
      return <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-widest">Ожидает оплаты</span>;
    case "CONFIRMED":
    case "ПОДТВЕРЖДЕНО":
      return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-widest">Подтверждено</span>;
    case "COMPLETED":
    case "ЗАВЕРШЕНО":
      return <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-widest">Завершено</span>;
    case "CANCELLED":
    case "ОТМЕНЕНО":
      return <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-widest">Отменено</span>;
    default:
      return <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-bold uppercase tracking-widest">{status}</span>;
  }
}

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // ✅ Запрашиваем бронь, плюс инфу о гиде (если она есть в tourDate)
  const booking = await prisma.booking.findUnique({
    where: { id: id },
    include: {
      tour: true,
      tourDate: {
        include: {
          guide: true // Пытаемся подтянуть гида, если связь настроена
        }
      } as any, // as any на случай если схема guide отличается, уберешь если TS ругается
    },
  });

  if (!booking) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 flex flex-col items-center justify-center text-center">
        <AlertTriangle size={64} className="text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Бронирование не найдено</h1>
        <p className="text-slate-400 mb-6">Возможно, оно было удалено или вы перешли по неверной ссылке.</p>
        <Link href="/account/bookings" className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase tracking-widest rounded-xl transition-colors">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  // Проверка чужой брони
  if (booking.memberId && booking.memberId !== session.user.id) {
    const profile = await prisma.memberProfile.findUnique({ where: { userId: session.user.id } });
    if (profile && booking.memberId !== profile.id) {
      return (
        <div className="w-full max-w-3xl mx-auto py-12 flex flex-col items-center justify-center text-center bg-slate-900/50 rounded-3xl border border-red-500/20 p-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h1>
          <p className="text-slate-400 mb-6">Эта бронь оформлена на другой аккаунт. Вы не можете просматривать ее детали.</p>
          <Link href="/account/bookings" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest rounded-xl transition-colors">
            Мои туры
          </Link>
        </div>
      );
    }
  }

  const guests = (booking.guests as unknown as Guest[]) || [];
  const tour = booking.tour;
  
  // ✅ ЛОГИКА СТАТУСА (Для показа чата)
  const isConfirmed = booking.status.toUpperCase() === 'CONFIRMED' || booking.status.toUpperCase() === 'ПОДТВЕРЖДЕНО';
  
  // ✅ БЕЗОПАСНЫЙ ID ДЛЯ QR-КОДА
  const displayId = (booking as any).shortId 
    ? (booking as any).shortId.toUpperCase() 
    : booking.id.slice(0, 8).toUpperCase();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* ─── ШАПКА ──────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <Link href="/account/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <ChevronLeft size={16} />
          Назад ко всем турам
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            {/* ✅ КЛИКАБЕЛЬНЫЙ ЗАГОЛОВОК С ИКОНКОЙ */}
            <Link 
              href={`/tour/${tour?.slug}`} 
              className="group inline-flex items-center gap-3 mb-2"
              title="Открыть описание тура"
            >
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-tight group-hover:text-teal-400 transition-colors">
                {tour?.title || "Неизвестный тур"}
              </h1>
              <ExternalLink size={24} className="text-slate-500 group-hover:text-teal-400 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
            </Link>

            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <CalendarClock size={18} className="text-teal-500 shrink-0" />
              {booking.tourDate ? (
                <span className="capitalize">
                  {formatTourDate(booking.tourDate.startDate, booking.tourDate.endDate)}
                </span>
              ) : (
                <span>Открытая дата</span>
              )}
              {tour?.duration && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{tour.duration}</span>
                </>
              )}
            </div>
          </div>
          <div className="shrink-0 mt-2 md:mt-0">
            {getStatusBadge(booking.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ─── ЛЕВАЯ КОЛОНКА (Организация, Участники, Снаряжение) ───────── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ЛОГИСТИКА И СВЯЗЬ */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 lg:p-8">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <MapPin className="text-teal-500" /> Организация маршрута
            </h2>
            
            <div className="space-y-6">
              {/* Точка сбора */}
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Точка сбора и время</div>
                <div className="text-white font-medium mb-3">
                  {tour?.meetingPoint || "Точное место сбора появится за 3 дня до старта"}
                </div>
                <button className="text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors">
                  📍 Открыть в Яндекс.Навигаторе
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ✅ УМНЫЙ БЛОК ГИДА */}
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex flex-col justify-center items-start gap-2">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Связь с гидом</div>
                  {(booking as any).tourDate?.guide ? (
                     <div className="text-white font-medium flex items-center gap-2">
                       <Phone size={16} className="text-teal-400" />
                       <span>{(booking as any).tourDate.guide.name}</span>
                     </div>
                  ) : (
                    <div className="text-slate-400 font-medium flex items-center gap-2">
                      <Phone size={16} className="text-slate-600" />
                      <span className="text-sm">Назначим гида скоро</span>
                    </div>
                  )}
                </div>

                {/* ✅ УМНЫЙ ЧАТ УЧАСТНИКОВ (Проверка статуса) */}
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex flex-col justify-center items-start gap-2">
                  <div className="text-xs text-blue-400/80 font-bold uppercase tracking-widest">Чат участников</div>
                  {isConfirmed ? (
                    <Link href="#" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      <MessageCircle size={16} />
                      <span className="text-sm border-b border-blue-400/30 hover:border-blue-300 pb-0.5">Войти в Telegram чат</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 font-medium" title="Чат доступен только после подтверждения оплаты">
                      <Lock size={14} className="text-slate-500" />
                      <span className="text-sm">После подтверждения</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* УЧАСТНИКИ */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 lg:p-8">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Users className="text-teal-500" /> Участники тура
            </h2>
            
            {guests && guests.length > 0 ? (
              <div className="space-y-3">
                {guests.map((guest, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-white font-bold">{guest.name || "Участник"}</span>
                      {guest.ticketType && (
                        <span className="text-xs text-slate-400">{guest.ticketType}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-slate-400 text-sm">
                Детальная информация об участниках не найдена.
              </div>
            )}
          </div>

          {/* ✅ НОВЫЙ БЛОК: СНАРЯЖЕНИЕ ДЛЯ ТУРА (Перенесен с Дашборда) */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 lg:p-8">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Backpack className="text-teal-500" /> Снаряжение для тура
            </h2>
            
            <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5">
              <p className="text-slate-300 text-sm mb-5 leading-relaxed">
                Сверьтесь со списком необходимых вещей от гида. Отметьте то, что уже собрали, чтобы ничего не забыть перед выездом.
              </p>
              
              <button className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-colors border border-white/5">
                Открыть чек-лист
              </button>
            </div>
          </div>

        </div>

        {/* ─── ПРАВАЯ КОЛОНКА (Талон и Финансы) ─────────────────────────── */}
        <div className="space-y-6">
          
          {/* ПОСАДОЧНЫЙ ТАЛОН */}
          <div className="bg-gradient-to-b from-teal-900 to-slate-900 border border-teal-500/30 rounded-3xl p-1 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="bg-slate-950/50 rounded-[22px] p-6 lg:p-8 flex flex-col items-center text-center relative z-10">
              <div className="text-xs text-teal-400 font-bold uppercase tracking-[0.2em] mb-4">Boarding Pass</div>
              
              {/* ✅ НАСТОЯЩИЙ QR-КОД */}
              <div className="bg-white p-2 rounded-2xl mb-4 shadow-lg inline-block">
                <QRCode 
                  size={140} 
                  value={`https://evatur.club/admin/scan?id=${displayId}`} 
                  viewBox={`0 0 140 140`} 
                  level="M"
                />
              </div>
              
              <div className="text-slate-300 font-mono text-sm tracking-widest mb-6 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                ID: {displayId}
              </div>
              
              <div className="flex items-start gap-2 text-left bg-teal-500/10 border border-teal-500/20 p-3 rounded-xl w-full">
                <Info size={16} className="text-teal-400 shrink-0 mt-0.5" />
                <p className="text-xs text-teal-100/70 leading-relaxed">
                  Этот талон доступен оффлайн. Он откроется даже без интернета на месте старта.
                </p>
              </div>
            </div>
          </div>

          {/* ФИНАНСЫ */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-slate-400" /> Оплата
            </h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Стоимость тура:</span>
                <span className="text-white font-medium">{booking.totalPrice?.toLocaleString('ru-RU')} ₽</span>
              </div>
              
              {/* ✅ Если есть скидка за бонусы */}
              {(booking as any).appliedBonuses > 0 && (
                <div className="flex justify-between items-center text-sm text-emerald-400">
                  <span>Скидка бонусами:</span>
                  <span className="font-medium">-{(booking as any).appliedBonuses} ₽</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Оплачено:</span>
                <span className="text-white font-medium">
                  {booking.amountPaid?.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="h-px w-full bg-slate-700/50 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Осталось:</span>
                <span className="text-amber-400 font-bold text-lg">
                  {((booking as any).finalPrice || booking.totalPrice - booking.amountPaid)?.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>
            
            {/* Кнопка доплаты, если статус PENDING */}
            {!isConfirmed && (
               <button className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold uppercase tracking-widest text-xs rounded-xl transition-colors">
                 Оплатить остаток
               </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}