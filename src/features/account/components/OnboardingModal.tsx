'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Phone, MapPin, CheckCircle2, AlertCircle, X, Compass, Bot, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveOnboardingDataAction } from '@/features/account/actions/onboarding';

export default function OnboardingModal() {
  const [phone, setPhone] = useState('+373 ');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [successData, setSuccessData] = useState<{ linkedCount: number } | null>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const skipped = sessionStorage.getItem('onboardingSkipped');
    if (!skipped) {
      setIsOpen(true);
    }
  }, []);

  const handleSkip = () => {
    sessionStorage.setItem('onboardingSkipped', 'true');
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Введите корректный номер телефона');
      return;
    }

    if (name.trim().length < 2) {
      setError('Пожалуйста, введите ваше имя');
      return;
    }

    startTransition(async () => {
      const res = await saveOnboardingDataAction(phone, name);
      
      if (res.success) {
        setSuccessData({ linkedCount: res.linkedCount || 0 });
        setTimeout(() => {
          window.location.reload(); 
        }, 3000);
      } else {
        setError(res.error || 'Произошла ошибка');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300 relative">
        
        {!successData && (
          <button 
            onClick={handleSkip}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {successData ? (
          <div className="text-center py-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-teal-500/20 border border-teal-500/30 rounded-full flex items-center justify-center text-teal-400 mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
              Отлично, {name.split(' ')[0]}!
            </h2>
            <p className="text-slate-400 font-medium leading-relaxed mb-4">
              {successData.linkedCount > 0 
                ? `Мы нашли вашу историю и привязали ${successData.linkedCount} прошлых туров к вашему кабинету.` 
                : 'Данные сохранены! Теперь вы готовы к новым приключениям, а кэшбэк будет копиться автоматически.'}
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-xs text-slate-300">
              <Bot size={14} className="text-teal-400" />
              <span>Переходим к настройкам профиля...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6 mt-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-500 mb-4 shadow-inner">
                <Compass size={28} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                Завершим настройку
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Введите данные, чтобы мы могли начислять кэшбэк и присылать уведомления о ваших турах.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
                  Ваше имя и фамилия
                </label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-600"
                    placeholder="Александр Николаев"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
                  Номер телефона (для связи гида)
                </label>
                <div className="relative group">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-600"
                    placeholder="+373 777 00 000"
                  />
                </div>
              </div>

              <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 flex items-start gap-3">
                <div className="mt-0.5 text-teal-400 shrink-0"><Bot size={16} /></div>
                <p className="text-[11px] text-teal-100/70 leading-snug">
                  <strong className="text-teal-400 font-bold block mb-1">Важный шаг:</strong>
                  После входа обязательно загляните в настройки профиля. Подключите Telegram-бота и заполните Email для получения билетов и чек-листов!
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-bold">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-6">
                <button
                  type="submit"
                  disabled={isPending || phone.length < 10 || name.trim().length < 2}
                  className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-[0.98]"
                >
                  {isPending ? (
                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <><MapPin size={18} /> Сохранить и продолжить</>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full flex items-center justify-center py-3 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
                >
                  Заполню позже
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}