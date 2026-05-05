// src/features/fun/components/TourDebrief.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen, ChevronRight, ArrowLeft,
  Sparkles, Loader2, X, Compass, CheckCircle2, ArrowRight
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
type BlockKey = "body" | "mind" | "group";

const QUESTIONS = [
  { id: 1, block: "body" as BlockKey, text: "Что далось физически легче, чем ты ожидал?", placeholder: "Например: подъёмы, тяжёлый рюкзак, темп группы..." },
  { id: 2, block: "body" as BlockKey, text: "Что оказалось неожиданно тяжёлым для тела?", placeholder: "Например: спуски, холод, недосыпание..." },
  { id: 3, block: "body" as BlockKey, text: "Был ли момент, когда ты думал, что не сможешь продолжать? Что произошло дальше?", placeholder: "Что случилось в этот момент и как ты через него прошёл..." },
  { id: 4, block: "mind" as BlockKey, text: "Самый неожиданный момент похода — что тебя застало врасплох?", placeholder: "Вид, разговор, собственная реакция на что-то..." },
  { id: 5, block: "mind" as BlockKey, text: "О чём ты думал на длинных подъёмах или в тишине?", placeholder: "Что всплывало в голове, когда тело работало, а ум был свободен..." },
  { id: 6, block: "mind" as BlockKey, text: "Что изменилось в твоём взгляде на что-то к концу маршрута?", placeholder: "Про себя, про жизнь, про приоритеты, про других людей..." },
  { id: 7, block: "group" as BlockKey, text: "Кто из группы тебя удивил — и чем?", placeholder: "Что ты не ожидал увидеть в этом человеке..." },
  { id: 8, block: "group" as BlockKey, text: "Был ли момент напряжения в группе? Как ты себя в нём повёл?", placeholder: "Или если напряжения не было — что, на твой взгляд, этому способствовало..." },
  { id: 9, block: "group" as BlockKey, text: "Что ты дал этой группе и что взял от неё?", placeholder: "Что ты принёс в группу и что унёс с собой..." },
];

const BLOCK_META: Record<BlockKey, { label: string; color: string; border: string; bg: string }> = {
  body:  { label: "Тело",   color: "text-amber-500", border: "border-amber-500", bg: "bg-amber-500/10" },
  mind:  { label: "Голова", color: "text-violet-400", border: "border-violet-400", bg: "bg-violet-500/10" },
  group: { label: "Группа", color: "text-teal-400", border: "border-teal-400", bg: "bg-teal-500/10" },
};

// ─── КОМПОНЕНТ ───────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function TourDebriefModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<"intro" | "test" | "result" | "ai_result">("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const { updateProfile } = useProfile(); 
  const { saveResult } = useSaveTest();
  
  const [allTours, setAllTours] = useState<TourPreview[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  const { shouldRender, closing } = useModalTransition(isOpen, 200);

  // === ОФИЦИАЛЬНЫЙ ХУК VERCEL AI SDK ===
  const { object, submit, isLoading, error } = useObject({
    api: '/api/fun/analyze',
    schema: z.object({
      analysis: z.string().describe('Развернутый ответ ИИ.'),
      recommendedTourId: z.string().nullable().describe('ID подходящего тура из списка.')
    }),
    onFinish: ({ object }) => {
      // Локальное сохранение
      updateProfile({ touristType: "Рефлексирующий" }); 
      incrementFunTestPassAction('debrief').catch(console.error);

      // Сохранение ИИ-лонгрида в базу данных
      if (object?.analysis) {
        saveResult('debrief', {
          type: "Инсайты похода",
          badge: "📖",
          description: "Анализ твоего опыта и психологических открытий в туре.",
          fullAnalysis: object.analysis,
        });
      }
    }
  });

  // Производные данные из стрим-объекта
  const aiAnalysis = object?.analysis || "";
  const recommendedTour = object?.recommendedTourId && allTours.length > 0
    ? allTours.find(t => t.id === object.recommendedTourId)
    : null;

  // Лоадер показываем только пока ИИ "думает" (до первого символа)
  const isThinking = isLoading && !object?.analysis;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStep("intro");
      setCurrent(0);
      setAnswers({});
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isThinking) { setLoadingStep(0); return; }
    const interval = setInterval(() => setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev)), 2000);
    return () => clearInterval(interval);
  }, [isThinking]);

  const q = QUESTIONS[current];
  const progress = (current / QUESTIONS.length) * 100;
  const answeredCount = Object.values(answers).filter(a => a.trim().length > 0).length;

  const handleNext = () => {
    if (current + 1 >= QUESTIONS.length) setStep("result");
    else setCurrent(c => c + 1);
  };

  const handleGetAiMagic = async () => {
    if (isLoading || answeredCount === 0) return;

    setStep("ai_result");

    if (allTours.length === 0) {
      const TourPreview = await getToursForQuizAction();
      setAllTours(TourPreview);
    }

    const answersText = QUESTIONS.map((q) => {
      const ans = answers[q.id]?.trim();
      return ans ? `[Сфера: ${BLOCK_META[q.block].label}] Вопрос: ${q.text}\nОтвет: ${ans}` : null;
    }).filter(Boolean).join("\n\n");

    // Отправляем данные в единый шлюз
    submit({
      type: 'debrief',
      payload: { answersText }
    });
  };
  
  const getLoadingText = () => {
    if (loadingStep === 0) return "Считываем скрытые смыслы...";
    if (loadingStep === 1) return "Формируем психологический инсайт...";
    return "Ищем тур для следующего уровня...";
  };

  if (!shouldRender) return null;
  const blockMeta = BLOCK_META[q?.block];

  // Парсинг Markdown от Gemini
  const parseGeminiText = (text: string) => {
    return text.split(/\*\*(.+?)\*\*/g).map((part, i) => {
      if (i % 2 === 1) return <span key={i} className="font-bold text-white">{part}</span>;
      return <span key={i}>{part}</span>;
    });
  };

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
          "relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] transition-all duration-200 ease-out",
          closing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        )} 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Закрыть" className="absolute top-5 right-5 z-20 text-slate-300 hover:text-white transition-colors p-3 bg-white/5 hover:bg-white/10 rounded-full">
          <X size={20} />
        </button>

        {/* === 1. INTRO === */}
        {step === "intro" && (
          <div key="intro" className="p-6 md:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-8 pr-12 shrink-0">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-violet-400 tracking-[0.2em] uppercase">Разбор тура</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4 tracking-tight pr-8 shrink-0">
              Что открыл<br /><span className="text-violet-400">этот поход?</span>
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8 font-medium shrink-0">
              Структурированная рефлексия опыта. 9 вопросов — про тело, голову и группу. Отвечай честно. В конце AI-консультант составит твой персональный психологический разбор.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10 shrink-0">
              {(Object.entries(BLOCK_META) as [BlockKey, typeof BLOCK_META[BlockKey]][]).map(([key, meta]) => (
                <div key={key} className={cn("flex-1 border border-white/5 rounded-xl p-3 text-center", meta.bg)}>
                  <div className={cn("text-xs font-bold uppercase tracking-widest mb-1", meta.color)}>{meta.label}</div>
                  <div className="text-slate-300 text-[12px] font-medium">3 вопроса</div>
                </div>
              ))}
            </div>

            <div className="shrink-0 mt-auto">
              <button onClick={() => setStep("test")} className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] active:scale-95">
                Начать рефлексию <ChevronRight size={18} />
              </button>
              <p className="text-slate-300 text-[11px] text-center mt-4">
                Пропускать вопросы можно — отвечай только там, где есть что сказать.
              </p>
            </div>
          </div>
        )}

        {/* === 2. TEST === */}
        {step === "test" && q && (
          <div key={`q-${current}`} className="p-6 md:p-10 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-8 pr-12 shrink-0">
               <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest mb-3">
                  <span className={cn("px-3 py-1 rounded-full border", blockMeta.bg, blockMeta.border, blockMeta.color)}>
                      {blockMeta.label}
                  </span>
                  <span className="text-slate-300">{current + 1} / {QUESTIONS.length}</span>
               </div>
               <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-300", blockMeta.bg.replace('/10', ''))} style={{ width: `${progress}%` }} />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 flex flex-col">
                <h2 className="text-xl md:text-3xl font-black text-white leading-tight mb-8 tracking-tight">{q.text}</h2>

                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder={q.placeholder}
                  className="w-full flex-1 bg-slate-950 border border-slate-800 focus:border-violet-500/50 rounded-2xl px-5 py-4 text-white text-sm leading-relaxed resize-none transition-colors outline-none mb-2 placeholder:text-slate-600"
                />
            </div>

            <div className="shrink-0 pt-4 border-t border-transparent flex gap-3 h-16">
              <button onClick={handleNext} disabled={!answers[q.id]?.trim() && current < QUESTIONS.length - 1} className="flex-1 bg-white text-slate-950 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.98]">
                {current + 1 === QUESTIONS.length ? "Завершить" : "Далее"} <ChevronRight size={16} />
              </button>
              {!answers[q.id]?.trim() && (
                <button onClick={handleNext} className="border border-white/10 text-slate-300 hover:text-white rounded-xl px-6 text-sm font-bold uppercase tracking-wider transition-colors active:scale-95">
                  Пропуск
                </button>
              )}
            </div>
          </div>
        )}

        {/* === 3. BASE RESULT (Саммари перед ИИ) === */}
        {step === "result" && (
          <div key="result" className="flex flex-col h-full overflow-hidden p-6 md:p-10 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className="shrink-0 mb-6">
               <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 w-fit mb-6">
                 <CheckCircle2 size={14} />
                 <span className="text-xs font-bold uppercase tracking-widest">Рефлексия собрана</span>
               </div>
               <h2 className="text-3xl font-black text-white tracking-tight pr-8">
                 Отвечено на {answeredCount} из {QUESTIONS.length}
               </h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2 space-y-4">
              {answeredCount === 0 ? (
                 <div className="border border-slate-700 bg-slate-800/30 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden h-full flex flex-col justify-center">
                   <h3 className="text-xl font-black text-white mb-2">Тишина — тоже ответ</h3>
                   <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                     Похоже, тебе пока не хочется делиться мыслями. И это абсолютно нормально! Иногда лучший инсайт — это просто побыть в тишине после похода.
                   </p>
                   <div className="flex flex-col gap-3 relative z-10 w-full max-w-sm mx-auto">
                     <Link href="/tour" onClick={onClose} className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 active:scale-95">
                       <Compass size={16} /> Выбрать новый тур
                     </Link>
                     <button onClick={() => { setStep("intro"); setCurrent(0); setAnswers({}); }} className="w-full bg-white/5 hover:bg-white/10 text-white rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider transition-colors active:scale-95">
                       Начать заново
                     </button>
                   </div>
                 </div>
              ) : (
                <>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                    Твои ответы зафиксированы. Прочитай их еще раз или отправь ИИ-психологу для глубокого анализа.
                  </p>
                  <div className="space-y-4">
                    {QUESTIONS.filter((q) => answers[q.id]?.trim()).map((q) => (
                      <div key={q.id} className="bg-slate-800/30 border border-white/5 rounded-2xl p-5">
                        <div className={cn("text-[12px] font-bold uppercase tracking-widest mb-2", BLOCK_META[q.block].color)}>
                          {BLOCK_META[q.block].label}
                        </div>
                        <p className="text-slate-300 text-xs mb-2 font-medium">{q.text}</p>
                        <p className="text-white text-sm leading-relaxed italic border-l-2 border-slate-600 pl-3">
                          «{answers[q.id]}»
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border border-violet-500/30 bg-violet-500/10 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] pointer-events-none" />
                    <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-white mb-2">Разбор и Следующий Шаг</h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                      ИИ проанализирует твои ответы, выделит скрытые смыслы и <strong className="text-white">подберет идеальный тур</strong> для следующего приключения на основе твоих инсайтов.
                    </p>
                    <button onClick={handleGetAiMagic} disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-95 relative z-10 disabled:opacity-70">
                      <Sparkles size={16} /> Синтезировать опыт
                    </button>
                  </div>

                  {/* Смарт CTA для тех, кто не хочет ждать ИИ */}
                  <div className="pt-6 mt-6 border-t border-white/10 text-center">
                    <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest mb-3">Или переходи к выбору</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href="/directions"
                        onClick={onClose}
                        className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Compass size={16} /> Изучить направления
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
                </>
              )}
            </div>
          </div>
        )}

        {/* === 4. МАГИЯ AI === */}
        {step === "ai_result" && (
          <div key="ai_result" className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-4">
                <div className="text-center mb-8 border-b border-white/10 pb-6 pt-4 pr-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 mb-4 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
                        <BookOpen className="w-8 h-8 text-violet-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Твой инсайт</h2>
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
                         <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                         <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">{getLoadingText()}</span>
                     </div>
                  </div>
                ) : error ? (
                  <div className="text-rose-400 text-center font-medium">Произошла ошибка: {error.message}</div>
                ) : (
                  <>
                    {/* ТЕКСТ ПОЯВЛЯЕТСЯ БУКВА ЗА БУКВОЙ */}
                    <div className="prose prose-sm prose-invert max-w-none text-slate-300 leading-relaxed font-medium mb-10 text-justify">
                        {aiAnalysis.split('\n').map((paragraph: string, idx: number) => (
                            <p key={idx} className="mb-4">{parseGeminiText(paragraph)}</p>
                        ))}
                    </div>

                    {/* КАРТОЧКА ТУРА ПОЯВИТСЯ, КАК ТОЛЬКО ИИ ПРИШЛЕТ ID */}
                    {recommendedTour ? (
                        <div className="mt-4 pt-8 border-t border-white/10 animate-in fade-in duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <Compass className="text-violet-400" size={24} />
                                <div>
                                  <h3 className="text-lg font-black text-white uppercase tracking-wide leading-none">Твой следующий уровень</h3>
                                  <p className="text-xs text-slate-300 mt-1">Тур, который идеально подойдет для закрепления опыта</p>
                                </div>
                            </div>
                            <div className="w-full">
                                <TourCard tour={recommendedTour} />
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl text-center border border-white/5">
                            <p className="text-slate-300 text-sm mb-4">На основе рефлексии мы не нашли 100% совпадения в базе, но ты всегда можешь выбрать тур самостоятельно в каталоге.</p>
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
                          className="flex-1 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 active:scale-95"
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