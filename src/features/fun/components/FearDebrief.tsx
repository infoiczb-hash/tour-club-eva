// src/features/fun/components/FearDebrief.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Shield, ArrowLeft, Check, X, Compass, Sparkles, Loader2, HelpCircle, ArrowRight
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import TourCard from "@/features/tours/components/TourCard";
import { Tour } from "@/features/tours/types";
import { useProfile } from "@/hooks/useProfile"; 
import { incrementFunTestPassAction } from "@/features/admin/actions/fun";
import { getToursForQuizAction } from "@/features/fun/actions";
import { useSaveTest } from "@/hooks/useSaveTest";

// === VERCEL AI SDK ===
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ─── ДАННЫЕ ──────────────────────────────────────────────────────────────────
type FearKey = "physical" | "judgment" | "heights" | "unknown" | "comfort" | "lost" | "alone" | "notforme";

const FEARS: { key: FearKey; label: string; sublabel: string }[] = [
  { key: "physical", label: "Боюсь не справиться физически", sublabel: "Что у меня не хватит сил или выносливости" },
  { key: "judgment", label: "Боюсь выглядеть слабым", sublabel: "Что группа будет смотреть на меня как на обузу" },
  { key: "heights", label: "Боюсь высоты", sublabel: "Или замкнутых пространств, крутых склонов" },
  { key: "unknown", label: "Не знаю с чего начать", sublabel: "И боюсь выглядеть новичком который ничего не знает" },
  { key: "comfort", label: "Боюсь дискомфорта", sublabel: "Еда, туалет, холод, отсутствие душа" },
  { key: "lost", label: "Боюсь что что-то пойдёт не так", sublabel: "Потеряться, заболеть, попасть в опасность" },
  { key: "alone", label: "Не с кем идти", sublabel: "Все мои знакомые не разделяют этот интерес" },
  { key: "notforme", label: "Это не для меня", sublabel: "Походы — для особых людей, а я не такой" },
];

const FEAR_INFO: Record<FearKey, { honest: string; reality: string; step: string }> = {
  physical: { honest: "Это самый честный страх. И в нём есть доля правды — физическая подготовка влияет на качество.", reality: "Большинство маршрутов рассчитаны на людей без спецподготовки. Группа идёт в темпе самого медленного.", step: "Начни с маршрутов по воде (SUP/Байдарки) или легких треккингов." },
  judgment: { honest: "Страх оценки — это про боязнь быть отвергнутым когда ты уязвим. И он логичен.", reality: "Людям в походе некогда оценивать других — они заняты собой. Взаимопомощь — то, что сближает группу.", step: "Выбери тур выходного дня с небольшой группой." },
  heights: { honest: "Страх высоты — один из немногих встроенных в человека страхов. Это нормальная нейробиология.", reality: "Большинство маршрутов не требуют хождения по краям обрывов. Страх высоты в городе и в горах — разные вещи.", step: "Начни с лесных троп и сплавов." },
  unknown: { honest: "Страх незнания — это страх потерять контроль. Когда не знаешь правил, ты чувствуешь себя некомфортно.", reality: "Каждый турист был новичком. Вопрос «как это работает» вызывает у нас не насмешку, а желание помочь.", step: "Напиши нашему менеджеру: «Я иду первый раз, что нужно знать?»" },
  comfort: { honest: "Дискомфорт в походе — реальность. Вопрос лишь в том, какой именно и насколько ты к нему готов.", reality: "Современный туризм отличается от выживания. Хорошие туры предусматривают вкусную еду и кемпы.", step: "Выбери однодневный тур или маршрут с ночевками в домиках." },
  lost: { honest: "Страх, что что-то пойдёт не так — это страх потери инфраструктуры безопасности.", reality: "Организованные туры управляют этим риском. У гида есть аптечка, план эвакуации и связь.", step: "Мы берем все риски на себя, просто доверься гиду." },
  alone: { honest: "Это не страх, а практическое препятствие. И оно решаемое, хотя поначалу кажется неловким.", reality: "80% людей в турах приходят одни. Это абсолютная норма. Незнакомцы быстро становятся попутчиками.", step: "Просто нажми «Записаться». Гид поможет мягко влиться в коллектив." },
  notforme: { honest: "Это самый тихий страх. «Такие люди» в твоей голове — спортивные, бесстрашные. А ты — якобы нет.", reality: "«Таких людей» не существует. С нами ходят обычные офисные работники и айтишники.", step: "Попробуй SUP-прогулку на 2 часа. Тебе не нужно быть спортсменом." },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FearDebriefModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<"select" | "detail" | "summary" | "ai_result">("select");
  const [selected, setSelected] = useState<FearKey[]>([]);
  const [viewing, setViewing] = useState<FearKey | null>(null);
  
  const { updateProfile } = useProfile();
  const { saveResult } = useSaveTest();
  
  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  // === ОФИЦИАЛЬНЫЙ ХУК VERCEL AI SDK ===
  const { object, submit, isLoading, error } = useObject({
    api: '/api/fun/analyze',
    schema: z.object({
      analysis: z.string().describe('Анализ страхов туриста'),
      recommendedTourId: z.string().nullable().describe('ID подходящего тура')
    }),
    onFinish: ({ object }) => {
      // Сохраняем в локальный профиль
      updateProfile({ fears: selected }); 
      incrementFunTestPassAction('fears').catch(console.error);

      // Сохраняем ИИ-лонгрид в БД Личного кабинета
      if (object?.analysis) {
        saveResult('fears', {
          type: "Анализ страхов",
          badge: "🛡️",
          description: "Психологический разбор барьеров и рекомендации по их преодолению.",
          fullAnalysis: object.analysis,
        });
      }
    }
  });

  const aiAnalysis = object?.analysis || "";
  const recommendedTour = object?.recommendedTourId && allTours.length > 0
    ? allTours.find(t => t.id === object.recommendedTourId)
    : null;

  // Если грузится и текста еще нет — значит ИИ "думает"
  const isThinking = isLoading && !object?.analysis;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStep("select");
      setSelected([]);
      setViewing(null);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isThinking) { setLoadingStep(0); return; }
    const interval = setInterval(() => setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev)), 1800);
    return () => clearInterval(interval);
  }, [isThinking]);

  const toggleFear = (key: FearKey) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleGetAiMagic = async () => {
    if (isLoading || selected.length === 0) return;

    setStep("ai_result");

    if (allTours.length === 0) {
      const tours = await getToursForQuizAction();
      setAllTours(tours);
    }

    const fearsDetailed = selected.map(k => FEARS.find(f => f.key === k)?.label || k);
    
    // Передаем данные в API
    submit({ 
      type: 'fears', 
      payload: { fearsDetailed } 
    });
  };
  
  const getLoadingText = () => {
    if (loadingStep === 0) return "Собираем твои ответы...";
    if (loadingStep === 1 && selected.length > 0) {
        const firstFear = FEARS.find(f => f.key === selected[0]);
        return `Анализируем: ${firstFear?.label.toLowerCase()}...`;
    }
    if (loadingStep === 2) return "Подбираем безопасные маршруты...";
    return "Формируем персональный разбор...";
  };

  if (!isOpen) return null;

  const viewingInfo = viewing ? FEAR_INFO[viewing] : null;
  const viewingFear = viewing ? FEARS.find((f) => f.key === viewing) : null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {/* Заменили max-h-[90vh] на max-h-[90dvh] */}
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]" onClick={(e) => e.stopPropagation()}>
          
          <button onClick={onClose} aria-label="Закрыть" className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors z-20 p-3 bg-white/5 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>

          {/* === 1. ВЫБОР СТРАХОВ === */}
          {step === "select" && (
            <motion.div key="select" className="flex flex-col h-full overflow-hidden">
              <div className="shrink-0 mb-6 pr-8">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 text-sm font-bold tracking-widest uppercase">Разбор страхов</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3 tracking-tight">
                  Что тебя <span className="text-blue-400">останавливает?</span>
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">Выбери всё, что резонирует. Здесь нет неправильных ответов.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 space-y-3">
                {FEARS.map((fear) => {
                  const isSel = selected.includes(fear.key);
                  return (
                    <div key={fear.key} className="flex gap-3 items-stretch">
                       <button onClick={() => { setViewing(fear.key); setStep("detail"); }} className={cn("w-14 rounded-2xl border flex flex-col items-center justify-center transition-all shrink-0 group", "bg-slate-800/50 border-white/5 hover:border-blue-500/30 text-slate-400 hover:bg-slate-800 hover:text-blue-400")} title="Читать подробнее">
                          <HelpCircle size={22} className="transition-colors" />
                       </button>
                       <button onClick={() => toggleFear(fear.key)} className={cn("flex-1 text-left px-5 py-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 group", isSel ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "border-white/5 bg-slate-800/50 hover:bg-slate-800")}>
                          <div>
                             <div className={cn("text-[15px] md:text-base font-bold transition-colors leading-snug", isSel ? "text-white" : "text-slate-300 group-hover:text-white")}>{fear.label}</div>
                             <div className="text-slate-500 text-xs md:text-sm font-medium mt-1 leading-snug">{fear.sublabel}</div>
                          </div>
                          <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all", isSel ? "bg-blue-500 border-blue-500" : "border-slate-600 group-hover:border-blue-500/50")}>
                            {isSel && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                          </div>
                       </button>
                    </div>
                  );
                })}
              </div>

              <div className="shrink-0 pt-4 border-t border-white/5 mt-2">
                 {selected.length > 0 ? (
                    <button onClick={() => setStep("summary")} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
                      Разобрать мои страхи ({selected.length})
                    </button>
                 ) : (
                    <div className="w-full bg-slate-800 text-slate-500 rounded-xl py-4 text-sm font-bold uppercase tracking-wider text-center cursor-not-allowed">
                       Выбери хотя бы один страх
                    </div>
                 )}
              </div>
            </motion.div>
          )}

          {/* === 2. ДЕТАЛИ СТРАХА === */}
          {step === "detail" && viewingInfo && viewingFear && (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full overflow-hidden">
              <div className="shrink-0 mb-6">
                 <button onClick={() => setStep("select")} className="flex items-center gap-3 text-slate-400 hover:text-white text-sm font-bold uppercase tracking-widest mb-6 transition-colors"><ArrowLeft size={16} /> Назад</button>
                 <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{viewingFear.label}</h2>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                <div className="border-l-2 border-slate-700 pl-5"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Честно</p><p className="text-slate-300 text-sm leading-relaxed font-medium">{viewingInfo.honest}</p></div>
                <div className="border-l-2 border-blue-500/50 pl-5 bg-blue-500/5 py-4 rounded-r-xl"><p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-2">В реальности</p><p className="text-slate-300 text-sm leading-relaxed font-medium">{viewingInfo.reality}</p></div>
                <div className="border-l-2 border-teal-500/80 pl-5"><p className="text-teal-500 text-[10px] font-bold uppercase tracking-widest mb-2">Первый шаг</p><p className="text-white text-sm leading-relaxed font-bold">{viewingInfo.step}</p></div>
              </div>
              <div className="shrink-0 mt-6 pt-4 border-t border-white/10">
                <button onClick={() => { if (!selected.includes(viewingFear.key)) toggleFear(viewingFear.key); setStep("select"); }} className={cn("w-full rounded-xl py-4 text-sm font-bold uppercase tracking-wider transition-all", selected.includes(viewingFear.key) ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20")}>
                  {selected.includes(viewingFear.key) ? "Вернуться к списку" : "Добавить к моим страхам"}
                </button>
              </div>
            </motion.div>
          )}

          {/* === 3. БАЗОВОЕ САММАРИ === */}
          {step === "summary" && (
            <motion.div key="summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
                <div className="shrink-0 mb-6">
                  <button onClick={() => setStep("select")} className="flex items-center gap-3 text-slate-400 hover:text-white text-sm font-bold uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft size={16} /> Назад
                  </button>
                  <h2 className="text-3xl font-black text-white tracking-tight">Резюме</h2>
                </div>
                
                <div className="space-y-4">
                  {selected.map((key) => {
                    const f = FEARS.find((x) => x.key === key)!;
                    const info = FEAR_INFO[key];
                    return (
                      <div key={key} className="border border-white/10 rounded-2xl p-5 bg-slate-800/30">
                        <p className="text-white text-base font-bold mb-3 flex items-center gap-3"><Check className="text-blue-500" size={16}/> {f.label}</p>
                        <div className="bg-slate-900 rounded-xl p-4"><p className="text-teal-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Решение</p><p className="text-slate-300 text-sm leading-relaxed font-medium">{info.step}</p></div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 border border-indigo-500/30 bg-indigo-500/10 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
                  <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">Глубокий разбор от AI</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    ИИ проанализирует связку твоих страхов, даст терапевтичный ответ и <strong className="text-white">подберет 1 идеальный тур</strong>.
                  </p>
                  <button onClick={handleGetAiMagic} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 relative z-10 disabled:opacity-70">
                    <Sparkles size={16} /> Начать анализ
                  </button>
                </div>

                {/* SMART CTA (Альтернатива для тех, кто не хочет ждать ИИ) */}
                <div className="pt-6 mt-6 border-t border-white/10 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Или переходи к выбору</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/directions"
                      onClick={onClose}
                      className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Compass size={16} /> Все направления
                    </Link>
                    <Link
                      href="/tour"
                      onClick={onClose}
                      className="flex-1 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      Смотреть туры <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* === 4. МАГИЯ AI === */}
          {step === "ai_result" && (
            <motion.div key="ai_result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                  <div className="text-center mb-8 border-b border-white/10 pb-6 pt-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-4 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                          <Shield className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Персональный разбор</h2>
                  </div>
                  
                  {/* ПРОГРЕССИВНЫЙ UI (Скелетон вместо пустоты) */}
                  {isThinking ? (
                    <div className="space-y-4 px-2 animate-pulse">
                       <div className="h-3 bg-slate-800 rounded w-full"></div>
                       <div className="h-3 bg-slate-800 rounded w-11/12"></div>
                       <div className="h-3 bg-slate-800 rounded w-full"></div>
                       <div className="h-3 bg-slate-800 rounded w-4/5"></div>
                       <div className="h-3 bg-slate-800 rounded w-full mt-4"></div>
                       <div className="h-3 bg-slate-800 rounded w-5/6"></div>
                       
                       <div className="flex items-center justify-center gap-3 mt-10">
                           <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                           <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{getLoadingText()}</span>
                       </div>
                    </div>
                  ) : error ? (
                    <div className="text-rose-400 text-center font-medium">Произошла ошибка: {error.message}</div>
                  ) : (
                    <>
                      <div className="prose prose-sm prose-invert max-w-none text-slate-300 leading-relaxed font-medium mb-10 text-justify">
                       {aiAnalysis.split('\n').map((paragraph: string, idx: number) => (
                          <p key={idx} className="mb-4">{paragraph}</p>
                       ))}
                      </div>
                      
                      {recommendedTour && (
                          <div className="mt-4 pt-8 border-t border-white/10 animate-in fade-in duration-500">
                              <div className="flex items-center gap-3 mb-6">
                                  <Compass className="text-teal-400" size={20} />
                                  <h3 className="text-lg font-black text-white uppercase tracking-wide">Твой идеальный старт:</h3>
                              </div>
                              <div className="w-full">
                                  <TourCard tour={recommendedTour} />
                              </div>
                          </div>
                      )}

                      {/* SMART CTA ПОСЛЕ ИИ (Если тур не подошел) */}
                      <div className="pt-8 mt-6 border-t border-white/10 text-center animate-in fade-in duration-500">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Продолжить</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link
                            href="/directions"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                          >
                            <Compass size={14} /> Изучить направления
                          </Link>
                          <Link
                            href="/tour"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                          >
                            Расписание туров <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>

                    </>
                  )}
                </div>
            </motion.div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}