// src/features/fun/components/QuizTotem.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  X, ArrowRight, Sparkles, Moon, Sun, Cloud, Wind, Crown,
  Trees, Mountain, Waves, MoonStar, Zap, Footprints, 
  Telescope, ShieldCheck, PartyPopper, GraduationCap,
  Flame, Globe, Droplets, Compass, Activity, Utensils,
  LucideIcon
} from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "@/hooks/useProfile";
import { incrementFunTestPassAction } from "@/features/admin/actions/fun";
import { useSaveTest } from "@/hooks/useSaveTest";
import { useModalTransition } from "@/hooks/useModalTransition";

/* =======================
   ТИПЫ
======================= */
type Option = {
  id: string;
  icon: LucideIcon;
  label: string;
  score: { wolf: number; bear: number; eagle: number; fox: number };
};

type Result = {
  id: string;
  icon: LucideIcon;
  colorClass: string;
  glowClass: string;
  buttonClass: string;
  animal: string;
  title: string;
  description: string;
  power: string;
  directionSlug: string;
  directionName: string;
};

/* =======================
   ВОПРОСЫ
======================= */
const questions = [
  {
    id: 1,
    question: "Где ты чувствуешь силу?",
    options: [
      { id: "A", icon: Trees, label: "Густой лес", score: { bear: 2, wolf: 1, eagle: 0, fox: 1 } },
      { id: "B", icon: Mountain, label: "Вершина скалы", score: { eagle: 3, wolf: 1, bear: 0, fox: 0 } },
      { id: "C", icon: Waves, label: "Бурная река", score: { fox: 2, bear: 1, wolf: 0, eagle: 0 } },
      { id: "D", icon: MoonStar, label: "Ночная тишина", score: { wolf: 3, eagle: 1, bear: 0, fox: 1 } },
    ],
  },
  {
    id: 2,
    question: "Твой стиль движения?",
    options: [
      { id: "A", icon: Zap, label: "Быстрый рывок", score: { fox: 2, wolf: 1, eagle: 1, bear: 0 } },
      { id: "B", icon: Footprints, label: "Мощный шаг", score: { bear: 3, wolf: 0, eagle: 0, fox: 0 } },
      { id: "C", icon: Telescope, label: "Полёт и обзор", score: { eagle: 3, fox: 0, wolf: 0, bear: 0 } },
      { id: "D", icon: Activity, label: "Выносливый бег", score: { wolf: 3, fox: 1, bear: 1, eagle: 0 } },
    ],
  },
  {
    id: 3,
    question: "Что важнее в стае?",
    options: [
      { id: "A", icon: ShieldCheck, label: "Защита своих", score: { wolf: 3, bear: 2, eagle: 0, fox: 0 } },
      { id: "B", icon: PartyPopper, label: "Веселье и игра", score: { fox: 3, eagle: 0, wolf: 0, bear: 1 } },
      { id: "C", icon: GraduationCap, label: "Мудрость", score: { eagle: 2, bear: 2, wolf: 1, fox: 0 } },
      { id: "D", icon: Utensils, label: "Сытный ужин", score: { bear: 3, fox: 1, wolf: 1, eagle: 0 } },
    ],
  },
  {
    id: 4,
    question: "Выбери стихию",
    options: [
      { id: "A", icon: Wind, label: "Ветер", score: { eagle: 3, wolf: 1, fox: 0, bear: 0 } },
      { id: "B", icon: Flame, label: "Огонь", score: { wolf: 2, fox: 2, bear: 0, eagle: 0 } },
      { id: "C", icon: Globe, label: "Земля", score: { bear: 3, wolf: 1, fox: 0, eagle: 0 } },
      { id: "D", icon: Droplets, label: "Вода", score: { fox: 3, bear: 1, wolf: 0, eagle: 0 } },
    ],
  },
];

/* =======================
   РЕЗУЛЬТАТЫ (ТОТЕМЫ)
======================= */
const results: Record<string, Result> = {
  wolf: {
    id: "wolf",
    icon: Moon,
    colorClass: "text-indigo-400",
    glowClass: "bg-indigo-500/20",
    buttonClass: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30",
    animal: "ВОЛК",
    title: "ВОЖАК СТАИ",
    description: "Ты вынослив, верен своим и невероятно силен духом. Твоя стихия — командная работа и совместное преодоление препятствий.",
    power: "Неиссякаемая энергия",
    directionSlug: "kayaking",
    directionName: "Сплавы на байдарках",
  },
  bear: {
    id: "bear",
    icon: ShieldCheck,
    colorClass: "text-amber-500",
    glowClass: "bg-amber-500/20",
    buttonClass: "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30",
    animal: "МЕДВЕДЬ",
    title: "ХРАНИТЕЛЬ ЛЕСА",
    description: "Ты ценишь комфорт, вкусную еду и неспешность. Твоя сила в спокойствии. Ты не бежишь на вершину, ты наслаждаешься каждым шагом.",
    power: "Монументальное спокойствие",
    directionSlug: "local",
    directionName: "Локальные туры",
  },
  eagle: {
    id: "eagle",
    icon: Mountain,
    colorClass: "text-sky-400",
    glowClass: "bg-sky-500/20",
    buttonClass: "bg-sky-600 hover:bg-sky-500 shadow-sky-900/30",
    animal: "ОРЕЛ",
    title: "ВЛАСТЕЛИН ВЫСОТЫ",
    description: "Тебе нужен масштаб. Ты задыхаешься внизу. Твоя цель — самые высокие пики, откуда мир кажется игрушечным.",
    power: "Острое зрение и свобода",
    directionSlug: "hiking",
    directionName: "Горы и Походы",
  },
  fox: {
    id: "fox",
    icon: Sparkles,
    colorClass: "text-orange-500",
    glowClass: "bg-orange-500/20",
    buttonClass: "bg-orange-600 hover:bg-orange-500 shadow-orange-900/30",
    animal: "ЛИС",
    title: "ДУХ ПРИКЛЮЧЕНИЙ",
    description: "Ты хитер, ловок и любопытен. Ты найдешь приключение там, где другие пройдут мимо. Эстетика и легкость — твой выбор.",
    power: "Изобретательность и драйв",
    directionSlug: "sup",
    directionName: "SUP-прогулки",
  },
};

/* =======================
   КОМПОНЕНТ
======================= */
interface Props {
  open: boolean;
  onClose: () => void;
}

export default function QuizTotem({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ wolf: 0, bear: 0, eagle: 0, fox: 0 });
  const [view, setView] = useState<'question' | 'summoning' | 'result'>('question');
  const [finalResult, setFinalResult] = useState<Result | null>(null);
  
  const { updateProfile } = useProfile();
  const { saveResult } = useSaveTest();
  const { shouldRender, closing } = useModalTransition(open, 200);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setStep(0);
      setScores({ wolf: 0, bear: 0, eagle: 0, fox: 0 });
      setView('question');
      setFinalResult(null);
    } else {
      document.body.style.overflow = '';
    }
  }, [open]);

  const handleAnswer = (optionScore: any) => {
    const newScores = {
      wolf: scores.wolf + optionScore.wolf,
      bear: scores.bear + optionScore.bear,
      eagle: scores.eagle + optionScore.eagle,
      fox: scores.fox + optionScore.fox,
    };
    setScores(newScores);

    if (step < questions.length - 1) {
      setTimeout(() => setStep(s => s + 1), 250);
    } else {
      calculateTotem(newScores);
    }
  };

  //   ИСПОЛЬЗУЕТСЯ СТРОГО ОРИГИНАЛЬНАЯ ЛОГИКА И ТИПИЗАЦИЯ
  const calculateTotem = (finalScores: typeof scores) => {
    setView('summoning');
    setTimeout(() => {
      const entries = Object.entries(finalScores);
      const winnerKey = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
      const res = results[winnerKey] || results["wolf"];
      setFinalResult(res);
      
      //   Исправлено на 100% соответствие оригиналу: touristType
      updateProfile({ touristType: `Тотем: ${res.animal}` });
      incrementFunTestPassAction('totem').catch(console.error);
      
      // Сохранение в базу данных
      saveResult('totem', {
        type: res.animal,
        badge: "🦅", 
        description: res.description,
        score: finalScores
      });

      setView('result');
    }, 2500);
  };

  if (!shouldRender) return null;

  const currentQ = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div 
      className={clsx(
        "fixed inset-0 z-[100] flex items-center justify-center bg-[#050510]/95 backdrop-blur-2xl px-4 transition-opacity duration-200 ease-out",
        closing ? "opacity-0" : "opacity-100"
      )}
      onClick={onClose}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 text-indigo-500/10 animate-pulse"><Sparkles size={60}/></div>
          <div className="absolute bottom-20 right-20 text-purple-500/10 animate-pulse delay-700"><Moon size={80}/></div>
          <div className="absolute top-1/3 right-8 text-sky-400/10 animate-pulse delay-300"><Wind size={50}/></div>
          <div className="absolute bottom-1/3 left-8 text-orange-400/10 animate-pulse delay-1000"><Flame size={70}/></div>
      </div>

      <div 
          className={clsx(
            "relative w-full max-w-lg bg-indigo-950/40 border border-indigo-500/30 rounded-[2.5rem] p-6 md:p-10 shadow-[0_0_80px_rgba(79,70,229,0.15)] overflow-hidden flex flex-col max-h-[90dvh] transition-all duration-200 ease-out",
            closing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
          )}
          onClick={(e) => e.stopPropagation()}
      >
          <button onClick={onClose} aria-label="Закрыть" className="absolute top-5 right-5 text-indigo-300/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition z-20 p-3"><X size={20}/></button>

          {/* VIEW 1: QUESTIONS */}
          {view === 'question' && (
              <div key={`q-${step}`} className="flex flex-col h-full z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-center mb-8 pr-12 shrink-0">
                      <span className="text-[12px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-3 block">Вопрос {step + 1}/{questions.length}</span>
                      <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">{currentQ.question}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
                      {currentQ.options.map((opt) => {
                        const OptionIcon = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleAnswer(opt.score)}
                            className="aspect-square rounded-3xl bg-indigo-900/30 hover:bg-indigo-600/20 border border-indigo-500/20 flex flex-col items-center justify-center gap-4 transition-all duration-300 group relative overflow-hidden hover:scale-105 active:scale-95"
                          >
                              <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <OptionIcon className="w-10 h-10 text-indigo-300 group-hover:text-white transition-colors group-hover:scale-110 duration-300" strokeWidth={1.5} />
                              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider relative z-10">{opt.label}</span>
                          </button>
                        );
                      })}
                  </div>

                  <div className="shrink-0 mt-auto h-1.5 bg-indigo-950 rounded-full overflow-hidden border border-indigo-500/10">
                      <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 shadow-[0_0_15px_#6366f1] transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
              </div>
          )}

          {/* VIEW 2: SUMMONING */}
          {view === 'summoning' && (
              <div key="summoning" className="flex flex-col items-center justify-center min-h-[400px] text-center z-10 animate-in fade-in duration-300">
                  <div className="relative mb-8 w-32 h-32 flex items-center justify-center">
                        <div className="w-full h-full rounded-full border-t-2 border-l-2 border-indigo-500 opacity-50 absolute inset-0 animate-[spin_3s_linear_infinite]" style={{ animation: "spin 3s linear infinite" }} />
                        <div className="w-24 h-24 rounded-full border-b-2 border-r-2 border-purple-400 opacity-50 absolute" style={{ animation: "spin 2s linear infinite reverse" }} />
                        <Sparkles className="w-10 h-10 text-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-indigo-200 uppercase tracking-[0.2em] animate-pulse">Призываем духа...</h3>
              </div>
          )}

          {/* VIEW 3: RESULT */}
          {view === 'result' && finalResult && (
              <div key="result" className="flex flex-col h-full overflow-hidden text-center z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                  <div className="mb-8 relative flex flex-col items-center pt-4">
                      <div className={clsx("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 blur-[60px] rounded-full pointer-events-none", finalResult.glowClass)} />
                      
                      <div className="relative z-10 mb-6 w-24 h-24 rounded-full bg-indigo-950/50 border border-white/10 flex items-center justify-center shadow-xl animate-in zoom-in-50 duration-700">
                          <finalResult.icon className={clsx("w-12 h-12", finalResult.colorClass)} strokeWidth={1.5} />
                      </div>

                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                          <span className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 block">Твой тотем</span>
                          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">{finalResult.animal}</h2>
                          <h3 className={clsx("text-lg font-bold uppercase mb-4", finalResult.colorClass)}>{finalResult.title}</h3>
                      </div>
                  </div>

                  <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-6 mb-6 backdrop-blur-md">
                      <p className="text-indigo-100/90 font-medium leading-relaxed mb-5 text-sm">
                          {finalResult.description}
                      </p>
                      <div className="flex items-center justify-center gap-3 text-xs font-black uppercase text-indigo-200 bg-indigo-900/40 py-2.5 rounded-xl border border-indigo-500/10">
                          <Crown size={16} className={finalResult.colorClass}/>
                          Сила: {finalResult.power}
                      </div>
                  </div>

                  {/* SMART CTA */}
                  <div className="pt-6 mt-4 border-t border-white/10">
                    <p className={clsx("text-[12px] font-bold uppercase tracking-widest mb-1", finalResult.colorClass)}>
                      Мы рекомендуем Вам
                    </p>
                    <h3 className={clsx("text-2xl md:text-3xl font-black uppercase tracking-tight mb-6", finalResult.colorClass)}>
                      {finalResult.directionName}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href={`/directions/${finalResult.directionSlug}`}
                        onClick={onClose}
                        className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all text-center flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Compass size={16} /> О направлении
                      </Link>
                      <Link
                        href={`/tour?category=${finalResult.directionSlug}`}
                        onClick={onClose}
                        className={clsx(
                          "flex-1 py-4 text-white font-bold text-[11px] uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95",
                          finalResult.buttonClass
                        )}
                      >
                        Выбрать маршрут <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
          )}
      </div>
    </div>
  );
}