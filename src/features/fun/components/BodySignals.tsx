// src/features/fun/components/BodySignals.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Heart, Wind, Brain, Thermometer, Moon, Utensils,
  Sparkles, Loader2, ArrowLeft, Activity, X, ShieldAlert, Compass, HelpCircle, Check, ArrowRight
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
type SymptomKey = "knees" | "legs" | "headache" | "appetite" | "irritability" | "pace" | "sleep" | "cold" | "nausea";

const SYMPTOMS: { key: SymptomKey; label: string; icon: React.ReactNode; category: "physical" | "mental" | "comfort" }[] = [
  { key: "knees",       label: "Боль в коленях на спуске",        icon: <Activity size={18}/>, category: "physical" },
  { key: "legs",        label: "Тяжесть в ногах на подъёме",      icon: <Wind size={18}/>,     category: "physical" },
  { key: "headache",    label: "Головная боль на высоте",         icon: <Brain size={18}/>,    category: "physical" },
  { key: "appetite",    label: "Потеря аппетита",                 icon: <Utensils size={18}/>, category: "comfort"  },
  { key: "irritability",label: "Раздражительность к вечеру",      icon: <Heart size={18}/>,    category: "mental"   },
  { key: "pace",        label: "Не могу идти в темпе группы",     icon: <Wind size={18}/>,     category: "physical" },
  { key: "sleep",       label: "Плохой сон в палатке",            icon: <Moon size={18}/>,     category: "comfort"  },
  { key: "cold",        label: "Мёрзнут руки и ноги",             icon: <Thermometer size={18}/>, category: "comfort" },
  { key: "nausea",      label: "Тошнота от еды на маршруте",      icon: <Utensils size={18}/>, category: "comfort"  },
];

const SYMPTOM_INFO: Record<SymptomKey, { why: string; now: string; tomorrow: string; warning: boolean }> = {
  knees: { why: "На спуске нагрузка на колени возрастает в 3–4 раза. Квадрицепс работает как тормоз.", now: "Сократи длину шага. Используй трекинговые палки — они забирают до 25% нагрузки.", tomorrow: "Холод на колени 15 минут вечером. Лёгкая растяжка квадрицепса.", warning: false },
  legs: { why: "Накопленная молочная кислота и микроповреждения волокон. Рюкзак добавляет 15–30% к нагрузке.", now: "Замедлись до темпа, при котором можешь говорить. На привале походи 2–3 минуты.", tomorrow: "Растяжка икр перед сном. Подними ноги выше уровня тела на 15 минут.", warning: false },
  headache: { why: "Давление кислорода снижается, сосуды расширяются. Обезвоживание усиливает боль.", now: "Выпей 500 мл воды. Замедли темп. Глубокое дыхание помогает насытить кровь.", tomorrow: "Не набирай высоту, пока боль не пройдет. Правило: не более 300 м набора в день.", warning: true },
  appetite: { why: "Организм перенаправляет кровоток от желудка к мышцам.", now: "Не заставляй себя есть много. Перейди на частые мелкие перекусы (орехи, сладкое).", tomorrow: "Аппетит вернется. Пей больше — жажда часто маскируется под отсутствие голода.", warning: false },
  irritability: { why: "Усталость снижает глюкозу. Мозг в режиме экономии, на эмоции нет энергии.", now: "Признай это. Если хочешь сказать лишнее — помолчи. Съешь сладкое.", tomorrow: "Планируй привалы до усталости. Перекус каждые 1.5 часа стабилизирует настроение.", warning: false },
  pace: { why: "Разный уровень подготовки и ритм. Темп группы — всегда компромисс.", now: "Скажи гиду, что нужен темп медленнее — это нормальная просьба. Иди в своем ритме.", tomorrow: "Обсуди темп с гидом заранее. Короткие шаги в гору эффективнее длинных.", warning: false },
  sleep: { why: "Непривычные звуки, холод, высота. Первые ночи мозг в режиме бдительности.", now: "Не смотри в потолок — выйди на 5 минут, подыши. Надень шапку (холод — главная причина).", tomorrow: "Изоляция снизу важнее спальника. Поужинай нормально (голод мешает сну).", warning: false },
  cold: { why: "Кровоток уходит в крупные мышцы. На ветру или высоте это усиливается.", now: "Двигай пальцами активно. Проверь, не тугие ли манжеты — они перекрывают кровь.", tomorrow: "Надевай тонкие перчатки под основные. Мериносовая шерсть греет даже мокрой.", warning: false },
  nausea: { why: "Жара, высота, тяжелая еда. Нагрузка на пищеварительную систему.", now: "Ешь микро-порциями. Имбирные конфеты помогают. Пей воду маленькими глотками.", tomorrow: "Выбирай лёгкую углеводную еду (рис, хлеб). Избегай жирного. При рвоте — скажи гиду.", warning: true },
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
      // Локальное сохранение
      updateProfile({ bodySymptoms: selected });
      incrementFunTestPassAction('body-signals').catch(console.error);

      // Сохранение ИИ-лонгрида в базу данных
      if (object?.analysis) {
        saveResult('body-signals', {
          type: "Анализ симптомов",
          badge: "💪",
          description: "Медицинское резюме и подбор щадящего формата.",
          fullAnalysis: object.analysis,
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
    
    // Передаем данные в единый API
    submit({ 
      type: 'body-signals', 
      payload: { symptomsDetailed } 
    });
  };

  const getLoadingText = () => {
    if (loadingStep === 0) return "Изучаем твои симптомы...";
    if (loadingStep === 1 && selected.length > 0) {
        const firstSymptom = SYMPTOMS.find(s => s.key === selected[0]);
        return `Ищем причину: ${firstSymptom?.label.toLowerCase()}...`;
    }
    if (loadingStep === 2) return "Подбираем щадящие форматы отдыха...";
    return "Формируем медицинское резюме...";
  };

  if (!isOpen) return null;

  const grouped = {
    physical: SYMPTOMS.filter((s) => s.category === "physical"),
    mental: SYMPTOMS.filter((s) => s.category === "mental"),
    comfort: SYMPTOMS.filter((s) => s.category === "comfort"),
  };
  const categoryLabel: Record<string, string> = { physical: "Физические", mental: "Психологические", comfort: "Комфорт и сон" };

  const viewingInfo = viewing ? SYMPTOM_INFO[viewing] : null;
  const viewingSymptom = viewing ? SYMPTOMS.find((s) => s.key === viewing) : null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {/* Заменен max-h-[90vh] на max-h-[90dvh] */}
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} 
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]" onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} aria-label="Закрыть" className="absolute top-5 right-5 z-20 text-slate-300 hover:text-white transition-colors p-3 bg-white/5 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>

          {/* === 1. ВЫБОР СИМПТОМОВ === */}
          {step === "select" && (
            <motion.div key="select" className="flex flex-col h-full overflow-hidden p-6 md:p-10 pb-6">
              
              <div className="shrink-0 mb-6 pr-8">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-rose-500 text-xs font-bold tracking-widest uppercase">Что говорит тело</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3 tracking-tight">Что происходит<br /><span className="text-rose-400">с тобой в туре?</span></h2>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">Выбери симптомы, которые ты замечаешь — и получи объяснение, почему это происходит и что делать.</p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                {(Object.entries(grouped) as [string, typeof SYMPTOMS][]).map(([cat, symptoms]) => (
                  <div key={cat} className="mb-6 last:mb-0">
                    <div className="text-slate-300 text-[12px] font-bold tracking-widest uppercase mb-3">{categoryLabel[cat]}</div>
                    <div className="space-y-3">
                      {symptoms.map((s) => {
                        const isSel = selected.includes(s.key);
                        const hasWarning = SYMPTOM_INFO[s.key].warning;
                        return (
                          <div key={s.key} className="flex gap-3 items-stretch">
                             <button onClick={() => { setViewing(s.key); setStep("detail"); }} className={cn("w-14 rounded-2xl border flex flex-col items-center justify-center transition-all shrink-0 group", "bg-slate-800/50 border-white/5 hover:border-rose-500/30 text-slate-300 hover:bg-slate-800 hover:text-rose-400")} title="Узнать подробнее">
                                <HelpCircle size={22} className="transition-colors" />
                             </button>
                             <button onClick={() => toggleSymptom(s.key)} className={cn("flex-1 text-left px-5 py-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 group", isSel ? "border-rose-500/50 bg-rose-500/10 shadow-[0_0_15px_rgba(225,29,72,0.15)]" : "border-white/5 bg-slate-800/50 hover:bg-slate-800")}>
                                <div className="flex items-center gap-3">
                                   <div className={cn("text-rose-400 shrink-0", isSel ? "" : "opacity-70 group-hover:opacity-100 transition-opacity")}>{s.icon}</div>
                                   <div className={cn("text-[15px] md:text-base font-bold transition-colors leading-snug", isSel ? "text-white" : "text-slate-300 group-hover:text-white")}>{s.label}</div>
                                   {hasWarning && <ShieldAlert size={14} className="text-amber-500 shrink-0 ml-1" />}
                                </div>
                                <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all", isSel ? "bg-rose-500 border-rose-500" : "border-slate-600 group-hover:border-rose-500/50")}>
                                  {isSel && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                                </div>
                             </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="shrink-0 pt-4 border-t border-white/5 mt-2">
                 {selected.length > 0 ? (
                    <button onClick={() => setStep("summary")} className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] active:scale-[0.98]">
                      Разобрать симптомы ({selected.length})
                    </button>
                 ) : (
                    <div className="w-full bg-slate-800 text-slate-300 rounded-xl py-4 text-sm font-bold uppercase tracking-wider text-center cursor-not-allowed">
                       Выбери хотя бы один симптом
                    </div>
                 )}
              </div>
            </motion.div>
          )}

          {/* === 2. ДЕТАЛИ СИМПТОМА === */}
          {step === "detail" && viewingInfo && viewingSymptom && (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full overflow-hidden p-6 md:p-10 pb-6">
              <div className="shrink-0 mb-6">
                 <button onClick={() => setStep("select")} className="flex items-center gap-3 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors"><ArrowLeft size={16} /> Назад</button>
                 <h2 className="text-2xl md:text-3xl font-black text-white leading-tight flex items-center gap-3"><span className="text-rose-400">{viewingSymptom.icon}</span>{viewingSymptom.label}</h2>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                {viewingInfo.warning && (<div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-4 flex gap-3 items-start"><ShieldAlert className="text-amber-500 shrink-0" size={18}/><div><p className="text-amber-400 text-[12px] font-bold uppercase tracking-widest mb-1">Обрати внимание</p><p className="text-amber-200/80 text-sm font-medium">Этот симптом требует контроля. При нарастании — обязательно сообщи гиду.</p></div></div>)}
                <div className="border-l-2 border-slate-700 pl-5"><p className="text-slate-300 text-[12px] font-bold uppercase tracking-widest mb-2">Почему это происходит</p><p className="text-slate-300 text-sm font-medium leading-relaxed">{viewingInfo.why}</p></div>
                <div className="border-l-2 border-rose-500/50 pl-5 bg-rose-500/5 py-4 rounded-r-xl"><p className="text-rose-400 text-[12px] font-bold uppercase tracking-widest mb-2">Что делать сейчас</p><p className="text-white text-sm font-bold leading-relaxed">{viewingInfo.now}</p></div>
                <div className="border-l-2 border-teal-500/50 pl-5"><p className="text-teal-500 text-[12px] font-bold uppercase tracking-widest mb-2">Что изменить завтра</p><p className="text-slate-300 text-sm font-medium leading-relaxed">{viewingInfo.tomorrow}</p></div>
              </div>
              <div className="shrink-0 mt-6 pt-4 border-t border-white/10">
                <button onClick={() => { if (!selected.includes(viewingSymptom.key)) toggleSymptom(viewingSymptom.key); setStep("select"); }} className={cn("w-full rounded-xl py-4 text-sm font-bold uppercase tracking-wider transition-all", selected.includes(viewingSymptom.key) ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20")}>
                  {selected.includes(viewingSymptom.key) ? "Вернуться к списку" : "Добавить в мой список"}
                </button>
              </div>
            </motion.div>
          )}

          {/* === 3. БАЗОВОЕ САММАРИ === */}
          {step === "summary" && (
            <motion.div key="summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full overflow-hidden p-6 md:p-10 pb-6">
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
                <div className="shrink-0 mb-6">
                  <button onClick={() => setStep("select")} className="flex items-center gap-3 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft size={16} /> Назад
                  </button>
                  <h2 className="text-3xl font-black text-white tracking-tight">Твои симптомы</h2>
                </div>
                
                <div className="space-y-4">
                  {selected.map((key) => {
                    const s = SYMPTOMS.find((x) => x.key === key)!;
                    const info = SYMPTOM_INFO[key];
                    return (
                      <div key={key} className="border border-white/10 rounded-2xl p-5 bg-slate-800/30">
                        <div className="flex items-center gap-3 mb-3"><div className="text-rose-400">{s.icon}</div><span className="text-white font-bold">{s.label}</span>{info.warning && <ShieldAlert size={16} className="text-amber-500 ml-auto" />}</div>
                        <div className="bg-slate-900 rounded-xl p-4"><span className="text-teal-500 text-[12px] font-bold uppercase tracking-widest mb-1.5 block">Решение:</span><p className="text-slate-300 text-sm font-medium leading-relaxed">{info.now}</p></div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 border border-rose-500/30 bg-rose-500/10 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.15)_0%,transparent_70%)] pointer-events-none" />
                  <Sparkles className="w-10 h-10 text-rose-400 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">Глубокий разбор от AI-врача</h3>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    ИИ проанализирует эти симптомы в комплексе и <strong className="text-white">подберет безопасный тур</strong>, где твоему телу будет комфортно.
                  </p>
                  <button onClick={handleGetAiMagic} disabled={isLoading} className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)] active:scale-95 relative z-10 disabled:opacity-70">
                    <Sparkles size={16} /> Получить разбор
                  </button>
                </div>

                {/* SMART CTA ПОСЛЕ ИИ (Саммари этап) */}
                <div className="pt-6 mt-6 border-t border-white/10 text-center">
                  <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest mb-3">Или переходи к выбору</p>
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
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 mb-4 shadow-[0_0_30px_rgba(225,29,72,0.2)]">
                            <Activity className="w-8 h-8 text-rose-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Резюме врача</h2>
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
                             <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
                             <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">{getLoadingText()}</span>
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
                                    <Compass className="text-rose-400" size={20} />
                                    <h3 className="text-lg font-black text-white uppercase tracking-wide">Безопасный старт для тебя:</h3>
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
                              className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Compass size={14} /> Изучить направления
                            </Link>
                            <Link
                              href="/tour"
                              onClick={onClose}
                              className="flex-1 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20"
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