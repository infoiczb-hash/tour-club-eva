"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Loader2, Phone, User, MessageSquare, Calendar, AtSign, Minus, Plus, AlertCircle } from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { createBookingAction } from '@/features/tours/actions/createBooking';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  initialDate?: string;
  initialDateId?: string;
}

export default function BookingModal({ isOpen, onClose, tour, initialDate, initialDateId }: BookingModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '+373 ',
    social: '',
    comment: ''
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setSelectedDateStr(initialDate);
      } else if (tour.dates && tour.dates.length > 0) {
        const first = tour.dates[0];
        const label = `${first.start}${first.time ? ` в ${first.time}` : ''}`;
        setSelectedDateStr(label);
      } else {
        const dateObj = new Date(tour.date);
        const ruDate = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        setSelectedDateStr(ruDate);
      }
    }
  }, [isOpen, initialDate, tour]);

  const [tickets, setTickets] = useState({
    adult: 1,
    child: 0,
    member: 0,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setStep('form');
        setErrorMsg(null);
        setFormData({ name: '', phone: '+373 ', social: '', comment: '' });
        setTickets({ adult: 1, child: 0, member: 0 });
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const totalPrice = useMemo(() => {
    let sum = tickets.adult * tour.price;
    if (tour.priceChild) sum += tickets.child * tour.priceChild;
    if (tour.priceMember) sum += tickets.member * tour.priceMember;
    return sum;
  }, [tickets, tour]);

  const getSmartPlaceholder = () => {
    const categorySlug = tour.category?.slug;
    if (categorySlug === 'water') {
      return 'Укажите для каждого участника, какой размер жилета взять у нас есть детские и от XS до 5XL. Сообщите если будут с вами дети до 10 лет.';
    }
    if (categorySlug === 'abroad' || tour.location?.toLowerCase().includes('румыния')) {
      return 'Какое снаряжение вам надо? Есть ли у Вас действующий биометрический паспорт?';
    }
    if (categorySlug === 'kids') {
      return 'Укажите возраст детей ...';
    }
    return 'Задайте вопрос и мы постараемся ответить на него в короткие сроки?';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await createBookingAction({
        tourId:        String(tour.id),
        tourTitle:     tour.title,
        tourDate:      selectedDateStr,
        name:          formData.name.trim(),
        phone:         formData.phone.trim(),
        social:        formData.social.trim() || undefined,
        comment:       formData.comment.trim() || undefined,
        ticketsAdult:  tickets.adult,
        ticketsChild:  tickets.child,
        ticketsMember: tickets.member,
        totalPrice,
        currency:      tour.currency ?? 'MDL',
      });

      if (result.success) {
        setStep('success');
      } else {
        setErrorMsg(result.error ?? 'Что-то пошло не так. Попробуйте ещё раз.');
      }
    } catch {
      setErrorMsg('Ошибка соединения. Проверьте интернет и попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const Counter = ({ label, price, value, type }: { label: string, price: number, value: number, type: 'adult'|'child'|'member' }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-xs text-slate-400">{price} {tour.currency}</div>
      </div>
      <div className="flex items-center gap-3 bg-slate-950 rounded-lg p-1 border border-white/10">
        <button 
          type="button"
          aria-label={`Уменьшить количество: ${label}`}
          onClick={() => setTickets(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }))}
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <span className="text-sm font-bold text-white w-4 text-center" aria-live="polite">{value}</span>
        <button 
          type="button"
          aria-label={`Увеличить количество: ${label}`}
          onClick={() => setTickets(prev => ({ ...prev, [type]: prev[type] + 1 }))}
          className="w-8 h-8 flex items-center justify-center text-teal-500 hover:bg-teal-500/20 rounded-md transition-colors"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md"
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-booking-title"
              className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
            >
              
              <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5 shrink-0">
                <div>
                  <h3 id="modal-booking-title" className="text-lg font-bold text-white uppercase tracking-wide leading-none mb-1">
                    {step === 'form' ? 'Бронирование' : 'Успешно!'}
                  </h3>
                  <p className="text-xs text-teal-400 font-bold truncate max-w-[250px]">
                    {tour.title}
                  </p>
                </div>
                {/* aria-label обязателен — иконка X без текста */}
                <button 
                  onClick={onClose}
                  aria-label="Закрыть окно бронирования"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                {step === 'form' ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Calendar size={12} aria-hidden="true" /> Дата и время
                      </label>
                      {initialDate ? (
                        <div className="w-full bg-slate-950/50 border border-teal-500/30 rounded-xl px-4 py-3 text-teal-400 font-bold">
                          {initialDate}
                        </div>
                      ) : (
                        tour.dates && tour.dates.length > 0 ? (
                          <div className="relative">
                            <select 
                              value={selectedDateStr}
                              onChange={(e) => setSelectedDateStr(e.target.value)}
                              aria-label="Выберите дату тура"
                              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:border-teal-500 focus:outline-none cursor-pointer"
                            >
                              {tour.dates.map((d, i) => {
                                const val = `${d.start}${d.time ? ` в ${d.time}` : ''}`;
                                return <option key={i} value={val}>{val}</option>;
                              })}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" aria-hidden="true">▼</div>
                          </div>
                        ) : (
                          <div className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-300">
                            {new Date(tour.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                          </div>
                        )
                      )}
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <Counter label="Взрослый" price={tour.price} value={tickets.adult} type="adult" />
                      {tour.priceChild && tour.priceChild > 0 ? (
                        <Counter label="Детский" price={tour.priceChild} value={tickets.child} type="child" />
                      ) : null}
                      {tour.priceMember && tour.priceMember > 0 ? (
                        <Counter label="Клубная карта" price={tour.priceMember} value={tickets.member} type="member" />
                      ) : null}
                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10">
                        <span className="text-xs font-bold text-slate-400 uppercase">Итого:</span>
                        <span className="text-xl font-black text-teal-400" aria-live="polite">
                          {totalPrice.toLocaleString()} {tour.currency}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label htmlFor="booking-name" className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                          <User size={12} aria-hidden="true" /> Ваше имя и фамилия
                        </label>
                        <input 
                          id="booking-name"
                          type="text" required placeholder="Иван Иванов" value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="booking-phone" className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                          <Phone size={12} aria-hidden="true" /> Телефон
                        </label>
                        <input 
                          id="booking-phone"
                          type="tel" required value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="booking-social" className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                          <AtSign size={12} aria-hidden="true" /> Ник в Telegram / Instagram <span className="text-[12px] normal-case opacity-50">(необязательно)</span>
                        </label>
                        <input 
                          id="booking-social"
                          type="text" placeholder="@username" value={formData.social}
                          onChange={(e) => setFormData({...formData, social: e.target.value})}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="booking-comment" className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                          <MessageSquare size={12} aria-hidden="true" /> Дополнительная информация
                        </label>
                        <textarea 
                          id="booking-comment"
                          rows={2} placeholder={getSmartPlaceholder()} value={formData.comment}
                          onChange={(e) => setFormData({...formData, comment: e.target.value})}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <div role="alert" className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit" disabled={isLoading}
                      className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_30px_rgba(20,184,166,0.4)]"
                    >
                      {isLoading
                        ? <><Loader2 className="animate-spin" size={20} aria-hidden="true" /><span>Отправляем...</span></>
                        : `Записаться за ${totalPrice.toLocaleString()} ${tour.currency}`
                      }
                    </button>
                    
                    <p className="text-sm text-slate-500 text-center leading-tight">
                      Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
                    </p>

                  </form>
                ) : (
                  <div className="flex flex-col items-center text-center py-8">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20 animate-in zoom-in duration-300">
                      <CheckCircle size={40} aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase mb-2">
                      Заявка принята!
                    </h3>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-[260px]">
                      Мы свяжемся с вами в ближайшее время по номеру <span className="text-white font-bold">{formData.phone}</span> для подтверждения.
                    </p>
                    <button
                      onClick={onClose}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wide rounded-xl transition-colors"
                    >
                      Закрыть окно
                    </button>
                  </div>
                )}
              </div>

            </m.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}