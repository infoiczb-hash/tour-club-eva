//  src/app/account/bookings/[id]/page.tsx

import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  Users,
  Phone,
  MessageCircle,
  AlertTriangle,
  Info,
  CalendarClock,
  Lock,
  CheckSquare,
  MessageSquare,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatTourDate } from "@/utils/date";
import QRCode from "react-qr-code";
import { PaymentActionBlock } from './ClientDynamics';
import dynamic from 'next/dynamic';

const TourLegalLinks = dynamic(
  () =>
    import("@/features/tours/components/TourDetails/TourLegalLinks").then(
      (mod) => mod.default,
    ),
  { ssr: true },
);

// ─── ТИПЫ И ХЕЛПЕРЫ ─────────────────────────────────────────────────────────

type Guest = {
  name: string;
  ticketType?: string;
  equipment?: string;
  [key: string]: unknown;
};

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  const baseClasses =
    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm";

  switch (s) {
    case "pending":
      return (
        <span className={`${baseClasses} bg-amber-500/10 text-amber-400 border-amber-500/20`}>
          Новая (Наличные)
        </span>
      );
    case "cancelled":
      return (
        <span className={`${baseClasses} bg-slate-500/10 text-slate-300 border-slate-500/20`}>
          Отменено
        </span>
      );
    case "awaiting_payment":
      return (
        <span className={`${baseClasses} bg-sky-500/10 text-sky-400 border-sky-500/20`}>
          Ожидает оплаты
        </span>
      );
    case "moderation":
      return (
        <span className={`${baseClasses} bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse`}>
          Проверка чека
        </span>
      );
    case "rejected":
      return (
        <span className={`${baseClasses} bg-rose-500/10 text-rose-400 border-rose-500/20`}>
          Оплата отклонена
        </span>
      );
    case "confirmed":
      return (
        <span className={`${baseClasses} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>
          Оплачено
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-slate-800 text-slate-300 border-white/5`}>
          {status}
        </span>
      );
  }
}

// ─── СКЕЛЕТОНЫ ЗАГРУЗКИ ─────────────────────────────────────────────────────

function BookingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-ui-panel border border-ui-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 sm:p-8 border-b border-ui-border border-dashed space-y-6">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="h-8 w-48 bg-white/10 rounded" />
            </div>
            <div className="h-6 w-24 bg-white/10 rounded-full" />
          </div>
          <div className="h-[120px] w-[120px] bg-white/5 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-20 bg-white/5 rounded-2xl" />
            <div className="h-20 bg-white/5 rounded-2xl" />
          </div>
        </div>
        <div className="p-6 sm:p-8 space-y-8">
            <div className="h-40 bg-white/5 rounded-3xl" />
            <div className="h-24 bg-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ ─────────────────────────────────────────────

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in duration-500 px-4 pt-4">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-slate-300 hover:text-slate-100 mb-6 text-sm font-bold uppercase tracking-widest transition-colors group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
        Назад к билетам
      </Link>

      <Suspense fallback={<BookingSkeleton />}>
        <BookingContent params={params} />
      </Suspense>
    </div>
  );
}

// ─── КОМПОНЕНТ КОНТЕНТА (Server Logic) ───────────────────────────────────────

async function BookingContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 🛡️ Безопасность: Валидация UUID до обращения к базе
  const isValidUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (!id || !isValidUUID) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 bg-ui-panel border border-ui-border rounded-3xl">
        <Lock className="w-16 h-16 text-slate-500 mb-6" />
        <h1 className="text-2xl font-black text-ui-text mb-2 uppercase tracking-tight">Билет не найден</h1>
        <p className="text-slate-400 mb-8 max-w-xs">Ссылка повреждена или такого билета не существует.</p>
        <Link href="/account" className="px-6 py-3 bg-ui-accent hover:bg-ui-accent/90 text-ui-bg font-black uppercase tracking-widest text-xs rounded-xl transition-all">
          Вернуться в кабинет
        </Link>
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Запрос данных
  const booking = await prisma.booking.findFirst({
    where: { id, member: { userId: user.id } },
    include: {
      tourDate: true,
      tour: {
        select: {
          title: true, meetingPoint: true, location: true, checklist: true,
          currency: true, biletpmrLink: true, apbQrLink: true, apbQrImage: true,
        },
      },
    },
  });

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 bg-ui-panel border border-ui-border rounded-3xl">
        <Lock className="w-16 h-16 text-rose-500/50 mb-6" />
        <h1 className="text-2xl font-black text-ui-text mb-2 uppercase tracking-tight">Доступ закрыт</h1>
        <p className="text-slate-400 mb-8 max-w-xs">Этот билет либо не существует, либо не принадлежит вам.</p>
        <Link href="/account" className="px-6 py-3 bg-ui-accent hover:bg-ui-accent/90 text-ui-bg font-black uppercase tracking-widest text-xs rounded-xl transition-all">
          Вернуться в кабинет
        </Link>
      </div>
    );
  }

  // Логика данных
  const guests = (booking.guests as Guest[]) || [];
  const status = booking.status.toLowerCase();
  const tourDateObj = booking.tourDate;
  const dateStr = tourDateObj?.startDate ? formatTourDate(new Date(tourDateObj.startDate)) : "Даты уточняются";
  const timeStr = tourDateObj?.time || "08:00";
  const startPoint = tourDateObj?.meetingPoint || booking.tour.meetingPoint || booking.tour.location || "Уточняется менеджером";
  const checklist = Array.isArray(booking.tour.checklist) ? (booking.tour.checklist as { title: string; items: string }[]) : [];
  const displayId = booking.shortId ? String(booking.shortId) : booking.id.substring(0, 5).toUpperCase();

  // Логика чата
  const showChatButton = (status === "confirmed" || (status === "pending" && booking.paymentMethod === "cash")) && tourDateObj?.groupChatUrl;

  // Логика подтверждения участия
  const isUnpaid = booking.paymentMethod === "cash" || booking.paymentMethod === "foreign";
  const startDate = tourDateObj?.startDate ? new Date(tourDateObj.startDate) : null;
  let daysToTour = 999;
  if (startDate) {
    daysToTour = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  }
  const isConfirmed = booking.isAttendanceConfirmed;
  const showConfirmUI = isUnpaid && daysToTour <= 3 && daysToTour >= 0 && !isConfirmed;

  return (
    <div className="space-y-6">
      {/* 🎫 СЕКЦИЯ БИЛЕТА */}
      <div className="bg-ui-panel border border-ui-border rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        
        {/* Верхняя часть билета */}
        <div className="p-6 sm:p-10 border-b border-ui-border border-dashed relative">
          {/* Дизайнерские перфорации */}
          <div className="absolute left-0 bottom-0 translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-ui-bg rounded-full border-r border-ui-border z-10" />
          <div className="absolute right-0 bottom-0 translate-y-1/2 translate-x-1/2 w-8 h-8 bg-ui-bg rounded-full border-l border-ui-border z-10" />

          {/* Хедер билета */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-ui-accent uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ui-accent animate-ping" />
                Booking Ref #{displayId}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-ui-text leading-[0.9] uppercase italic tracking-tighter break-words">
                {booking.tour.title}
              </h1>
            </div>
            <div className="shrink-0">{getStatusBadge(booking.status)}</div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center sm:justify-start mb-10">
            <div className="p-4 bg-white rounded-[2rem] shadow-2xl border-[6px] border-ui-panel transform hover:scale-105 transition-transform duration-500">
              <QRCode size={140} value={`BOOKING:${booking.id}`} level="H" />
            </div>
          </div>

          {/* Инфо-сетка */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-ui-bg/40 backdrop-blur-sm rounded-3xl p-5 border border-white/5 group hover:border-ui-accent/30 transition-colors">
              <CalendarClock className="text-ui-accent mb-3 group-hover:scale-110 transition-transform" size={20} />
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Старт приключения</p>
              <p className="text-base font-bold text-ui-text">{dateStr} в {timeStr}</p>
            </div>
            <div className="bg-ui-bg/40 backdrop-blur-sm rounded-3xl p-5 border border-white/5 group hover:border-ui-accent/30 transition-colors">
              <MapPin className="text-ui-accent mb-3 group-hover:scale-110 transition-transform" size={20} />
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Точка сбора</p>
              <p className="text-sm font-bold text-ui-text leading-tight">{startPoint}</p>
            </div>
          </div>
        </div>

        {/* Нижняя часть билета */}
        <div className="p-6 sm:p-10 bg-gradient-to-b from-ui-panel/50 to-ui-bg/80 space-y-10">
          
          {/* UI ПОДТВЕРЖДЕНИЯ */}
          {showConfirmUI && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-500 relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-all" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg rotate-3">⚠️</div>
                  <h3 className="font-black text-amber-500 uppercase tracking-widest text-base sm:text-lg">Нужно подтверждение</h3>
                </div>
                <p className="text-amber-100/80 text-sm leading-relaxed mb-8 font-medium">
                  Вы выбрали <b className="text-amber-400">оплату на месте</b>. Подтвердите участие, чтобы мы забронировали место в трансфере и подготовили снаряжение.
                </p>
                <form action={async () => {
                  "use server";
                  const { confirmBookingAttendance } = await import("@/features/account/actions/confirmBookingAttendance");
                  await confirmBookingAttendance(booking.id);
                }}>
                  <button className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-ui-bg font-black py-4.5 px-6 rounded-2xl text-sm uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20">
                    Я точно буду на старте
                  </button>
                </form>
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-5">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-2xl">✅</div>
              <p className="text-emerald-400 text-sm font-black uppercase tracking-widest leading-tight">
                Участие подтверждено.<br /><span className="text-xs text-emerald-500/70">Готовим весла и отличное настроение!</span>
              </p>
            </div>
          )}

          {/* КНОПКА ТЕЛЕГРАМ ЧАТА */}
          {showChatButton && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <a
                href={tourDateObj.groupChatUrl!}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-4 w-full py-5 bg-[#2AABEE] hover:bg-[#229ED9] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-[#2AABEE]/30 transition-all hover:-translate-y-1 active:scale-95"
              >
                <MessageSquare size={22} /> Вступить в чат группы
              </a>
              <p className="text-center text-[11px] text-slate-500 font-black uppercase tracking-widest mt-4">
                Там будет гид, точка геолокации и фотоотчет
              </p>
            </div>
          )}

          {/* СПИСОК УЧАСТНИКОВ */}
          <div className="space-y-5">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Users size={16} className="text-ui-accent" /> Состав экспедиции
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {guests.length > 0 ? (
                guests.map((guest, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black text-sm">{idx + 1}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-100 truncate">{guest.name}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{guest.ticketType || 'Участник'}</p>
                      </div>
                    </div>
                    {guest.equipment && (
                      <span className="px-3 py-1.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        🦺 Жилет: {guest.equipment}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black text-sm">1</div>
                  <div>
                    <p className="text-sm font-bold text-white">{booking.name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Заказчик</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ЧЕК-ЛИСТ */}
          {checklist.length > 0 && (
            <div className="space-y-5">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <CheckSquare size={16} className="text-ui-accent" /> Полевой чек-лист
              </h3>
              <div className="bg-ui-bg/40 rounded-[2rem] p-6 sm:p-8 border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-8">
                {checklist.map((block, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-[11px] font-black text-teal-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1 h-1 bg-teal-500 rounded-full" /> {block.title}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      {block.items}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ЭКОНОМИКА БИЛЕТА */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Info size={16} className="text-ui-accent" /> Детализация оплаты
            </h3>
            <div className="bg-ui-panel/80 backdrop-blur-md rounded-[2rem] p-8 border border-ui-border space-y-5 shadow-inner">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-500 uppercase tracking-widest text-[10px]">Стоимость тура:</span>
                <span className="text-slate-100">{booking.totalPrice} {booking.tour.currency}</span>
              </div>
              {booking.discount > 0 && (
                <div className="flex justify-between text-sm font-bold text-emerald-400">
                  <span className="uppercase tracking-widest text-[10px]">Ваша скидка:</span>
                  <span>-{booking.discount} {booking.tour.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-500 uppercase tracking-widest text-[10px]">Внесено:</span>
                <span className="text-emerald-500">{booking.amountPaid} {booking.tour.currency}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-100 font-black uppercase tracking-widest text-xs">К оплате на старте:</span>
                <span className="text-teal-400 font-black text-2xl tracking-tighter">
                  {Math.max(0, booking.totalPrice - booking.discount - booking.amountPaid)} {booking.tour.currency}
                </span>
              </div>
            </div>

            {/* БЛОК ОПЛАТЫ (Dynamic) */}
            <div className="animate-in fade-in duration-1000">
              <PaymentActionBlock
                bookingId={booking.id}
                shortId={booking.shortId || "0000"}
                status={booking.status}
                paymentMethod={booking.paymentMethod || "cash"}
                totalPrice={booking.totalPrice - booking.discount}
                amountPaid={booking.amountPaid}
                currency={booking.tour.currency || "RUB"}
                receiptUrl={booking.receiptUrl}
                biletpmrLink={booking.tour.biletpmrLink}
                apbQrLink={booking.tour.apbQrLink}
                apbQrImage={booking.tour.apbQrImage}
              />
            </div>
          </div>
        </div>
      </div>

      <TourLegalLinks />

      {/* ФУТЕР: ПОДДЕРЖКА */}
      <div className="bg-ui-panel/40 border border-white/5 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-8 mt-10 group hover:border-ui-accent/20 transition-all">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-ui-accent/10 group-hover:text-ui-accent transition-all duration-500">
            <AlertTriangle size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Возникли вопросы?</p>
            <p className="text-base font-black text-white uppercase tracking-tight">Служба заботы клуба</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a
            href="tel:+37377770141"
            className="flex-1 sm:flex-none px-6 py-4 bg-white/5 text-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/10 hover:text-white flex items-center justify-center gap-2 border border-white/5"
          >
            <Phone size={14} /> Позвонить
          </a>
          <a
            href="https://t.me/romansvtirase"
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none px-6 py-4 bg-[#2AABEE]/10 text-[#2AABEE] rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-[#2AABEE]/20 flex items-center justify-center gap-2 border border-[#2AABEE]/10"
          >
            <MessageCircle size={14} /> Написать
          </a>
        </div>
      </div>
    </div>
  );
}