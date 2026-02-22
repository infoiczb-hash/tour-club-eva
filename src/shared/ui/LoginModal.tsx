"use client";

import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
    const [pass, setPass] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Хардкод пароль для MVP. Потом заменим на Supabase Auth
        if(pass === 'admin') onLogin();
        else alert('Неверный пароль');
    };

    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock className="text-teal-600"/> Вход для администратора</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
                autoFocus 
                type="password" 
                placeholder="Пароль (admin)" 
                className="w-full p-3 border rounded-xl text-center outline-none focus:border-teal-500 transition" 
                value={pass} 
                onChange={e => setPass(e.target.value)}
                // 👇 ЭТА СТРОКА РЕШАЕТ ПРОБЛЕМУ
                suppressHydrationWarning={true}
            />
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition">Отмена</button>
                <button type="submit" className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition">Войти</button>
            </div>
          </form>
        </div>
      </div>
    );
}