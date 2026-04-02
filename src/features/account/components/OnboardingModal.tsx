'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, CheckCircle2, ArrowRight, Settings, Loader2 } from 'lucide-react';
import { saveOnboardingDataAction } from '@/features/account/actions/onboarding';

interface OnboardingModalProps {
  initialName?: string; // Сюда можно передать никнейм из Google/Telegram, если он есть
}

export default function OnboardingModal({ initialName = '' }: OnboardingModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Пожалуйста, введите ваше реальное имя и фамилию.');
      return;
    }

    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    if (cleanedPhone.length < 9) {
      setError('Пожалуйста, введите корректный номер телефона.');
      return;
    }

    startTransition(async () => {
      const res = await saveOnboardingDataAction(cleanedPhone, name);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || 'Произошла ошибка. Попробуйте еще раз.');
      }
    });
  };

  const handleGoToSettings = () => {
    setIsOpen(false);
    router.push('/account/settings');
    router.refresh();
  };

  const handleGoToDashboard = () => {
    setIsOpen(false);
    router.push('/account/dashboard');
    router.refresh();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Глоу-эффект на фоне */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />

        {isSuccess ? (
          <div className="text-center relative z-10 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-6 shadow-inner border border-emerald-500/20">
              <CheckCircle2 size={40} />
            </div>
            
            {/* Берем только первое слово (имя), если человек ввел "Иван Иванов" */}
            <h2 className="text-2xl font-black text-white mb-3">Отлично, {name.split(' ')[0]}!</h2>
            
            <p className="text-sm text-slate-300 mb-8 leading-relaxed">
              Ваши прошлые поездки успешно найдены и привязаны к кабинету. <br /><br />
              <span className="text-slate-300">Чтобы гиды могли подготовить для вас  нужное снаряжение, заполните вашу клубную карточку в настройках.</span>
            </p>

            <div className="space-y-3">
              <button
                onClick={handleGoToSettings}
                className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)] active:scale-[0.98]"
              >
                <Settings size={18} /> Перейти в Настройки
              </button>
              <button
                onClick={handleGoToDashboard}
                className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-300 hover:text-white font-bold py-3.5 rounded-xl transition-all"
              >
                Позже (На Дашборд) <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white mb-2">Давайте знакомиться!</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Введите ваше реальное имя (для списков группы) и номер телефона, чтобы мы нашли и привязали ваши предыдущие туры.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-1.5 flex items-center gap-1.5">
                    <User size={12} /> Имя и Фамилия
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: Иван Иванов"
                    disabled={isPending}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-1.5 flex items-center gap-1.5">
                    <Phone size={12} /> Ваш телефон
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+373 777 00000"
                    disabled={isPending}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <p className="text-xs text-rose-400 text-center font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-300 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)] active:scale-[0.98] mt-2"
              >
                {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Продолжить'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}