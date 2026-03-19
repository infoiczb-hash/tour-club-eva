'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Phone, ArrowRight, RotateCcw, ShieldCheck, Loader } from 'lucide-react';

// ─── типы шагов ────────────────────────────────────────────────────
type Step = 'phone' | 'otp';

// ─── маска номера телефона ──────────────────────────────────────────
function formatPhone(raw: string): string {
  // Оставляем только цифры и ведущий +
  return raw.replace(/[^\d+]/g, '');
}

// ─── компонент ─────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/account';

  const supabase = createClient();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isPending, startTransition] = useTransition();

  // ── обратный отсчёт для повторной отправки ──────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

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
        options: {
          // После верификации создаём пользователя если не существует
          shouldCreateUser: true,
        },
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
        // Привязываем исторические брони и создаём/обновляем MemberProfile
        await linkMemberProfile(data.user.id, formatPhone(phone));
        router.push(next);
        router.refresh();
      }
    });
  }

  // ── повторная отправка ──────────────────────────────────────────
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

      {/* Фоновое свечение */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Логотип */}
        <div className="text-center mb-8">
          <p className="text-sm font-bold tracking-[0.2em] text-teal-400 uppercase mb-2">
            Турклуб «Эва»
          </p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Личный кабинет. Кабинет начнет функционировать с 20.04.2026.
          </h1>
        </div>

        {/* Карточка */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

          {step === 'phone' ? (
            <PhoneStep
              phone={phone}
              onPhoneChange={setPhone}
              onSubmit={handleSendOtp}
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

        {/* Дисклеймер */}
        <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
          Входя в кабинет, вы соглашаетесь с условиями использования.
          <br />Мы не передаём ваш номер третьим лицам.
        </p>

      </div>
    </main>
  );
}

// ─── шаг 1: ввод номера ────────────────────────────────────────────
function PhoneStep({
  phone,
  onPhoneChange,
  onSubmit,
  error,
  isPending,
}: {
  phone: string;
  onPhoneChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  isPending: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">

      <div>
        <h2 className="text-lg font-bold text-white mb-1">Войти по номеру телефона</h2>
        <p className="text-sm text-slate-400">
          Мы отправим SMS с кодом подтверждения
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Номер телефона
        </label>
        <div className="relative">
          <Phone
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+373 777 00 000"
            value={phone}
            onChange={e => onPhoneChange(e.target.value)}
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all text-sm"
            required
            disabled={isPending}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !phone}
        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
      >
        {isPending ? (
          <Loader size={18} className="animate-spin" />
        ) : (
          <>
            Получить код
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Уже ходили с нами? Введите тот же номер — ваша история туров подтянется автоматически.
      </p>

    </form>
  );
}

// ─── шаг 2: ввод OTP ───────────────────────────────────────────────
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

// ─── привязка MemberProfile ─────────────────────────────────────────
// Вызывается после успешного OTP — создаёт профиль и привязывает брони
async function linkMemberProfile(userId: string, phone: string) {
  try {
    await fetch('/api/account/link-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, phone }),
    });
  } catch {
    // Не критично — профиль создастся при следующем заходе в кабинет
  }
}

// ─── читаемые сообщения об ошибках ─────────────────────────────────
function getErrorMessage(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Неверный код. Попробуйте ещё раз.';
  if (msg.includes('Token has expired')) return 'Код истёк. Запросите новый.';
  if (msg.includes('rate limit')) return 'Слишком много попыток. Подождите немного.';
  if (msg.includes('invalid phone')) return 'Неверный формат номера телефона.';
  return 'Что-то пошло не так. Попробуйте ещё раз.';
}
