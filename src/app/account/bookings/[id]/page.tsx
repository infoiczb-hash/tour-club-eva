import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, QrCode, MapPin, Users, Phone, 
  MessageCircle, CreditCard, AlertTriangle, Info, CalendarClock 
} from "lucide-react";
// ✅ ИСПРАВЛЕННЫЕ ИМПОРТЫ:
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatTourDate } from "@/utils/date";

// Типизация для JSON-поля guests (Блок 2)
type Guest = {
  name: string;
  ticketType?: string;
  equipment?: string[];
  [key: string]: unknown;
};

// Функция для красивых бейджиков статуса
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

// Форматирование даты
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

// ⚠️ ИСПРАВЛЕНИЕ АРХИТЕКТУРЫ: В Next 15+ params — это Promise
export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Распаковываем параметры через await, чтобы получить строковый id
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // ✅ ИСПРАВЛЕННЫЙ ВЫЗОВ SUPABASE
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // 2. Идем в Prisma за бронью и привязанным туром (используем распакованный id)
  const booking = await prisma.booking.findUnique({
    where: { id: id },
    include: {
      tour: true,
      tourDate: true, // ✅ Запрашиваем конкретные даты выезда
    },
  });

  // 3. Если брони нет вообще
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

  // 4. ПРОВЕРКА БЕЗОПАСНОСТИ: Если бронь чужая
  if (booking.memberId && booking.memberId !== session.user.id) {
    // Внимание: мы проверяем memberId, так как в схеме Prisma связь идет через него
    // Но так как у нас есть только session.user.id (Supabase Auth ID), нам нужно получить профиль
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

  // Парсим гостей из JSON (Prisma.JsonValue -> unknown -> Guest[])
  const guests = (booking.guests as unknown as Guest[]) || [];
  const tour = booking.tour;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* ПУНКТ 1: ШАПКА И БАЗОВАЯ ИНФА */}
      <div className="space-y-6">
        <Link href="/account/bookings" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <ChevronLeft size={16} />
          Назад ко всем турам
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-tight mb-2">
              {tour?.title || "Неизвестный тур"}
            </h1>
  <div className="flex items-center gap-2 text-slate-300 font-medium">
  
  <CalendarClock size={18} className="text-teal-500 shrink-0" />
  
  {/* Если у брони есть конкретная дата (TourDate) */}
  {booking.tourDate ? (
    <span className="capitalize">
      {formatTourDate(booking.tourDate.startDate, booking.tourDate.endDate)}
    </span>
  ) : (
    /* Если это бронь с открытой датой */
    <span>Открытая дата</span>
  )}

  {/* Выводим длительность через точку, если она есть у тура */}
  {tour?.duration && (
    <>
      <span className="text-slate-600">·</span>
      <span className="text-slate-400">{tour.duration}</span>
    </>
  )}
</div>
          </div>
          <div className="shrink-0">
            {getStatusBadge(booking.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ЛЕВАЯ КОЛОНКА (2/3 ширины) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ПУНКТ 4: ЛОГИСТИКА И СВЯЗЬ */}
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
                {/* Контакты гида */}
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex flex-col justify-center items-start gap-2">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Связь с гидом</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" />
                    Назначим гида скоро
                  </div>
                </div>

                {/* Чат группы */}
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex flex-col justify-center items-start gap-2">
                  <div className="text-xs text-blue-400/80 font-bold uppercase tracking-widest">Чат участников</div>
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <MessageCircle size={16} className="text-slate-500" />
                    Ссылка скоро появится
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ПУНКТ 3: УЧАСТНИКИ (JSON Guests) */}
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
                    {guest.equipment && guest.equipment.length > 0 && (
                      <div className="flex gap-2">
                        {guest.equipment.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-teal-500/10 text-teal-400 text-[10px] uppercase font-bold tracking-widest rounded-md">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-slate-400 text-sm">
                Детальная информация об участниках не найдена.
              </div>
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (1/3 ширины) */}
        <div className="space-y-6">
          
          {/* ПУНКТ 2: ПОСАДОЧНЫЙ ТАЛОН */}
          <div className="bg-gradient-to-b from-teal-900 to-slate-900 border border-teal-500/30 rounded-3xl p-1 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="bg-slate-950/50 rounded-[22px] p-6 lg:p-8 flex flex-col items-center text-center relative z-10">
              <div className="text-xs text-teal-400 font-bold uppercase tracking-[0.2em] mb-4">Boarding Pass</div>
              
              {/* Заглушка QR-кода */}
              <div className="bg-white p-4 rounded-2xl mb-4 shadow-lg">
                <QrCode size={140} className="text-slate-900" />
              </div>
              
              <div className="text-slate-300 font-mono text-sm tracking-widest mb-6 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                ID: {booking.id.split('-')[0].toUpperCase()}
              </div>
              
              <div className="flex items-start gap-2 text-left bg-teal-500/10 border border-teal-500/20 p-3 rounded-xl w-full">
                <Info size={16} className="text-teal-400 shrink-0 mt-0.5" />
                <p className="text-xs text-teal-100/70 leading-relaxed">
                  Сделайте скриншот этого талона на случай, если на месте старта не будет интернета.
                </p>
              </div>
            </div>
          </div>

          {/* ПУНКТ 5: ФИНАНСЫ */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-slate-400" /> Оплата
            </h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Стоимость тура:</span>
                <span className="text-white font-medium">{booking.totalPrice?.toLocaleString('ru-RU')} ₽</span>
              </div>
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
                  {(booking.totalPrice - booking.amountPaid)?.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}