"use client";

import React, { useState } from 'react';
import { Send, BellRing, Sparkles, CheckCircle2 } from 'lucide-react';
import { DirectionData, THEMES } from '@/data/directionsData';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DirectionLeadMagnetProps {
  data: DirectionData;
}

export default function DirectionLeadMagnet({ data }: DirectionLeadMagnetProps) {
  const theme = THEMES[data.theme];
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь в будущем будет логика отправки данных (API)
    setIsSubmitted(true);
  };

  return (
    <section className="relative py-24 md:py-32 bg-[#0b1016] flex justify-center items-center overflow-hidden z-10">
      
      {/* Декоративные фоновые свечения */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] md:blur-[120px] rounded-full opacity-10 pointer-events-none transition-opacity duration-700"
        style={{ 
            backgroundColor: theme.hex,
            opacity: isFocused ? 0.2 : 0.1 // Свечение усиливается, когда юзер вводит текст!
        }}
      />

      <div className="container mx-auto px-4 relative z-10 flex justify-center">
        
        <div 
            className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 zoom-in-95 duration-1000 fill-mode-both"
        >
            {/* Тонкая цветная линия сверху карточки */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: theme.hex }} />

            {/* Контент: До отправки формы */}
            {!isSubmitted ? (
                <div className="flex flex-col items-center text-center">
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                        <BellRing size={14} style={{ color: theme.hex }} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Расписание формируется</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight mb-4">
                        Будьте первыми в <span style={{ color: theme.hex }}>очереди</span>
                    </h2>
                    
                    <p className="text-sm md:text-base text-slate-400 font-medium max-w-md mb-8 leading-relaxed">
                        Оставьте свой Telegram или Email. Мы пришлем секретную ссылку на бронирование за 24 часа до официального старта продаж.
                    </p>

                    {/* Форма с эффектом Focus-Within (Светится при вводе) */}
                    <form 
                        onSubmit={handleSubmit} 
                        className={cn(
                            "w-full max-w-sm flex items-center p-1.5 rounded-2xl bg-slate-950 border transition-all duration-300",
                            isFocused ? "border-transparent" : "border-white/10"
                        )}
                        style={{
                            boxShadow: isFocused ? `0 0 0 2px ${theme.hex}, 0 10px 30px ${theme.glow}` : 'none'
                        }}
                    >
                        <input 
                            type="text" 
                            placeholder="@username или Email" 
                            required
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="flex-1 bg-transparent border-none outline-none px-4 text-white text-sm font-medium placeholder:text-slate-600"
                        />
                        <button 
                            type="submit"
                            className="w-12 h-12 flex items-center justify-center rounded-xl text-slate-900 transition-all hover:scale-105 active:scale-95 shadow-lg"
                            style={{ backgroundColor: theme.hex }}
                        >
                            <Send size={18} strokeWidth={2.5} className="ml-0.5" />
                        </button>
                    </form>

                    <div className="mt-6 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <Sparkles size={12} style={{ color: theme.hex }} />
                        <span>Первым записавшимся — бонус от гида</span>
                    </div>
                </div>
            ) : (
                
                /* Контент: После успешной отправки (Успех) */
                <div 
                    className="flex flex-col items-center text-center py-8 animate-in fade-in zoom-in duration-500"
                >
                    <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl"
                        style={{ backgroundColor: theme.glow, color: theme.hex }}
                    >
                        <CheckCircle2 size={40} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
                        Контакт принят!
                    </h3>
                    <p className="text-slate-400 font-medium max-w-sm">
                        Вы в секретном списке. Как только мы утвердим даты, вы узнаете об этом первыми.
                    </p>
                </div>
            )}

        </div>
      </div>
    </section>
  );
}