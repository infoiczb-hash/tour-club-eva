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

  // Блокируем скролл основной страницы, когда модалка открыта
  useEffect(() => {
    const skipped = sessionStorage.getItem('onboardingSkipped');
    if (!skipped) {
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSkip = () => {
    sessionStorage.setItem('onboardingSkipped', 'true');
    setIsOpen(false);
    document.body.style.overflow = 'unset';
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
      //   Твоя правильная сигнатура вызова!
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
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/*   ДОБАВЛЕНО: max-h-[90vh], flex-col и overflow-hidden для правильного скролла внутри окна */}
      <div className="w-full max-w-md bg-ui-panel border border-ui-border rounded-[2rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {!successData && (
          <button 
            onClick={handleSkip}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors z-10"
          >
            <X size={18} />
          </button>
        )}

        {/*   ДОБАВЛЕНО: overflow-y-auto для контента. Теперь модалка скроллится на мобилках! */}
        <div className="p-6 md:p-8 overflow-y-auto">
          {successData ? (
            <div className="text-center py-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-teal-500/20 border border-teal-500/30 rounded-full flex items-center justify-center text-teal-400 mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                Отлично, {name.split(' ')[0]}!
              </h2>
              <p className="text-ui-muted font-medium leading-relaxed mb-4">
                {successData.linkedCount > 0 
                  ? `Мы нашли вашу историю и привязали ${successData.linkedCount} прошлых туров к вашему кабинету.` 
                  : 'Данные сохранены! Теперь вы готовы к новым приключениям, а кэшбэк будет копиться автоматически.'}
              </p>
              <div className="inline-flex items-center gap-2 bg-ui-surface border border-ui-border rounded-lg px-4 py-2 text-xs text-ui-muted">
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
                <h2 className="text-2xl font-black text-ui-text uppercase tracking-tight mb-2">
                  Завершим настройку
                </h2>
                <p className="text-ui-muted text-sm font-medium leading-relaxed">
                  Введите данные, чтобы мы могли начислять кэшбэк и присылать уведомления о ваших турах.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase tracking-widest ml-1 mb-1.5 block">
                    Ваше имя и фамилия
                  </label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                    {/*   ИСПРАВЛЕН КОНТРАСТ: Белый фон в светлой теме, темно-серый в темной */}
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isPending}
                      className="w-full bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white font-medium focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm"
                      placeholder="Александр Николаев"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase tracking-widest ml-1 mb-1.5 block">
                    Номер телефона (для связи гида)
                  </label>
                  <div className="relative group">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                    {/*   ИСПРАВЛЕН КОНТРАСТ: Поле больше не черное на черном! */}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isPending}
                      className="w-full bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white font-medium focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm"
                      placeholder="+373 777 00 000"
                    />
                  </div>
                </div>

                {/*   ИСПРАВЛЕН БЛОК "ВАЖНЫЙ ШАГ": Высокий контраст и читаемость */}
                <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 rounded-2xl p-4 flex items-start gap-3">
                  <div className="mt-0.5 text-teal-600 dark:text-teal-400 shrink-0"><Bot size={18} /></div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong className="text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider block mb-1.5">Важный шаг!</strong>
                    После входа обязательно загляните в настройки профиля. Подключите Telegram-бота и заполните Email для получения билетов и чек-листов!
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs font-bold">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isPending || phone.length < 10 || name.trim().length < 2}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover: bg-teal-500 text-slate-950  font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-teal-500/20 active:scale-[0.98]"
                  >
                    {isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><MapPin size={18} /> Сохранить и продолжить</>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}