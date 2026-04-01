// src/app/account/bookings/[id]/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, MapPin, Users, Phone, MessageCircle, 
  CalendarClock, Lock, CheckSquare 
} from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatTourDate } from "@/utils/date";

import { PaymentActionBlock } from "@/features/account/components/PaymentActionBlock";
import TourLegalLinks from "@/features/tours/components/TourDetails/TourLegalLinks";

export default async function BookingDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!profile) redirect("/login");

  // === ГЛАВНОЕ ИСПРАВЛЕНИЕ ===
  const booking = await prisma.booking.findUnique({
    where: { 
      id: params.id,
      memberId: profile.id 
    },
    include: {
      tour: true,
      tourDate: true,
    }
  });

  if (!booking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <Lock className="w-16 h-16 text-slate-600 mb-6" />
        <h1 className="text-2xl font-black text-white mb-2">Билет не найден</h1>
        <p className="text-slate-400 mb-8 max-w-xs">Этот билет либо не существует, либо не принадлежит вам.</p>
        <Link href="/account" className="px-8 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl transition-all">
          Вернуться в кабинет
        </Link>
      </div>
    );
  }

  const guests = (booking.guests as any[]) || [];
  const status = booking.status.toLowerCase();

  const tourDateObj = booking.tourDate;
  const dateStr = tourDateObj?.startDate ? formatTourDate(new Date(tourDateObj.startDate)) : "Дата уточняется";
  const timeStr = tourDateObj?.time || "—";
  const startPoint = tourDateObj?.meetingPoint || booking.tour.meetingPoint || booking.tour.location || "Уточняется";

  const checklist = Array.isArray(booking.tour.checklist) ? booking.tour.checklist : [];

  const showChatButton = (status === 'confirmed' || (status === 'pending' && booking.paymentMethod === 'cash')) 
    && tourDateObj?.groupChatUrl;

  const displayId = booking.shortId ? String(booking.shortId) : booking.id.substring(0, 6).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto pb-12 px-4">
      <Link href="/account" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-bold transition-colors">
        <ChevronLeft size={18} /> Назад к билетам
      </Link>

      {/* Основная карточка билета */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Шапка */}
        <div className="p-6 border-b border-white/10 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">{booking.tour.title}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
              <MapPin size={16} />
              <span>{startPoint}</span>
            </div>
          </div>

          {/* Статус */}
          <div className={`px-5 py-2 rounded-2xl text-sm font-bold uppercase tracking-wider
            ${status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 
              status === 'awaiting_payment' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 
              'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
            {status === 'confirmed' ? 'Оплачено' : 
             status === 'awaiting_payment' ? 'Ждёт оплаты' : 
             status === 'moderation' ? 'Проверка чека' : 'Новая'}
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Дата и время */}
          <div className="flex items-center gap-4 bg-slate-800/50 rounded-2xl p-4">
            <CalendarClock className="text-teal-400" size={24} />
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold">Дата и время</p>
              <p className="text-lg font-bold text-white">{dateStr} • {timeStr}</p>
            </div>
          </div>

          {/* QR-код */}
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-2xl shadow-inner">
              {/* Здесь можно оставить твой компонент MemberQrCode, если хочешь */}
              <div className="w-40 h-40 bg-slate-100 rounded-xl flex items-center justify-center">
                <span className="text-xs text-slate-500 text-center">QR-код<br/>для гида</span>
              </div>
            </div>
          </div>

          {/* Участники */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users size={15} /> Участники ({guests.length || 1})
            </p>
            <div className="space-y-3">
              {guests.length > 0 ? guests.map((g: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-slate-800/30 rounded-xl px-4 py-3">
                  <span className="font-medium">{g.name}</span>
                  <span className="text-xs text-slate-400">{g.ticketType || 'Взрослый'}</span>
                </div>
              )) : (
                <div className="bg-slate-800/30 rounded-xl px-4 py-3 font-medium">
                  {booking.name} (вы)
                </div>
              )}
            </div>
          </div>

          {/* Что взять с собой */}
          {checklist.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Что взять с собой</p>
              <div className="grid grid-cols-1 gap-2">
                {checklist.map((item: any, i: number) => (
                  <div key={i} className="flex gap-3 bg-slate-800/30 rounded-2xl p-4">
                    <CheckSquare className="text-teal-400 mt-0.5" size={18} />
                    <div>
                      <p className="font-medium text-white text-sm">{item.title}</p>
                      <p className="text-xs text-slate-300 mt-1">{item.items}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Экономика */}
          <PaymentActionBlock 
            bookingId={booking.id}
            shortId={booking.shortId || 0}
            status={booking.status}
            paymentMethod={booking.paymentMethod || 'cash'}
            totalPrice={booking.totalPrice}
            amountPaid={booking.amountPaid}
            currency={booking.tour.currency || 'MDL'}
            receiptUrl={booking.receiptUrl}
            biletpmrLink={booking.tour.biletpmrLink}
            apbQrLink={booking.tour.apbQrLink}
            apbQrImage={booking.tour.apbQrImage}
          />
        </div>
      </div>

      <TourLegalLinks />
    </div>
  );
}