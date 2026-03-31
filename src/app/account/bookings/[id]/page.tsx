// src/app/account/bookings/[id]/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, MapPin, Users, Phone, 
  MessageCircle, AlertTriangle, 
  Info, CalendarClock, Lock, Backpack 
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatTourDate } from "@/utils/date";

// Импортируем наш новый Клиентский Компонент
import { PaymentActionBlock } from "@/features/account/components/PaymentActionBlock";

type Guest = {
  name: string;
  ticketType?: string;
  equipment?: string[];
  [key: string]: unknown;
};

// ✅ ОБНОВЛЕННЫЕ УМНЫЕ СТАТУСЫ
function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Новая</span>;
    case "cancelled":
      return <span className="px-3 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Отменено</span>;
    case "awaiting_payment":
      return <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Ожидает оплаты</span>;
    case "moderation":
      return <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">Чек на проверке</span>;
    case "rejected":
      return <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Оплата отклонена</span>;
    case "confirmed":
      return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Оплачено</span>;
    default:
      return <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-[10px] font-bold uppercase">{status}</span>;
  }
}

export default async function BookingDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!profile) {
    redirect("/login");
  }

  // Запрашиваем бронь (ВАЖНО: Добавили новые поля)
  const booking = await prisma.booking.findFirst({
    where: {
      id: params.id,
      memberId: profile.id
    },
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
        <p className="text-slate-400 mb-8 max-w-sm">Этот билет не найден или принадлежит другому аккаунту.</p>
        <Link 
          href="/account"
          className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold uppercase tracking-widest text-xs rounded-xl transition-colors"
        >
          Вернуться в кабинет
        </Link>
      </div>
    );
  }

  const guests = (booking.guests as Guest[]) || [];
const tourDate = booking.tourDate?.startDate;
  const dateStr = tourDate ? formatTourDate(new Date(tourDate)) : "Даты уточняются";
  
  // Безопасный парсинг JSON для программы
  const rawProgram = typeof booking.tour.program === 'string' 
    ? JSON.parse(booking.tour.program) 
    : booking.tour.program;
  
  const startPoint = Array.isArray(rawProgram) && rawProgram.length > 0 
    ? rawProgram[0].title 
    : "Точка сбора уточняется";

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Навигация */}
      <Link 
        href="/account"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-bold uppercase tracking-widest transition-colors"
      >
        <ChevronLeft size={16} /> Назад к билетам
      </Link>

      <div className="space-y-4">
        {/* Главная карточка билета */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Декор для билета (полукруги) */}
          <div className="absolute left-0 top-[120px] -translate-x-1/2 w-6 h-6 bg-slate-950 rounded-full border-r border-white/5"></div>
          <div className="absolute right-0 top-[120px] translate-x-1/2 w-6 h-6 bg-slate-950 rounded-full border-l border-white/5"></div>
          
          <div className="p-6 sm:p-8 border-b border-white/5 border-dashed relative">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                ID #{booking.shortId || booking.id.substring(0, 5).toUpperCase()}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {booking.tour.title}
                </h1>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                <CalendarClock className="text-slate-500 mb-2" size={18} />
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Дата и Время</p>
                <p className="text-sm font-bold text-white">{dateStr}</p>
              </div>
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                <MapPin className="text-slate-500 mb-2" size={18} />
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Старт</p>
                <p className="text-sm font-bold text-white truncate" title={startPoint}>{startPoint}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-slate-950">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Users size={14} /> Участники ({guests.length || 1})
            </h3>
            
            <div className="space-y-3 mb-8">
              {guests.length > 0 ? guests.map((guest, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{guest.name}</p>
                      {guest.ticketType && (
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                          {guest.ticketType}
                        </p>
                      )}
                    </div>
                  </div>
                  {guest.equipment && (
                    <div className="px-2 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
                      <Backpack size={10} /> {guest.equipment}
                    </div>
                  )}
                </div>
              )) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs">1</div>
                    <div>
                      <p className="text-sm font-bold text-white">{booking.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Заказчик</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Info size={14} /> Экономика билета
            </h3>
            
            <div className="bg-slate-950 rounded-2xl p-5 border border-white/5 space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Стоимость:</span>
                <span className="text-white font-medium">{booking.totalPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
              
              {booking.discount > 0 && (
                <div className="flex justify-between items-center text-sm text-emerald-400">
                  <span>Скидка (Бонусы/Промо):</span>
                  <span className="font-medium">-{booking.discount} ₽</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Оплачено:</span>
                <span className="text-white font-medium">
                  {booking.amountPaid?.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="h-px w-full bg-slate-800 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Итого к оплате:</span>
                <span className="text-teal-400 font-black text-lg">
                  {Math.max(0, booking.totalPrice - booking.discount - booking.amountPaid).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>
            
            {/* ✅ ВНЕДРЕНИЕ ИНТЕРАКТИВНОГО БЛОКА ОПЛАТЫ */}
            <PaymentActionBlock 
              bookingId={booking.id}
              shortId={booking.shortId || 0}
              status={booking.status}
              paymentMethod={booking.paymentMethod || 'biletpmr'}
              totalPrice={booking.totalPrice - booking.discount}
              amountPaid={booking.amountPaid}
              currency={booking.tour.currency || 'RUB'}
              receiptUrl={booking.receiptUrl}
              rejectReason={(booking as any).rejectReason} // Если поле есть в схеме
              biletpmrLink={booking.tour.biletpmrLink}
              apbQrLink={booking.tour.apbQrLink}
              apbQrImage={booking.tour.apbQrImage}
            />
          </div>
        </div>

        {/* Контакты организаторов */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Нужна помощь?</p>
              <p className="text-sm font-medium text-white">Свяжитесь с поддержкой</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a href="tel:+37377501000" className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
              <Phone size={14} /> Звонок
            </a>
            <a href="https://t.me/evatur_support" target="_blank" rel="noreferrer" className="flex-1 sm:flex-none px-4 py-2.5 bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#2AABEE] rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
              <MessageCircle size={14} /> Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}