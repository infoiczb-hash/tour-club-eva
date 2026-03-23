// src/features/fun/components/PhysicalReadiness.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Activity, HeartPulse, Dumbbell, Zap, ArrowLeft, X, 
  Check, Compass, ArrowRight, Loader2, ShieldCheck,
  Flame, BatteryCharging, BatteryWarning, BatteryFull, Trophy
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

// ─── ДАННЫЕ И ВОПРОСЫ ────────────────────────────────────────────────────────
type AnswerValue = 1 | 2 | 3;

interface Question {
  id: number;
  text: string;
  options: { value: AnswerValue; text: string; icon: React.ReactNode }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Твоя активность в обычной жизни?",
    options: [
      { value: 1, text: "Дойти до машины/курьера", icon: <BatteryWarning size={18}/> },
      { value: 2, text: "10 000 шагов или 1-2 тренировки", icon: <BatteryCharging size={18}/> },
      { value: 3, text: "Регулярный спорт (3+ раз в неделю)", icon: <BatteryFull size={18}/> },
    ]
  },
  {
    id: 2,
    text: "Подъём пешком на 5-й этаж:",
    options: [
      { value: 1, text: "Одышка, нужно постоять", icon: <HeartPulse size={18}/> },
      { value: 2, text: "Слегка сбито дыхание, но ок", icon: <Activity size={18}/> },
      { value: 3, text: "Даже не замечу", icon: <Zap size={18}/> },
    ]
  },
  {
    id: 3,
    text: "Как твои колени и суставы?",
    options: [
      { value: 1, text: "Часто ноют или есть травмы", icon: <ShieldCheck size={18}/> },
      { value: 2, text: "Иногда хрустят, но не критично", icon: <Activity size={18}/> },
      { value: 3, text: "В идеальном состоянии", icon: <Dumbbell size={18}/> },
    ]
  },
  {
    id: 4,
    text: "Готовность нести рюкзак 10-15 кг?",
    options: [
      { value: 1, text: "Только от такси до дома", icon: <BatteryWarning size={18}/> },
      { value: 2, text: "Пару часов выдержу", icon: <BatteryCharging size={18}/> },
      { value: 3, text: "Весь день без проблем", icon: <BatteryFull size={18}/> },
    ]
  }
];

const LEVELS = [
  { 
    min: 4, max: 6, 
    title: "Начальный", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    summary: "Твои мышцы пока спят, но это временно. Горы не требуют олимпийских рекордов. Тебе подойдут сплавы и легкие прогулки."
  },
  { 
    min: 7, max: 10, 
    title: "Уверенный", 
    color: "text-blue-400", 
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    summary: "Отличная база! У тебя есть выносливость для большинства наших стандартных маршрутов. Суставы готовы к работе."
  },
  { 
    min: 11, max: 12, 
    title: "Спортивный", 
    color: "text-amber-400", 
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    summary: "Ты машина. Тебя не испугать набором высоты и тяжелым рюкзаком. Можешь смело выбирать самые амбициозные треккинги."
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhysicalReadinessModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<"intro" | "questions" | "summary" | "ai_result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  
  const { updateProfile } = useProfile();
  const { saveResult } = useSaveTest();
  
  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  // === ОФИЦИАЛЬНЫЙ ХУК VERCEL AI SDK ===
  const { object, submit, isLoading, error } = useObject({
    api: '/api/fun/analyze',
    schema: z.object({
      analysis: z.string().describe('Развернутый ответ ИИ.'),
      recommendedTourId: z.string().nullable().describe('ID подходящего тура из списка.')
    }),
    onFinish: ({ object }) => {
      const score = Object.values(answers).reduce((a, b) => a + b, 0);
      const level = LEVELS.find(l => score >= l.min && score <= l.max)!;

      // Локальное сохранение
      updateProfile({ physicalLevel: level.title });
      incrementFunTestPassAction('physical').catch(console.error);

      // Сохранение ИИ-лонгрида в базу данных
      if (object?.analysis) {
        saveResult('physical', {
          type: level.title,
          badge: "⚡",
          description: level.summary,
          fullAnalysis: object.analysis,
          score: { total: score }
        });
      }
    }
  });

  const aiAnalysis = object?.analysis || "";
  const recommendedTour = object?.recommendedTourId && allTours.length > 0
    ? allTours.find(t => t.id === object?.recommendedTourId) 
    : null;

  // Лоадер показываем только пока ИИ "думает" (до первого символа)
  const isThinking = isLoading && !object?.analysis;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStep("intro");
      setCurrentQ(0);
      setAnswers({});
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

  const handleAnswer = (val: AnswerValue) => {
    const nextAnswers = { ...answers, [QUESTIONS[currentQ].id]: val };
    setAnswers(nextAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(c => c + 1), 250);
    } else {
      setTimeout(() => setStep("summary"), 250);
    }
  };

  const handleGetAiMagic = async () => {
    if (isLoading) return;
    setStep("ai_result");

    if (allTours.length === 0) {
      const tours = await getToursForQuizAction();
      setAllTours(tours);
    }

    const score = Object.values(answers).reduce((a, b) => a + b, 0);
    const level = LEVELS.find(l => score >= l.min && score <= l.max)!;

    // Формируем текстовые ответы для ИИ
    const answersText = QUESTIONS.map(q => {
      const ansVal = answers[q.id];
      const ansText = q.options.find(o => o.value === ansVal)?.text;
      return `- ${q.text} ${ansText}`;
    }).join('\n');

    // Отправляем в API
    submit({ 
      type: 'physical', 
      payload: { 
        levelTitle: level.title, 
        levelSummary: level.summary,
        answersText 
      } 
    });
  };

  const getLoadingText = () => {
    if (loadingStep === 0) return "Оцениваем выносливость...";
    if (loadingStep === 1) return "Считаем нагрузку на суставы...";
    if (loadingStep === 2) return "Подбираем маршруты по силам...";
    return "Формируем спортивное резюме...";
  };

  if (!isOpen) return null;

  const currentQuestion = QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;
  
  const score = Object.values(answers).reduce((a, b) => a + b, 0);
  const currentLevel = LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} 
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]" onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} aria-label="Закрыть" className="absolute top-5 right-5 z-20 text-slate-400 hover:text-white transition-colors p-3 bg-white/5 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>

          {/* === 1. ИНТРО === */}
          {step === "intro" && (
            <motion.div key="intro" className="flex flex-col h-full overflow-hidden p-6 md:p-10 pb-6 text-center justify-center">
              <div className="w-20 h-20 mx-auto bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <HeartPulse size={36} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4 tracking-tight uppercase">Оценка<br /><span className="text-cyan-400">физической формы</span></h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium mb-10 max-w-md mx-auto">
                Давай честно оценим твои силы. Это нужно не для соревнований, а чтобы подобрать маршрут, от которого ты получишь кайф, а не травмы.
              </p>
              <button onClick={() => setStep("questions")} className="w-full sm:w-auto px-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider mx-auto transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95">
                Пройти тест
              </button>
            </motion.div>
          )}

          {/* === 2. ВОПРОСЫ === */}
          {step === "questions" && (
            <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full overflow-hidden p-6 md:p-10 pb-6">
              <div className="shrink-0 mb-8 pr-8">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Вопрос {currentQ + 1} из {QUESTIONS.length}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-6">{currentQuestion.text}</h2>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-cyan-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 space-y-3">
                {currentQuestion.options.map((opt) => (
                    <button key={opt.value} onClick={() => handleAnswer(opt.value)} className="w-full text-left px-5 py-4 rounded-2xl border border-white/5 bg-slate-800/50 hover:bg-slate-800 hover:border-cyan-500/50 transition-all duration-300 flex items-center gap-4 group">
                        <div className="text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0">{opt.icon}</div>
                        <div className="text-[15px] md:text-base font-bold text-slate-300 group-hover:text-white transition-colors">{opt.text}</div>
                    </button>
                ))}
              </div>

              {currentQ > 0 && (
                <div className="shrink-0 pt-4 border-t border-white/5 mt-2">
                   <button onClick={() => setCurrentQ(q => q - 1)} className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"><ArrowLeft size={16} /> Назад</button>
                </div>
              )}
            </motion.div>
          )}

          {/* === 3. САММАРИ === */}
          {step === "summary" && (
            <motion.div key="summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full overflow-hidden p-6 md:p-10 pb-6">
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
                <div className="shrink-0 mb-8">
                  <button onClick={() => { setStep("questions"); setCurrentQ(QUESTIONS.length - 1); }} className="flex items-center gap-3 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft size={16} /> Назад
                  </button>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2">Твой уровень:</h2>
                </div>
                
                <div className={cn("border rounded-3xl p-6 md:p-8 text-center mb-6 relative overflow-hidden shadow-xl", currentLevel.bg, currentLevel.border)}>
                  <div className={cn("absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,currentColor_0%,transparent_70%)] pointer-events-none", currentLevel.color)} />
                  <Trophy className={cn("w-12 h-12 mx-auto mb-4 relative z-10", currentLevel.color)} />
                  <h3 className={cn("text-3xl md:text-4xl font-black uppercase tracking-tight mb-4 relative z-10", currentLevel.color)}>{currentLevel.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed font-medium relative z-10">{currentLevel.summary}</p>
                </div>

                <div className="border border-cyan-500/30 bg-cyan-500/10 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)] pointer-events-none" />
                  <Flame className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">Персональный AI-тренер</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    ИИ проанализирует твои суставы и кардио, даст советы по подготовке и <strong className="text-white">подберет идеальный тур по силам</strong>.
                  </p>
                  <button onClick={handleGetAiMagic} disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 relative z-10 disabled:opacity-70">
                    <Flame size={16} /> Получить разбор
                  </button>
                </div>

                {/* SMART CTA ПОСЛЕ САММАРИ */}
                <div className="pt-6 mt-6 border-t border-white/10 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Или переходи к выбору</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/directions"
                      onClick={onClose}
                      className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Compass size={16} /> О направлениях
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
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                    <div className="text-center mb-8 border-b border-white/10 pb-6 pt-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                            <Activity className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Разбор тренера</h2>
                    </div>

                    {/* ПРОГРЕССИВНЫЙ UI (Скелетон вместо пустоты) */}
                    {isThinking ? (
                      <div className="space-y-4 px-2 animate-pulse mt-4">
                         <div className="h-3 bg-slate-800 rounded w-full"></div>
                         <div className="h-3 bg-slate-800 rounded w-11/12"></div>
                         <div className="h-3 bg-slate-800 rounded w-full"></div>
                         <div className="h-3 bg-slate-800 rounded w-4/5"></div>
                         <div className="h-3 bg-slate-800 rounded w-full mt-4"></div>
                         <div className="h-3 bg-slate-800 rounded w-5/6"></div>
                         
                         <div className="flex items-center justify-center gap-3 mt-10">
                             <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                             <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{getLoadingText()}</span>
                         </div>
                      </div>
                    ) : error ? (
                      <div className="text-rose-400 text-center font-medium">Произошла ошибка: {error.message}</div>
                    ) : (
                      <>
                        {/* ТЕКСТ ПОЯВЛЯЕТСЯ БУКВА ЗА БУКВОЙ */}
                        <div className="prose prose-sm prose-invert max-w-none text-slate-300 leading-relaxed font-medium mb-10 text-justify">
                          {aiAnalysis.split('\n').map((paragraph: string, idx: number) => (
                              <p key={idx} className="mb-4">{paragraph}</p>
                          ))}
                        </div>

                        {/* КАРТОЧКА ТУРА ПОЯВИТСЯ, КАК ТОЛЬКО ИИ ПРИШЛЕТ ID */}
                        {recommendedTour && (
                            <div className="mt-4 pt-8 border-t border-white/10 animate-in fade-in duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <Compass className="text-cyan-400" size={20} />
                                    <h3 className="text-lg font-black text-white uppercase tracking-wide">Маршрут по твоим силам:</h3>
                                </div>
                                <div className="w-full">
                                    <TourCard tour={recommendedTour} />
                                </div>
                            </div>
                        )}

                        {/* SMART CTA ПОСЛЕ ИИ */}
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
                              className="flex-1 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
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