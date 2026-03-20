// src/features/account/components/OnboardingModal.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { Phone, ArrowRight, Loader2, Sparkles, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { savePhoneNumberAction } from '../actions/onboarding';

export default function OnboardingModal() {
  const [phone, setPhone] = useState('+373 ');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [successData, setSuccessData] = useState<{ linkedCount: number } | null>(null);
  
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Введите корректный номер телефона');
      return;
    }

    startTransition(async () => {
      const res = await savePhoneNumberAction(phone);
      
      if (res.success) {
        setSuccessData({ linkedCount: res.linkedCount || 0 });
        // Даем пользователю прочитать сообщение об успехе и перезагружаем страницу
        setTimeout(() => {
          window.location.reload(); // Надежно очищаем кэш layout'а
        }, 2500);
      } else {
        setError(res.error || 'Произошла ошибка');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300">
        
        {successData ? (
          <div className="text-center py-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-teal-500/20 border border-teal-500/30 rounded-full flex items-center justify-center text-teal-400 mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
              Профиль связан!
            </h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              {successData.linkedCount > 0 
                ? `Мы нашли и прикрепили к вашему аккаунту ${successData.linkedCount} прошлых туров. Добро пожаловать!` 
                : 'Номер успешно сохранен. Теперь ваши будущие брони будут привязаны к этому профилю.'}
            </p>
            <p className="text-xs text-teal-500 mt-6 animate-pulse font-bold uppercase tracking-widest">
              Открываем личный кабинет...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-500 mb-4 shadow-inner">
                <Sparkles size={28} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                Финальный штрих
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Вы успешно вошли! Оставьте свой номер телефона, чтобы мы могли связать этот аккаунт с вашими прошлыми и будущими походами.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
                  Номер телефона (с кодом)
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
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-bold">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || phone.length < 10}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-[0.98]"
              >
                {isPending ? <Loader2 size={18} className="animate-spin" /> : <><MapPin size={18} /> Сохранить и войти</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}