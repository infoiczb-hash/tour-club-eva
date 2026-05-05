"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Tour } from '@/features/tours/types';
import { clsx } from 'clsx';
// ✅ НОВОЕ: Добавили Loader2
import { X, Crown, Baby, Users, Ticket, ChevronUp, Loader2 } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';
// ✅ НОВОЕ: Импортируем экшен для списка ожидания
import { joinWaitlistAction } from '@/features/account/actions/waitlist';

interface TourBottomActionsProps {
  tour: Tour;
  // ✅ НОВОЕ: Принимаем профиль для предзаполнения
  profile?: { name?: string | null; phone?: string | null } | null;
}

export default function TourBottomActions({ tour, profile }: TourBottomActionsProps) {
  const [isVisible, setIsVisible]   = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const openBookingModal = useModalStore((state) => state.openBookingModal);

  // ✅ НОВОЕ: Стейты для Листа Ожидания
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistName,     setWaitlistName]     = useState(profile?.name || '');
  const [waitlistPhone,    setWaitlistPhone]    = useState(profile?.phone || '+373 ');
  const [waitlistLoading,  setWaitlistLoading]  = useState(false);
  const [waitlistDone,     setWaitlistDone]     = useState(false);
  const [waitlistError,    setWaitlistError]    = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Закрываем при скролле вверх (пользователь ушёл от тура)
  useEffect(() => {
    if (!isVisible) {
      setIsExpanded(false);
      setShowWaitlistForm(false); // Сбрасываем состояние формы
    }
  }, [isVisible]);

  // ✅ НОВОЕ: Умная логика доступности (Global Availability)
  const { targetDate, isGlobalSoldOut, activeSpotsLeft } = useMemo(() => {
    if (!tour?.tourDates || tour.tourDates.length === 0) {
      const fallbackLeft = Number(tour?.spotsLeft || 0);
      return { targetDate: null, isGlobalSoldOut: fallbackLeft <= 0, activeSpotsLeft: fallbackLeft };
    }

    const now = new Date();
    // Фильтруем только будущие выезды
    const futureDates = tour.tourDates
      .filter((d: any) => new Date(d.startDate) >= now)
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // Ищем первую свободную дату
    const firstFree = futureDates.find((d: any) => {
      const capacity = d.capacity || 0;
      const booked = d._count?.bookings || 0;
      return (capacity - booked) > 0;
    });

    // Считаем общие остатки мест по всем будущим выездам
    const totalLeft = futureDates.reduce((acc: number, d: any) => {
      const capacity = d.capacity || 0;
      const booked = d._count?.bookings || 0;
      return acc + Math.max(0, capacity - booked);
    }, 0);

    return {
      targetDate: firstFree || futureDates[0] || null,
      isGlobalSoldOut: futureDates.length > 0 ? !firstFree : true,
      activeSpotsLeft: futureDates.length > 0 ? totalLeft : 0
    };
  }, [tour]);

  if (!tour) return null;

  const prices = [
    { label: 'Взрослый', value: tour.price,        icon: <Ticket size={14} className="text-slate-300" /> },
    { label: 'Клубная карта', value: tour.priceMember,  icon: <Crown  size={14} className="text-amber-400" /> },
    { label: 'Детский (до 13)', value: tour.priceChild,   icon: <Baby   size={14} className="text-pink-400" /> },
    { label: 'Семья (2+1)', value: tour.priceFamily,  icon: <Users  size={14} className="text-blue-400" /> },
  ].filter((p) => typeof p.value === 'number' && (p.value as number) > 0);

  const minPrice     = Math.min(...prices.map(p => p.value as number));
  
  // ✅ Интегрировали новые переменные вместо старой проверки
  const isSoldOut    = isGlobalSoldOut;
  const left         = activeSpotsLeft;
  const isLowSpots   = left > 0 && left <= 5;

  const hasDiscount     = Number(tour.priceOld || 0) > Number(tour.price || 0);
  const discountPercent = hasDiscount
    ? Math.round(((Number(tour.priceOld) - Number(tour.price)) / Number(tour.priceOld)) * 100)
    : 0;

  // ✅ НОВОЕ: Обработчик сабмита листа ожидания
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistName.trim()) return;
    setWaitlistLoading(true);
    setWaitlistError(null);

    const result = await joinWaitlistAction({
      tourId:  String(tour.id),
      name:    waitlistName.trim(),
      phone:   waitlistPhone.trim() || undefined,
    });

    if (result.success) {
      setWaitlistDone(true);
    } else {
      setWaitlistError(result.error || 'Ошибка. Попробуйте ещё раз.');
    }
    setWaitlistLoading(false);
  };

  return (
    <>
      {/* Затемнение фона при расширении */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => { setIsExpanded(false); setShowWaitlistForm(false); }}
          aria-hidden="true"
        />
      )}

      <div
        className={clsx(
          "fixed bottom-0 left-0 right-0 z-[60] lg:hidden transition-transform duration-300",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
        aria-label="Панель бронирования тура"
      >
        {/* ПАНЕЛЬ */}
        <div className={clsx(
          "bg-slate-900/98 backdrop-blur-xl border-t border-white/10 transition-all duration-400 ease-in-out",
          "rounded-t-3xl shadow-2xl shadow-black/60",
        )}>

          {/* ── ХЭНДЛ + КНОПКА ЗАКРЫТИЯ ── */}
          <div
            className="flex items-center justify-center pt-3 pb-1 cursor-pointer relative"
            onClick={() => {
              if (isExpanded) setShowWaitlistForm(false); // Закрываем форму если сворачиваем
              setIsExpanded(!isExpanded);
            }}
            role="button"
            aria-label={isExpanded ? 'Свернуть панель' : 'Развернуть детали тура'}
            aria-expanded={isExpanded}
          >
            {/* Полоска-хэндл */}
            <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />

            {/* Крестик закрытия */}
            {isExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); setShowWaitlistForm(false); }}
                aria-label="Закрыть панель"
                className="absolute right-4 top-2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={14} className="text-slate-300" />
              </button>
            )}
          </div>

          {/* ── РАСШИРЕННЫЙ КОНТЕНТ ── */}
          <div className={clsx(
            "overflow-hidden transition-all duration-400 ease-in-out",
            isExpanded ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="px-5 pt-2 pb-4 space-y-4 overflow-y-auto max-h-[65vh]">
              
              {/* ✅ НОВОЕ: Развилка контента. Если нажали "В очередь" — показываем форму */}
              {showWaitlistForm ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="text-lg font-black text-white">Список ожидания</h3>
                    <p className="text-xs text-slate-400 mt-1">Оставьте контакты, и мы сообщим, если кто-то откажется от поездки или мы добавим новые места.</p>
                  </div>

                  {!profile && (
                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3 text-xs text-slate-300">
                      💡 <a href="/login" className="text-teal-400 hover:underline font-bold">Войдите в кабинет</a> для авто-уведомлений о датах!
                    </div>
                  )}

                  {waitlistDone ? (
                    <div className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider text-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      Вы добавлены в список!
                    </div>
                  ) : (
                    <form onSubmit={handleWaitlistSubmit} className="space-y-3 pb-4">
                      <input
                        required
                        type="text"
                        placeholder="Ваше имя"
                        value={waitlistName}
                        onChange={(e) => setWaitlistName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none transition-all"
                      />
                      <input
                        type="tel"
                        placeholder="Телефон"
                        value={waitlistPhone}
                        onChange={(e) => setWaitlistPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none transition-all"
                      />
                      {waitlistError && (
                        <p className="text-xs text-rose-400 font-bold">{waitlistError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={waitlistLoading}
                        className="w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {waitlistLoading ? <Loader2 size={16} className="animate-spin" /> : 'Встать в очередь'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  {/* Старый контент: Цена со скидкой и места */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-1">Стоимость участия</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white">{Number(tour.price).toLocaleString('ru-RU')}</span>
                        <span className="text-sm font-bold text-teal-500">{tour.currency || 'RUB'}</span>
                      </div>
                      {hasDiscount && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-slate-300 line-through text-xs">{Number(tour.priceOld).toLocaleString()}</span>
                          <span className="bg-rose-500/10 text-rose-400 text-xs font-bold px-1.5 py-0.5 rounded border border-rose-500/20">
                            −{discountPercent}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Свободных мест */}
                    <div className="text-right">
                      <p className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-1">Мест</p>
                      <span className={clsx(
                        "text-2xl font-black",
                        isSoldOut ? "text-rose-500" : isLowSpots ? "text-amber-400" : "text-teal-400"
                      )}>
                        {isSoldOut ? "0" : left}
                      </span>
                      {isLowSpots && !isSoldOut && (
                        <p className="text-xs font-bold text-amber-400 uppercase">Мало!</p>
                      )}
                    </div>
                  </div>

                  {/* Разделитель */}
                  <div className="border-t border-white/5" />

                  {/* Все тарифы */}
                  {prices.length > 1 && (
                    <div className="space-y-2.5">
                      <p className="text-xs uppercase font-bold text-slate-300 tracking-wider">Тарифы</p>
                      {prices.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            {p.icon}
                            <span>{p.label}</span>
                          </div>
                          <span className="font-bold text-white text-sm">
                            {(p.value as number).toLocaleString()} {tour.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── COLLAPSED BAR (всегда виден) ── */}
          <div className="px-4 pb-6 pt-3 flex items-center gap-3">

            {/* Цена + стрелка-триггер */}
            <button
              onClick={() => {
                if (isExpanded) setShowWaitlistForm(false);
                setIsExpanded(!isExpanded);
              }}
              className="flex-1 flex items-center gap-2 min-w-0 group"
              aria-label={isExpanded ? 'Свернуть детали' : 'Показать детали'}
            >
              <div className="min-w-0 text-left">
                <p className="text-xs text-slate-300 uppercase font-bold tracking-wider mb-0.5">Стоимость</p>
                <div className="flex items-baseline gap-1">
                  {prices.length > 1 && <span className="text-xs text-slate-300 font-medium">от</span>}
                  <span className="text-xl font-black text-white">{minPrice.toLocaleString()}</span>
                  <span className="text-xs font-bold text-teal-500">{tour.currency || 'RUB'}</span>
                </div>
              </div>

              {/* Стрелка */}
              <div className={clsx(
                "w-7 h-7 rounded-full border border-white/15 flex items-center justify-center shrink-0 transition-all duration-300",
                isExpanded
                  ? "bg-white/15 rotate-180 border-white/30"
                  : "bg-white/5 group-hover:bg-white/10"
              )}>
                <ChevronUp size={14} className="text-slate-300" />
              </div>
            </button>

            {/* ✅ НОВОЕ: Умная кнопка. Меняет цвет и действие при Sold Out */}
            <button
              onClick={() => {
                if (isSoldOut) {
                  setShowWaitlistForm(true);
                  setIsExpanded(true);
                } else {
                  setIsExpanded(false);
                  openBookingModal(tour);
                }
              }}
              aria-label={isSoldOut ? 'Встать в очередь' : `Записаться в тур ${tour.title}`}
              className={clsx(
                "shrink-0 px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm transition-all active:scale-95 whitespace-nowrap",
                isSoldOut
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/25"
                  : "bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-lg shadow-teal-500/25"
              )}
            >
              {isSoldOut ? 'В очередь' : 'Записаться'}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}