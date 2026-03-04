"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Неверный email или пароль');
      setLoading(false);
      return;
    }

    // Успешный вход → в админку
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="text-4xl font-black text-white tracking-tighter">ЭВА</div>
          <p className="text-slate-400 text-sm mt-1">Панель управления</p>
        </div>

        {/* Форма */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-white/10
                    rounded-xl text-white text-sm outline-none
                    focus:border-teal-500 transition"
                  placeholder="admin@evatur.club"
                />
              </div>
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-white/10
                    rounded-xl text-white text-sm outline-none
                    focus:border-teal-500 transition"
                  placeholder="••••••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            {/* Кнопка */}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50
                text-slate-950 font-black rounded-xl transition text-sm uppercase tracking-widest">
              {loading ? 'Входим...' : 'Войти'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
