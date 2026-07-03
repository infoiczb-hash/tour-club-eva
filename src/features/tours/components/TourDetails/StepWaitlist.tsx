// src/features/tours/components/TourDetails/StepWaitlist.tsx
"use client";

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { joinWaitlistAction } from '@/features/account/actions/waitlist';
import { BookingFormValues } from './booking.schema';
import { clsx } from 'clsx';

interface StepWaitlistProps {
  tour: Tour;
  onClose: () => void;
  onBack: () => void; // Чтобы вернуться к выбору ДРУГОЙ даты
}

export default function StepWaitlist({ tour, onClose, onBack }: StepWaitlistProps) {
  // Нам нужен watch, чтобы забрать имя/телефон, если они уже были введены (или подтянулись из профиля)
  // Но мы не используем trigger/register, так как это отдельная логика, не требующая сложной Zod-валидации всей корзины
  const { watch } = useFormContext<BookingFormValues>();

  const selectedDateId = watch('tourDateId');
  const selectedDateStr = watch('tourDateStr');
  const initialName = watch('guests.0.name') || ''; // Берем имя первого гостя (Заказчика), если есть
  const initialPhone = watch('guests.0.phone') || '';

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);

  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Пожалуйста, заполните все поля');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await joinWaitlistAction({
        tourId: String(tour.id),
        tourDateId: selectedDateId || undefined,
        name: name.trim(),
        phone: phone.trim(),
      });

      if (res.success) {
        setIsDone(true);
      } else {
        setErrorMsg(res.error || 'Произошла ошибка. Попробуйте позже.');
      }
    } catch (err) {
      setErrorMsg('Ошибка соединения. Проверьте интернет.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-500 border-2 border-teal-500/20 shadow-lg shadow-teal-500/10">
          <CheckCircle size={40} strokeWidth={2.5} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">
            Вы в списке!
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            Мы свяжемся с вами по номеру <b>{phone}</b>, как только освободится место на <span className="text-white font-medium">{selectedDateStr || 'эту дату'}</span>.
          </p>
        </div>
        <button 
          type="button" 
          onClick={onClose} 
          className="w-full py-4 mt-4 bg-white/10 hover:bg-white/15 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
        >
          Закрыть окно
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      <div className="flex items-center gap-3 mb-2">
        <button 
          type="button"
          onClick={onBack} 
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h4 className="text-sm font-black text-white uppercase tracking-widest">
          Выбрать другую дату
        </h4>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 text-center shadow-inner">
        <AlertCircle size={36} className="text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
          Мест нет
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
          К сожалению, на <span className="text-white font-medium">{selectedDateStr || 'выбранную дату'}</span> все места уже забронированы.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest text-center mb-4">
            Записаться в лист ожидания
          </p>
          <input 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Ваше имя" 
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3.5 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all text-sm font-medium placeholder:text-slate-600" 
          />
        </div>
        
        <div className="space-y-1">
          <input 
            required 
            type="tel"
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            placeholder="Номер телефона" 
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3.5 text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all text-sm font-medium placeholder:text-slate-600" 
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-bold text-center bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
            {errorMsg}
          </p>
        )}
        
        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full py-4 mt-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:active:scale-100 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            'Встать в очередь'
          )}
        </button>
      </form>

    </div>
  );
}