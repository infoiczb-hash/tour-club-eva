import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, MapPin, Users, Phone, 
  MessageCircle, AlertTriangle, 
  Info, CalendarClock, Lock,
  CheckSquare, MessageSquare
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatTourDate } from "@/utils/date";
import QRCode from "react-qr-code"; // Настоящий QR-код

// Компоненты
import { PaymentActionBlock } from "@/features/account/components/PaymentActionBlock";
import TourLegalLinks from "@/features/tours/components/TourDetails/TourLegalLinks"; 

type Guest = {
  name: string;
  ticketType?: string;
  equipment?: string;
  [key: string]: unknown;
};

// UI-функция из старого файла (бейджи статусов)
function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  const baseClasses = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border";
  
  if (s === "pending") return <span className={`${baseClasses} bg-amber-500/10 text-amber-400 border-amber-500/20`}>Новая (Наличные)</span>;
  if (s === "cancelled") return <span className={`${baseClasses} bg-slate-500/10 text-slate-300 border-slate-500/20`}>Отменено</span>;
  if (s === "awaiting_payment") return <span className={`${baseClasses} bg-sky-500/10 text-sky-400 border-sky-500/20`}>Ожидает оплаты</span>;
  if (s === "moderation") return <span className={`${baseClasses} bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse`}>Проверка чека</span>;
  if (s === "rejected") return <span className={`${baseClasses} bg-rose-500/10 text-rose-400 border-rose-500/20`}>Оплата отклонена</span>;
  if (s === "confirmed") return <span className={`${baseClasses} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>Оплачено</span>;
  return <span className={`${baseClasses} bg-slate-800 text-slate-300`}>{status}</span>;
}

// ✅ 1. ЛОГИКА 2026: params как Promise
export default async function BookingDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // ✅ 2. ЛОГИКА 2026: Извлекаем ID через await
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ✅ 3. БЕЗОПАСНАЯ ЛОГИКА И СТРОГАЯ ДИЕТА: 1 запрос вместо 2
  const booking = await prisma.booking.findFirst({
    where: { 
      id: id, 
      member: { userId: user.id } 
    },
    include: {
      tourDate: true,
      tour: {
        select: {
          title: true,
          meetingPoint: true,
          location: true,
          checklist: true,
          currency: true,
          biletpmrLink: true,
          apbQrLink: true,
          apbQrImage: true
        }
      }
    }
  });

  if (!booking) {
    return (
   <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock className="w-16 h-16 text-slate-400 mb-6" />
        <h1 className="text-2xl font-black text-ui-text mb-2 uppercase tracking-tight">Доступ закрыт</h1>
        <p className="text-slate-300 mb-8 max-w-xs">Этот билет либо не существует, либо не принадлежит вам.</p>
        <Link href="/account" className="px-6 py-3 bg-ui-accent hover:bg-ui-accent/80 transition-colors text-ui-bg font-bold uppercase tracking-widest text-xs rounded-xl">Вернуться в кабинет</Link>
      </div>
    );
  }

  const guests = (booking.guests as Guest[]) || [];
  const status = booking.status.toLowerCase();
  
  // Логистика: Синхронизируем дату и старт
  const tourDateObj = booking.tourDate;
  const dateStr = tourDateObj?.startDate ? formatTourDate(new Date(tourDateObj.startDate)) : "Даты уточняются";
  const timeStr = tourDateObj?.time || "08:00";
  const startPoint = tourDateObj?.meetingPoint || booking.tour.meetingPoint || booking.tour.location || "Уточняется менеджером";

  // Чек-лист: Парсим из базы (с правильной типизацией для TypeScript)
  const checklist = Array.isArray(booking.tour.checklist) 
    ? (booking.tour.checklist as { title: string; items: string }[]) 
    : [];

 // Логика чата: Показываем если Оплачено ИЛИ (Новая + Наличные)
  const showChatButton = (status === 'confirmed' || (status === 'pending' && booking.paymentMethod === 'cash')) && tourDateObj?.groupChatUrl;

  const displayId = booking.shortId ? String(booking.shortId) : booking.id.substring(0, 5).toUpperCase();

  // --- ЛОГИКА ПОДТВЕРЖДЕНИЯ УЧАСТИЯ ---
  const isUnpaid = booking.paymentMethod === 'cash' || booking.paymentMethod === 'foreign';
  const startDate = tourDateObj?.startDate ? new Date(tourDateObj.startDate) : null;
  let daysToTour = 999;
  if (startDate) {
    daysToTour = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  }
 const isConfirmed = booking.isAttendanceConfirmed;
  const showConfirmUI = isUnpaid && daysToTour <= 3 && daysToTour >= 0 && !isConfirmed;
  // ------------------------------------

  // ✅ 4. ИДЕАЛЬНЫЙ UI ИЗ ТВОЕГО ОРИГИНАЛА (Одноколоночный дизайн билета)
  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in duration-500 px-4">
      
   <Link href="/account" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 mb-6 text-sm font-bold uppercase tracking-widest transition-colors">
        <ChevronLeft size={16} /> Назад к билетам
      </Link>

 <div className="space-y-6">
        {/* 🎫 БИЛЕТ-КАРТОЧКА */}
        <div className="bg-ui-panel border border-ui-border rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="p-6 sm:p-8 border-b border-ui-border border-dashed relative">
            {/* Декоративные надрезы — привязаны к нижней границе секции */}
            <div className="absolute left-0 bottom-0 translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-ui-bg rounded-full border-r border-ui-border z-10" />
            <div className="absolute right-0 bottom-0 translate-y-1/2 translate-x-1/2 w-6 h-6 bg-ui-bg rounded-full border-l border-ui-border z-10" />
            {/* Шапка: название + статус */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-ui-accent uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-ui-accent animate-pulse" />
                  Booking Reference #{displayId}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-ui-text leading-tight uppercase italic tracking-tighter">
                  {booking.tour.title}
                </h1>
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(booking.status)}
              </div>
            </div>
            {/* QR — отдельной строкой, центрирован на мобиле */}
            <div className="flex justify-center sm:justify-start mb-8">
              <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-ui-panel">
                <QRCode
                  size={120}
                  value={`BOOKING:${booking.id}`}
                  level="H"
                />
              </div>
            </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-ui-bg/50 rounded-2xl p-4 border border-ui-border">
                <CalendarClock className="text-ui-accent mb-2" size={18} />
                <p className="text-xs text-slate-300 uppercase font-bold tracking-widest mb-1">Дата и Время старта</p>
                <p className="text-sm font-bold text-ui-text">{dateStr} в {timeStr}</p>
              </div>
              <div className="bg-ui-bg/50 rounded-2xl p-4 border border-ui-border">
                <MapPin className="text-ui-accent mb-2" size={18} />
                <p className="text-xs text-slate-300 uppercase font-bold tracking-widest mb-1">Точка сбора</p>
                <p className="text-sm font-bold text-ui-text leading-snug">{startPoint}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-gradient-to-b from-ui-panel to-ui-bg space-y-8">

            {/* БЛОК ПОДТВЕРЖДЕНИЯ (Появляется за 3 дня) */}
            {showConfirmUI && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-black text-xl shadow-lg">⚠️</div>
                    <h3 className="font-black text-amber-500 uppercase tracking-widest text-sm sm:text-base">
                      Нужно подтверждение
                    </h3>
                  </div>
                  <p className="text-amber-200 text-sm leading-relaxed mb-6 font-medium">
                    Вы выбрали <b className="text-amber-400">оплату на месте</b>. Пожалуйста, подтвердите своё участие, чтобы мы закрепили за вами место в трансфере и не аннулировали бронь.
                  </p>
                  
                  <form action={async () => {
                    'use server';
                    // Динамически импортируем экшен, чтобы не засорять верхний уровень файла
                    const { confirmBookingAttendance } = await import('@/features/account/actions/confirmBookingAttendance');
                    await confirmBookingAttendance(booking.id);
                  }}>
                    <button className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-ui-bg font-black py-4 px-6 rounded-2xl text-sm uppercase tracking-wide transition-all shadow-lg shadow-amber-500/20">
                      ✅ Я точно буду
                    </button>
                  </form>
                </div>
              </div>
            )}

            {isConfirmed && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-lg">✅</div>
                <p className="text-emerald-400 text-sm font-bold uppercase tracking-wide leading-snug">
                  Участие подтверждено.<br/>До встречи на старте!
                </p>
              </div>
            )}
            
            {/* СЕКРЕТНЫЙ ЧАТ ГРУППЫ */}
            {showChatButton && (
              <div className="animate-in slide-in-from-bottom-4 duration-700">
                <a 
                  href={tourDateObj.groupChatUrl!} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-[#2AABEE] hover:bg-[#229ED9] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-[#2AABEE]/20 transition-all active:scale-95"
                >
                  <MessageSquare size={20} /> Вступить в чат группы
                </a>
                <p className="text-center text-sm text-slate-300 font-medium mt-3">
                  Там будет вся оперативная инфо от гида
                </p>
              </div>
            )}

            {/* УЧАСТНИКИ */}
            <div>
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Users size={14} /> Список участников
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {guests.length > 0 ? guests.map((guest, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-black text-xs">{idx + 1}</div>
                    <p className="text-sm font-bold text-slate-100 truncate">{guest.name} <span className="text-sm text-slate-400 uppercase ml-2">{guest.ticketType}</span></p>
                    </div>
                    {guest.equipment && (
                      <span className="flex-shrink-0 px-2 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded text-xs font-bold uppercase tracking-tighter">
                        🦺 Жилет: {guest.equipment}
                      </span>
                    )}
                  </div>
                )) : (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-black text-xs">1</div>
                    <p className="text-sm font-bold text-white">{booking.name} <span className="text-sm text-slate-300 uppercase ml-2">Заказчик</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* ЧЕК-ЛИСТ (Что взять) */}
{checklist.length > 0 && (
  <div>
    <h3 className="text-sm font-black text-slate-300 uppercase tracking-wide flex items-center gap-2 mb-4">
      <CheckSquare size={14} /> Что взять с собой
    </h3>
    <div className="bg-ui-panel/40 rounded-2xl p-5 border border-ui-border grid grid-cols-1 sm:grid-cols-2 gap-3">
      {checklist.map((block, i) => (
        <div key={i} className="space-y-1">
          <p className="text-sm font-black text-teal-500 uppercase tracking-wide">{block.title}</p>
          <p className="text-sm text-slate-300 leading-relaxed">{block.items}</p>
        </div>
      ))}
    </div>
  </div>
)}

{/* ЭКОНОМИКА И ОПЛАТА */}
<div>
  <h3 className="text-sm font-black text-slate-300 uppercase tracking-wide flex items-center gap-2 mb-4">
    <Info size={14} /> Экономика билета
  </h3>
  <div className="bg-ui-panel rounded-2xl p-6 border border-ui-border space-y-4 mb-6">
    <div className="flex justify-between text-sm"><span className="text-slate-300">Стоимость:</span><span className="text-slate-100 font-bold">{booking.totalPrice} {booking.tour.currency}</span></div>
    {booking.discount > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Скидка:</span><span className="font-bold">-{booking.discount} {booking.tour.currency}</span></div>}
    <div className="flex justify-between text-sm"><span className="text-slate-300">Оплачено:</span><span className="text-slate-100 font-bold">{booking.amountPaid} {booking.tour.currency}</span></div>
    {/* Линия-разделитель теперь использует системный цвет границ */}
    <div className="h-px bg-ui-border" />
    <div className="flex justify-between items-center"><span className="text-slate-300 font-bold">Остаток:</span><span className="text-teal-400 font-black text-xl">{Math.max(0, booking.totalPrice - booking.discount - booking.amountPaid)} {booking.tour.currency}</span></div>
  </div>
         
              <PaymentActionBlock 
                bookingId={booking.id}
                shortId={booking.shortId || '0000'}
                status={booking.status}
                paymentMethod={booking.paymentMethod || 'cash'}
                totalPrice={booking.totalPrice - booking.discount}
                amountPaid={booking.amountPaid}
                currency={booking.tour.currency || 'RUB'}
                receiptUrl={booking.receiptUrl}
                biletpmrLink={booking.tour.biletpmrLink}
                apbQrLink={booking.tour.apbQrLink}
                apbQrImage={booking.tour.apbQrImage}
              />
            </div>
          </div>
        </div>

        {/* ПРАВОВОЙ БЛОК */}
        <TourLegalLinks />

      {/* ПОДДЕРЖКА */}
<div className="bg-ui-panel/50 border border-ui-border rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 mt-4">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-2xl bg-ui-surface flex items-center justify-center text-slate-300"><AlertTriangle size={20} /></div>
    <div>
      <p className="text-sm font-black text-slate-300 uppercase tracking-wide mb-0.5">Нужна помощь?</p>
      <p className="text-sm font-bold text-slate-100">Служба заботы Турклуба</p>
    </div>
  </div>
  <div className="flex items-center gap-2 w-full sm:w-auto">
    <a href="tel:+37377770141" className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-white/5 text-slate-100 rounded-xl text-sm font-black uppercase tracking-wide transition-all hover:bg-white/10 flex items-center justify-center gap-2">
      <Phone size={14} /> Звонок
    </a>
    <a href="https://t.me/romansvtirase" target="_blank" rel="noreferrer" className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-[#2AABEE]/10 text-[#2AABEE] rounded-xl text-sm font-black uppercase tracking-wide transition-all hover:bg-[#2AABEE]/20 flex items-center justify-center gap-2">
      <MessageCircle size={14} /> Написать
    </a>
  </div>
        </div>
      </div>
    </div>
  );
}