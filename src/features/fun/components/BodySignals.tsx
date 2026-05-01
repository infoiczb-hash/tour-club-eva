// src/features/fun/components/BodySignals.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart, Wind, Brain, Thermometer, Moon, Utensils,
  Sparkles, Loader2, ArrowLeft, Activity, X, ShieldAlert, Compass, HelpCircle, Check, ArrowRight
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import TourCard from "@/features/tours/components/TourCard";
import { TourPreview } from "@/features/tours/types";
import { useProfile } from "@/hooks/useProfile"; 
import { incrementFunTestPassAction } from "@/features/admin/actions/fun";
import { getToursForQuizAction } from "@/features/fun/actions"; 
import { useSaveTest } from "@/hooks/useSaveTest";
import { useModalTransition } from "@/hooks/useModalTransition";

// === VERCEL AI SDK ===
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ─── ДАННЫЕ ──────────────────────────────────────────────────────────────────
type SymptomKey = "knees" | "legs" | "headache" | "appetite" | "irritability" | "pace" | "sleep" | "cold";

const SYMPTOMS: { key: SymptomKey; label: string; sublabel: string; icon: React.ReactNode }[] = [
  { key: "knees", label: "Ноют колени на спусках", sublabel: "Особенно в конце дня или под тяжелым рюкзаком", icon: <Activity size={18} /> },
  { key: "legs", label: "Тяжесть и забитость в икрах", sublabel: "Ноги как свинцовые на следующий день", icon: <Activity size={18} /> },
  { key: "headache", label: "Пульсирующая головная боль", sublabel: "Чаще на высоте или к вечеру", icon: <Brain size={18} /> },
  { key: "appetite", label: "Пропадает аппетит", sublabel: "Надо есть, а еда просто не лезет", icon: <Utensils size={18} /> },
  { key: "irritability", label: "Внезапная раздражительность", sublabel: "Бесит всё: гид, попутчики, погода", icon: <ShieldAlert size={18} /> },
  { key: "pace", label: "Резко падает темп, одышка", sublabel: "Сердце колотится, не хватает воздуха", icon: <Heart size={18} /> },
  { key: "sleep", label: "Поверхностный, тревожный сон", sublabel: "Просыпаешься уставшим даже после 8 часов", icon: <Moon size={18} /> },
  { key: "cold", label: "Невозможно согреться", sublabel: "Мерзнешь даже в хорошем спальнике", icon: <Thermometer size={18} /> },
];

const SYMPTOM_INFO: Record<SymptomKey, { honest: string; reality: string; solution: string }> = {
  knees: { 
    honest: "Колени принимают на себя тройной вес твоего тела при каждом шаге вниз. Это чистая физика, а не твоя 'слабость'.", 
    reality: "Большинство проблем с коленями решаются до похода, а не мазями в процессе.", 
    solution: "Обязательно: треккинговые палки (снимают 30% нагрузки), правильная шнуровка ботинок на спуске и бандаж-суппорт." 
  },
  legs: { 
    honest: "Мышцы не успевают выводить молочную кислоту. Им не хватает кислорода и микроэлементов.", 
    reality: "Забитые мышцы — норма на 2-й день. Главное не дать им перейти в стадию судорог.", 
    solution: "Пей изотоник (магний/калий) на маршруте. Вечером — растяжка и МФР-массаж валиком или бутылкой." 
  },
  headache: { 
    honest: "Голова болит либо от обезвоживания, либо от горняшки (даже легкой), либо от солнца.", 
    reality: "Туристы часто путают 'я устал' с 'я обезвожен'. В горах вода испаряется быстрее, чем ты чувствуешь жажду.", 
    solution: "Пей каждые 40 минут. Носи панаму. Если высота выше 2500м — это адаптация, снизь темп и скажи гиду." 
  },
  appetite: { 
    honest: "Тело находится в стрессе и блокирует ЖКТ, чтобы пустить всю энергию в мышцы.", 
    reality: "Не поешь — завтра не сможешь идти. Это замкнутый круг потери энергии.", 
    solution: "Ешь жидкую или теплую пищу (суп, бульон). Если совсем не лезет — сладкий чай и углеводные гели." 
  },
  irritability: { 
    honest: "Это не у тебя плохой характер. Это падение уровня глюкозы в крови (гипогликемия).", 
    reality: "Если тебя внезапно начал бесить цвет рюкзака товарища — ты просто голоден.", 
    solution: "Срочно съешь быстрый углевод: сникерс, кусок сахара, конфету. Отпустит через 5 минут." 
  },
  pace: { 
    honest: "Ты взял темп, который твои легкие не могут обеспечить кислородом. Ты 'загоняешь' мотор.", 
    reality: "Группа не будет тебя осуждать за медленный шаг. Она будет осуждать, если ты скроешь это и упадешь в обморок.", 
    solution: "Перейди на 'шаг гида': один шаг — один вдох. Не разговаривай на подъеме. Дыши животом." 
  },
  sleep: { 
    honest: "Высота, непривычная среда и перевозбуждение нервной системы не дают мозгу уйти в глубокую фазу.", 
    reality: "Спать в палатке — навык, который тренируется. На первой ночевке плохо спят 80% людей.", 
    solution: "Проветри палатку перед сном. Надень сухие носки. Выпей магний или ромашковый чай. Используй беруши." 
  },
  cold: { 
    honest: "Холод идет не снаружи, а изнутри. Твоему телу не хватает топлива (калорий), чтобы топить 'печку'.", 
    reality: "Можно надеть три пуховки, но если ты голоден — ты не согреешься.", 
    solution: "Перед сном — горячий жирный ужин или чай с сахаром. Положи бутылку с горячей водой (грелку) в ноги спальника." 
  },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BodySignalsModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<"select" | "detail" | "summary" | "ai_result">("select");
  const [selected, setSelected] = useState<SymptomKey[]>([]);
  const [viewing, setViewing] = useState<SymptomKey | null>(null);
  
  const { updateProfile } = useProfile();
  const { saveResult } = useSaveTest();
  
  const [allTours, setAllTours] = useState<TourPreview[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  const { shouldRender, closing } = useModalTransition(isOpen, 200);

  // === ОФИЦИАЛЬНЫЙ ХУК VERCEL AI SDK ===
  const { object, submit, isLoading, error } = useObject({
    api: '/api/fun/analyze',
    schema: z.object({
      analysis: z.string().describe('Анализ симптомов'),
      recommendedTourId: z.string().nullable().describe('ID подходящего тура')
    }),
    onFinish: ({ object }) => {
      updateProfile({ bodySignals: selected }); 
      incrementFunTestPassAction('body-signals').catch(console.error);

      if (object?.analysis) {
        saveResult('body-signals', {
          type: "Сигналы тела",
          badge: "🩺",
          description: "Анализ физических барьеров и план подготовки.",
          fullAnalysis: object.analysis,
        });
      }
    }
  });

  const aiAnalysis = object?.analysis || "";
  const recommendedTour = object?.recommendedTourId && allTours.length > 0
    ? allTours.find(t => t.id === object.recommendedTourId)
    : null;

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

  const toggleSymptom = (key: SymptomKey) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleGetAiMagic = async () => {
    if (isLoading || selected.length === 0) return;

    setStep("ai_result");

    if (allTours.length === 0) {
      const tours = await getToursForQuizAction();
      setAllTours(tours);
    }

    const symptomsDetailed = selected.map(k => SYMPTOMS.find(s => s.key === k)?.label || k);
    
    submit({ 
      type: 'bodySignals', 
      payload: { symptomsDetailed } 
    });
  };
  
  const getLoadingText = () => {
    if (loadingStep === 0) return "Сканируем твои ответы...";
    if (loadingStep === 1 && selected.length > 0) {
        const firstSymp = SYMPTOMS.find(s => s.key === selected[0]);
        return `Анализируем: ${firstSymp?.label.toLowerCase()}...`;
    }
    if (loadingStep === 2) return "Подбираем план адаптации...";
    return "Формируем персональный разбор...";
  };

  if (!shouldRender) return null;

  const viewingInfo = viewing ? SYMPTOM_INFO[viewing] : null;
  const viewingSymp = viewing ? SYMPTOMS.find((s) => s.key === viewing) : null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl px-4 transition-opacity duration-200 ease-out",
        closing ? "opacity-0" : "opacity-100"
      )} 
      onClick={onClose}
    >
      <div 
        className={cn(
          "relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] transition-all duration-200 ease-out",
          closing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        )} 
        onClick={(e) => e.stopPropagation()}
      >
        
        <button onClick={onClose} aria-label="Закрыть" className="absolute top-5 right-5 text-slate-300 hover:text-white transition-colors z-20 p-3 bg-white/5 hover:bg-white/10 rounded-full">
          <X size={20} />
        </button>

        {/* === 1. ВЫБОР СИМПТОМОВ === */}
        {step === "select" && (
          <div key="select" className="flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="shrink-0 mb-6 pr-8">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-4 h-4 text-rose-400" />
                <span className="text-rose-400 text-sm font-bold tracking-widest uppercase">Сигналы тела</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3 tracking-tight">
                Что обычно <span className="text-rose-400">сбоит?</span>
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed font-medium">Выбери состояния, с которыми ты сталкивался в походах или долгой физической активности. Мы расскажем как их обойти.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 space-y-3">
              {SYMPTOMS.map((symp) => {
                const isSel = selected.includes(symp.key);
                return (
                  <div key={symp.key} className="flex gap-3 items-stretch">
                     <button onClick={() => { setViewing(symp.key); setStep("detail"); }} className={cn("w-14 rounded-2xl border flex flex-col items-center justify-center transition-all shrink-0 group hover:scale-[1.02] active:scale-95", "bg-slate-800/50 border-white/5 hover:border-rose-500/30 text-slate-300 hover:bg-slate-800 hover:text-rose-400")} title="Читать подробнее">
                        <HelpCircle size={22} className="transition-colors" />
                     </button>
                     <button onClick={() => toggleSymptom(symp.key)} className={cn("flex-1 text-left px-5 py-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 group hover:scale-[1.01] active:scale-[0.98]", isSel ? "border-rose-500/50 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.15)]" : "border-white/5 bg-slate-800/50 hover:bg-slate-800")}>
                        <div className="flex items-center gap-4">
                           <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border transition-colors shrink-0", isSel ? "bg-rose-500/20 border-rose-500/30 text-rose-400" : "bg-slate-900 border-white/5 text-slate-400 group-hover:text-slate-200")}>
                              {symp.icon}
                           </div>
                           <div>
                              <div className={cn("text-[15px] md:text-base font-bold transition-colors leading-snug", isSel ? "text-white" : "text-slate-300 group-hover:text-white")}>{symp.label}</div>
                              <div className="text-slate-300 text-xs md:text-sm font-medium mt-1 leading-snug">{symp.sublabel}</div>
                           </div>
                        </div>
                        <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all", isSel ? "bg-rose-500 border-rose-500" : "border-slate-600 group-hover:border-rose-500/50")}>
                          {isSel && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                        </div>
                     </button>
                  </div>
                );
              })}
            </div>

            <div className="shrink-0 pt-4 border-t border-white/5 mt-2">
               {selected.length > 0 ? (
                  <button onClick={() => setStep("summary")} className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-lg shadow-rose-600/20 active:scale-[0.98]">
                    Узнать диагноз ({selected.length})
                  </button>
               ) : (
                  <div className="w-full bg-slate-800 text-slate-300 rounded-xl py-4 text-sm font-bold uppercase tracking-wider text-center cursor-not-allowed">
                     Выбери хотя бы один симптом
                  </div>
               )}
            </div>
          </div>
        )}

        {/* === 2. ДЕТАЛИ СИМПТОМА === */}
        {step === "detail" && viewingInfo && viewingSymp && (
          <div key="detail" className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="shrink-0 mb-6">
               <button onClick={() => setStep("select")} className="flex items-center gap-3 text-slate-300 hover:text-white text-sm font-bold uppercase tracking-widest mb-6 transition-colors"><ArrowLeft size={16} /> Назад</button>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                     {viewingSymp.icon}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{viewingSymp.label}</h2>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              <div className="border-l-2 border-slate-700 pl-5"><p className="text-slate-300 text-[12px] font-bold uppercase tracking-widest mb-2">Почему это происходит</p><p className="text-slate-300 text-sm leading-relaxed font-medium">{viewingInfo.honest}</p></div>
              <div className="border-l-2 border-rose-500/50 pl-5 bg-rose-500/5 py-4 rounded-r-xl"><p className="text-rose-400 text-[12px] font-bold uppercase tracking-widest mb-2">Суровая реальность</p><p className="text-slate-300 text-sm leading-relaxed font-medium">{viewingInfo.reality}</p></div>
              <div className="border-l-2 border-emerald-500/80 pl-5"><p className="text-emerald-500 text-[12px] font-bold uppercase tracking-widest mb-2">Решение</p><p className="text-white text-sm leading-relaxed font-bold">{viewingInfo.solution}</p></div>
            </div>
            <div className="shrink-0 mt-6 pt-4 border-t border-white/10">
              <button onClick={() => { if (!selected.includes(viewingSymp.key)) toggleSymptom(viewingSymp.key); setStep("select"); }} className={cn("w-full rounded-xl py-4 text-sm font-bold uppercase tracking-wider transition-all active:scale-95", selected.includes(viewingSymp.key) ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20")}>
                {selected.includes(viewingSymp.key) ? "Вернуться к списку" : "Добавить к моим симптомам"}
              </button>
            </div>
          </div>
        )}

        {/* === 3. БАЗОВОЕ САММАРИ === */}
        {step === "summary" && (
          <div key="summary" className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
              <div className="shrink-0 mb-6">
                <button onClick={() => setStep("select")} className="flex items-center gap-3 text-slate-300 hover:text-white text-sm font-bold uppercase tracking-widest mb-6 transition-colors">
                  <ArrowLeft size={16} /> Назад
                </button>
                <h2 className="text-3xl font-black text-white tracking-tight">Твоя карта тела</h2>
              </div>
              
              <div className="space-y-4">
                {selected.map((key) => {
                  const s = SYMPTOMS.find((x) => x.key === key)!;
                  const info = SYMPTOM_INFO[key];
                  return (
                    <div key={key} className="border border-white/10 rounded-2xl p-5 bg-slate-800/30">
                      <p className="text-white text-base font-bold mb-3 flex items-center gap-3"><Check className="text-rose-500" size={16}/> {s.label}</p>
                      <div className="bg-slate-900 rounded-xl p-4"><p className="text-emerald-500 text-[12px] font-bold uppercase tracking-widest mb-1.5">Профилактика</p><p className="text-slate-300 text-sm leading-relaxed font-medium">{info.solution}</p></div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border border-rose-500/30 bg-rose-500/10 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.15)_0%,transparent_70%)] pointer-events-none" />
                <Sparkles className="w-10 h-10 text-rose-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white mb-2">Глубокий анализ от AI</h3>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  ИИ проанализирует связку твоих симптомов, даст советы по тренировкам и <strong className="text-white">подберет 1 идеальный тур без стресса для организма</strong>.
                </p>
                <button onClick={handleGetAiMagic} disabled={isLoading} className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95 relative z-10 disabled:opacity-70">
                  <Sparkles size={16} /> Начать анализ
                </button>
              </div>

              {/* SMART CTA */}
              <div className="pt-6 mt-6 border-t border-white/10 text-center">
                <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest mb-3">Или переходи к выбору</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/directions"
                    onClick={onClose}
                    className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Compass size={16} /> Все направления
                  </Link>
                  <Link
                    href="/tour"
                    onClick={onClose}
                    className="flex-1 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                  >
                    Смотреть туры <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* === 4. МАГИЯ AI === */}
        {step === "ai_result" && (
          <div key="ai_result" className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                <div className="text-center mb-8 border-b border-white/10 pb-6 pt-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 mb-4 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                        <Activity className="w-8 h-8 text-rose-400" />
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
                         <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
                         <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">{getLoadingText()}</span>
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
                                <Compass className="text-emerald-400" size={20} />
                                <h3 className="text-lg font-black text-white uppercase tracking-wide">Твой идеальный старт:</h3>
                            </div>
                            <div className="w-full">
                                <TourCard tour={recommendedTour} />
                            </div>
                        </div>
                    )}

                    {/* SMART CTA ПОСЛЕ ИИ */}
                    <div className="pt-8 mt-6 border-t border-white/10 text-center animate-in fade-in duration-500">
                      <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest mb-3">Продолжить</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                          href="/directions"
                          onClick={onClose}
                          className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Compass size={14} /> Изучить направления
                        </Link>
                        <Link
                          href="/tour"
                          onClick={onClose}
                          className="flex-1 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 active:scale-95"
                        >
                          Расписание туров <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>

                  </>
                )}
              </div>
          </div>
        )}

      </div>
    </div>
  );
}