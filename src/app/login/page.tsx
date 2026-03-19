'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Phone, ArrowRight, RotateCcw, ShieldCheck, Loader } from 'lucide-react';

// ─── типы шагов ────────────────────────────────────────────────────
type Step = 'phone' | 'otp';

// ─── маска номера телефона ──────────────────────────────────────────
function formatPhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

// ─── ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ ───────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/account/dashboard';

  const supabase = createClient();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── ВХОД ЧЕРЕЗ GOOGLE ───────────────────────────────────────────
  async function handleGoogleLogin() {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`, 
      },
    });
    if (error) {
      setError('Ошибка при входе через Google. Попробуйте позже.');
      console.error(error);
    }
  }

  // ── шаг 1: отправка SMS ─────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const formatted = formatPhone(phone);
    if (formatted.length < 10) {
      setError('Введите корректный номер телефона');
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formatted,
        options: { shouldCreateUser: true },
      });

      if (error) {
        setError(getErrorMessage(error.message));
        return;
      }
      setStep('otp');
      setCountdown(60);
    });
  }

  // ── шаг 2: верификация OTP ──────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Код должен содержать 6 цифр');
      return;
    }

    startTransition(async () => {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formatPhone(phone),
        token: otp,
        type: 'sms',
      });

      if (error) {
        setError(getErrorMessage(error.message));
        return;
      }

      if (data.user) {
        await linkMemberProfile(data.user.id, formatPhone(phone));
        router.push(next);
        router.refresh();
      }
    });
  }

  // ── повторная отправка SMS ──────────────────────────────────────
  async function handleResend() {
    setError('');
    setOtp('');
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatPhone(phone),
      options: { shouldCreateUser: true },
    });
    if (error) {
      setError(getErrorMessage(error.message));
      return;
    }
    setCountdown(60);
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-sm font-bold tracking-[0.2em] text-teal-400 uppercase mb-2">
            Турклуб «Эва»
          </p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Личный кабинет
          </h1>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          {step === 'phone' ? (
            <PhoneStep
              phone={phone}
              onPhoneChange={setPhone}
              onSubmit={handleSendOtp}
              onGoogleLogin={handleGoogleLogin}
              error={error}
              isPending={isPending}
            />
          ) : (
            <OtpStep
              phone={formatPhone(phone)}
              otp={otp}
              onOtpChange={setOtp}
              onSubmit={handleVerifyOtp}
              onResend={handleResend}
              onBack={() => { setStep('phone'); setError(''); setOtp(''); }}
              error={error}
              isPending={isPending}
              countdown={countdown}
            />
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
          Входя в кабинет, вы соглашаетесь с условиями использования.
          <br />Мы не передаём ваши данные третьим лицам.
        </p>
      </div>
    </main>
  );
}

// ─── КОМПОНЕНТ: ВИДЖЕТ ТЕЛЕГРАМ ────────────────────────────────────
function TelegramLoginWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Очищаем контейнер, чтобы скрипт не задублировался при HMR в Next.js
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    // Твой юзернейм бота
    script.setAttribute('data-telegram-login', 'authevaclub_bot'); 
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12'); // Скругляем углы
    // Куда отправить данные после успешного входа в виджете:
    script.setAttribute('data-auth-url', `${window.location.origin}/api/auth/telegram`);
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center w-full bg-slate-800/50 py-3 rounded-xl border border-white/10 min-h-[50px]"
    />
  );
}

// ─── ШАГ 1: ВЫБОР СПОСОБА ВХОДА (Телефон / Google / Telegram) ───────
function PhoneStep({
  phone,
  onPhoneChange,
  onSubmit,
  onGoogleLogin,
  error,
  isPending,
}: {
  phone: string;
  onPhoneChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleLogin: () => void;
  error: string;
  isPending: boolean;
}) {
  return (
    <div className="space-y-6">
      
      {/* Кнопка Telegram */}
      <div className="space-y-3">
        <TelegramLoginWidget />

        {/* Кнопка Google */}
        <button
          onClick={onGoogleLogin}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Войти через Google
        </button>
      </div>

      {/* Разделитель */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-slate-900 px-4 text-slate-500 uppercase tracking-widest font-bold">или</span>
        </div>
      </div>

      {/* Форма телефона */}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="phone" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            По номеру телефона (SMS)
          </label>
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+373 777 00 000"
              value={phone}
              onChange={e => onPhoneChange(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all text-sm"
              disabled={isPending}
            />
          </div>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending || !phone}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
        >
          {isPending ? <Loader size={18} className="animate-spin" /> : <>Получить код <ArrowRight size={16} /></>}
        </button>
      </form>

    </div>
  );
}

// ─── ШАГ 2: ВВОД OTP КОДА (Если выбрали SMS) ───────────────────────
function OtpStep({
  phone,
  otp,
  onOtpChange,
  onSubmit,
  onResend,
  onBack,
  error,
  isPending,
  countdown,
}: {
  phone: string;
  otp: string;
  onOtpChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
  error: string;
  isPending: boolean;
  countdown: number;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-teal-400" />
          <h2 className="text-lg font-bold text-white">Введите код из SMS</h2>
        </div>
        <p className="text-sm text-slate-400">
          Отправили на <span className="text-white font-medium">{phone}</span>
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="otp" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Код подтверждения
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          value={otp}
          onChange={e => onOtpChange(e.target.value.replace(/\D/g, ''))}
          className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all text-2xl font-mono tracking-[0.5em] text-center"
          required
          disabled={isPending}
          autoFocus
        />
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || otp.length !== 6}
        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
      >
        {isPending ? (
          <Loader size={18} className="animate-spin" />
        ) : (
          <>
            Войти
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Изменить номер
        </button>

        {countdown > 0 ? (
          <span className="text-slate-500">
            Повторить через {countdown}с
          </span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 transition-colors"
          >
            <RotateCcw size={13} />
            Отправить снова
          </button>
        )}
      </div>
    </form>
  );
}

// ─── ПРИВЯЗКА БРОНЕЙ (Если вошли по SMS) ───────────────────────────
async function linkMemberProfile(userId: string, phone: string) {
  try {
    await fetch('/api/account/link-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, phone }),
    });
  } catch {
    // Не критично
  }
}

// ─── ОШИБКИ ────────────────────────────────────────────────────────
function getErrorMessage(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Неверный код. Попробуйте ещё раз.';
  if (msg.includes('Token has expired')) return 'Код истёк. Запросите новый.';
  if (msg.includes('rate limit')) return 'Слишком много попыток. Подождите немного.';
  if (msg.includes('invalid phone')) return 'Неверный формат номера телефона.';
  return 'Что-то пошло не так. Попробуйте ещё раз.';
}