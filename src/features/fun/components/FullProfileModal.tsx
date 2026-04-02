"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2, Brain, ShieldCheck } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

// === НОВЫЕ ИМПОРТЫ ДЛЯ VERCEL AI SDK ===
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

export default function FullProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile } = useProfile();

  // === ОФИЦИАЛЬНЫЙ ХУК VERCEL AI SDK ===
  const { object, submit, isLoading, error } = useObject({
    api: '/api/fun/analyze', // Наш единый шлюз
    schema: z.object({
      summaryTitle: z.string().optional(),
      psychologicalPortrait: z.string().optional(),
      mainInsight: z.string().optional(),
      advice: z.string().optional()
    })
  });

  const getSuperAnalysis = () => {
    // Отправляем весь накопленный профиль в единый API
    submit({
      type: 'full-profile',
      payload: { profile }
    });
  };

  // Лоадер показываем только до появления первых данных
  const isThinking = isLoading && !object;
  const hasData = !!object;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div role="dialog" aria-modal="true" aria-labelledby="modal-fullprofile-title" className="relative w-full max-w-3xl bg-slate-900/50 border border-indigo-500/20 rounded-[3rem] p-8 md:p-12 shadow-[0_0_50px_rgba(99,102,241,0.1)] overflow-y-auto max-h-[90vh] custom-scrollbar">
          <button onClick={onClose} aria-label="Закрыть" className="absolute top-8 right-8 text-slate-300 hover:text-white transition-colors z-20">
            <X size={24} />
          </button>

          {/* 1. ИНТРО (До начала генерации) */}
          {!hasData && !isThinking && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                <Sparkles className="text-indigo-400" size={40} />
              </div>
              <h2 id="modal-fullprofile-title" className="text-4xl font-black text-white uppercase mb-4">
                Все части пазла <span className="text-indigo-400">собраны</span>
              </h2>
              <p className="text-slate-300 text-lg mb-10 max-w-md mx-auto">
                Ты прошел основные этапы. Теперь мы готовы объединить твои страхи, физику и симптомы в единую карту твоей личности.
              </p>
              
              {error && (
                <div className="text-rose-400 mb-6 font-medium">Ошибка: {error.message}</div>
              )}

              <button onClick={getSuperAnalysis} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/20">
                Сгенерировать синтез профиля
              </button>
            </div>
          )}

          {/* 2. ЗАГРУЗКА (ИИ думает над первыми словами) */}
          {isThinking && (
            <div className="py-20 text-center">
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
              <p className="text-xl font-bold text-white animate-pulse">Синхронизируем данные твоей души...</p>
            </div>
          )}

          {/* 3. РЕЗУЛЬТАТ (Отрисовка потока в реальном времени) */}
          {hasData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="text-center border-b border-white/10 pb-10 mt-6">
                <div className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Твой архетип в ЭВА</div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-none tracking-tighter">
                  {object.summaryTitle || <span className="text-slate-700 animate-pulse">Анализируем...</span>}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-400">
                      <Brain size={20}/>
                    </div>
                    <div className="text-slate-300 leading-relaxed text-sm italic">
                      "{object.mainInsight || "Формируем главный инсайт..."}"
                    </div>
                  </div>
                  <div className="text-slate-300 leading-relaxed text-justify text-sm">
                    {object.psychologicalPortrait}
                  </div>
                </div>

                <div className="bg-white/5 rounded-3xl p-8 border border-white/5 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4 text-teal-400">
                    <ShieldCheck size={24} />
                    <span className="font-black uppercase tracking-wider text-sm">Твоя точка роста</span>
                  </div>
                  <p className="text-white font-medium leading-relaxed">
                    {object.advice || "Подбираем рекомендацию..."}
                  </p>
                </div>
              </div>

              <div className="pt-10 flex flex-col items-center">
                <p className="text-slate-300 text-xs uppercase font-bold tracking-widest mb-6 text-center">
                  Это твой уникальный путь. <br/> Мы будем рады стать его частью, когда ты решишься.
                </p>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xs font-black uppercase tracking-widest underline underline-offset-8">
                  Закрыть и вернуться к реальности
                </button>
              </div>
            </motion.div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}