// src/app/account/bookings/[id]/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, MapPin, Users, Phone, 
  MessageCircle, AlertTriangle, 
  Info, CalendarClock, Lock, Backpack,
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

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  const baseClasses = "px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-widest border";
  
  if (s === "pending") return <span className={`${baseClasses} bg-amber-500/10 text-amber-400 border-amber-500/20`}>Новая (Наличные)</span>;
  if (s === "cancelled") return <span className={`${baseClasses} bg-slate-500/10 text-slate-300 border-slate-500/20`}>Отменено</span>;
  if (s === "awaiting_payment") return <span className={`${baseClasses} bg-sky-500/10 text-sky-400 border-sky-500/20`}>Ожидает оплаты</span>;
  if (s === "moderation") return <span className={`${baseClasses} bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse`}>Проверка чека</span>;
  if (s === "rejected") return <span className={`${baseClasses} bg-rose-500/10 text-rose-400 border-rose-500/20`}>Оплата отклонена</span>;
  if (s === "confirmed") return <span className={`${baseClasses} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>Оплачено</span>;
  return <span className={`${baseClasses} bg-slate-800 text-slate-300`}>{status}</span>;
}

export default async function BookingDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!profile) redirect("/login");

  // ✅ ЗАПРОС: Тянем всё, включая meetingPoint и чек-листы
  const booking = await prisma.booking.findFirst({
    where: { id: params.id, memberId: profile.id },
    include: {
      tour: true,
      tourDate: true
    }
  });

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock className="w-16 h-16 text-slate-700 mb-6" />
        <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Доступ закрыт</h1>
        <Link href="/account" className="px-6 py-3 bg-teal-500 text-slate-900 font-bold uppercase tracking-widest text-xs rounded-xl">Вернуться</Link>
      </div>
    );
  }

  const guests = (booking.guests as Guest[]) || [];
  const status = booking.status.toLowerCase();
  
  // ✅ ЛОГИСТИКА: Синхронизируем дату и старт
  const tourDateObj = booking.tourDate;
  const dateStr = tourDateObj?.startDate ? formatTourDate(new Date(tourDateObj.startDate)) : "Даты уточняются";
  const timeStr = tourDateObj?.time || "08:00";
  const startPoint = tourDateObj?.meetingPoint || booking.tour.meetingPoint || booking.tour.location || "Уточняется менеджером";

  // ✅ ЧЕК-ЛИСТ: Парсим из базы
  const checklist = Array.isArray(booking.tour.checklist) ? booking.tour.checklist : [];

  // ✅ ЛОГИКА ЧАТА: Показываем если Оплачено ИЛИ (Новая + Наличные)
  const showChatButton = (status === 'confirmed' || (status === 'pending' && booking.paymentMethod === 'cash')) && tourDateObj?.groupChatUrl;

  const displayId = booking.shortId ? String(booking.shortId) : booking.id.substring(0, 5).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in duration-500 px-4">
      
      <Link href="/account" className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-6 text-sm font-bold uppercase tracking-widest transition-colors">
        <ChevronLeft size={16} /> Назад к билетам
      </Link>

      <div className="space-y-6">
        {/* 🎫 БИЛЕТ-КАРТОЧКА */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="absolute left-0 top-[120px] -translate-x-1/2 w-6 h-6 bg-slate-950 rounded-full border-r border-white/5" />
          <div className="absolute right-0 top-[120px] translate-x-1/2 w-6 h-6 bg-slate-950 rounded-full border-l border-white/5" />
          
          <div className="p-6 sm:p-8 border-b border-white/5 border-dashed relative">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div className="flex-1">
                <div className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Booking Reference #{displayId}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight uppercase italic tracking-tighter">
                  {booking.tour.title}
                </h1>
              </div>
              <div className="flex flex-col items-end gap-3">
                {getStatusBadge(booking.status)}
                {/* ✅ ЕДИНЫЙ QR КОД */}
                <div className="p-2 bg-white rounded-xl shadow-lg">
                   <QRCode size={80} value={`https://evatur.club/admin/scan?id=${displayId}`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                <CalendarClock className="text-teal-500 mb-2" size={18} />
                <p className="text-[12px] text-slate-400 uppercase font-bold tracking-widest mb-1">Дата и Время старта</p>
                <p className="text-sm font-bold text-white">{dateStr} в {timeStr}</p>
              </div>
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                <MapPin className="text-teal-500 mb-2" size={18} />
                <p className="text-[12px] text-slate-400 uppercase font-bold tracking-widest mb-1">Точка сбора</p>
                <p className="text-sm font-bold text-white leading-snug">{startPoint}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-slate-950 space-y-8">
            
            {/* ✅ СЕКРЕТНЫЙ ЧАТ ГРУППЫ */}
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
                <p className="text-center text-[12px] text-slate-400 uppercase font-bold mt-3 tracking-wider">
                  Там будет вся оперативная инфо от гида
                </p>
              </div>
            )}

            {/* УЧАСТНИКИ */}
            <div>
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Users size={14} /> Список участников
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {guests.length > 0 ? guests.map((guest, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-black text-xs">{idx + 1}</div>
                      <p className="text-sm font-bold text-white">{guest.name} <span className="text-[12px] text-slate-400 uppercase ml-2">{guest.ticketType}</span></p>
                    </div>
                    {guest.equipment && (
                      <span className="px-2 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded text-[9px] font-bold uppercase tracking-tighter">
                        🦺 Жилет: {guest.equipment}
                      </span>
                    )}
                  </div>
                )) : (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-black text-xs">1</div>
                    <p className="text-sm font-bold text-white">{booking.name} <span className="text-[12px] text-slate-400 uppercase ml-2">Заказчик</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ ЧЕК-ЛИСТ (Что взять) */}
            {checklist.length > 0 && (
              <div>
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <CheckSquare size={14} /> Что взять с собой
                </h3>
                <div className="bg-slate-950/40 rounded-2xl p-5 border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {checklist.map((block: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <p className="text-[12px] font-black text-teal-500 uppercase tracking-wider">{block.title}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{block.items}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ЭКОНОМИКА И ОПЛАТА */}
            <div>
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Info size={14} /> Экономика билета
              </h3>
              <div className="bg-slate-950 rounded-2xl p-6 border border-white/5 space-y-4 mb-6">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Стоимость:</span><span className="text-white font-bold">{booking.totalPrice} {booking.tour.currency}</span></div>
                {booking.discount > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Скидка:</span><span className="font-bold">-{booking.discount} {booking.tour.currency}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-slate-400">Оплачено:</span><span className="text-white font-bold">{booking.amountPaid} {booking.tour.currency}</span></div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between items-center"><span className="text-slate-300 font-bold">Остаток:</span><span className="text-teal-400 font-black text-xl">{Math.max(0, booking.totalPrice - booking.discount - booking.amountPaid)} {booking.tour.currency}</span></div>
              </div>
              
              <PaymentActionBlock 
                bookingId={booking.id}
                shortId={booking.shortId || 0}
                status={booking.status}
                paymentMethod={booking.paymentMethod || 'cash'}
                totalPrice={booking.totalPrice - booking.discount}
                amountPaid={booking.amountPaid}
                currency={booking.tour.currency || 'MDL'}
                receiptUrl={booking.receiptUrl}
                biletpmrLink={booking.tour.biletpmrLink}
                apbQrLink={booking.tour.apbQrLink}
                apbQrImage={booking.tour.apbQrImage}
              />
            </div>
          </div>
        </div>

        {/* ✅ ПРАВОВОЙ БЛОК */}
        <TourLegalLinks />

        {/* ПОДДЕРЖКА */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300"><AlertTriangle size={20} /></div>
            <div>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Нужна помощь?</p>
              <p className="text-sm font-bold text-white">Служба заботы Турклуба</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a href="tel:+37377770141" className="flex-1 sm:flex-none px-6 py-3 bg-white/5 text-white rounded-xl text-[12px] font-black uppercase tracking-widest transition-all hover:bg-white/10 flex items-center justify-center gap-2">
              <Phone size={14} /> Звонок
            </a>
            <a href="https://t.me/romansvtirase" target="_blank" rel="noreferrer" className="flex-1 sm:flex-none px-6 py-3 bg-[#2AABEE]/10 text-[#2AABEE] rounded-xl text-[12px] font-black uppercase tracking-widest transition-all hover:bg-[#2AABEE]/20 flex items-center justify-center gap-2">
              <MessageCircle size={14} /> Написать
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}