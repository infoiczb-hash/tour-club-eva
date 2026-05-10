// src/features/fun/components/QuizSurvival.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  X, ArrowLeft, Check, Flame, Mountain, AlertTriangle, ArrowRight,
  MessageCircleQuestion, Snail, Camera, Umbrella, Smartphone,
  Dumbbell, Scale, Utensils, HeartHandshake, Eye, Trophy,
  Rocket, Activity, Skull, Tent, Thermometer, Hotel,
  Swords, ShieldCheck, Coffee, Sparkles, Map,
  Compass, LucideIcon
} from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "@/hooks/useProfile";
import { incrementFunTestPassAction } from "@/features/admin/actions/fun";
import { useSaveTest } from "@/hooks/useSaveTest";
import { useModalTransition } from "@/hooks/useModalTransition";

/* =======================
   ТИПЫ
======================= */
type Answer = "A" | "B" | "C";

type Option = {
  value: Answer;
  text: string;
  icon: LucideIcon;
};

type Result = {
  id: string;
  icon: LucideIcon;
  theme: {
    color: string;
    bg: string;
    glow: string;
    gradient: string;
  };
  title: string;
  description: string;
  characteristics: string[];
  directionSlug: string;
  directionName: string;
  notRecommended?: string[];
};

/* =======================
   ВОПРОСЫ
======================= */
const questions: Array<{ id: number; question: string; options: Option[] }> = [
  {
    id: 1,
    question: "Гид говорит: «Идём всего 14 км»",
    options: [
      { value: "A", text: "Отлично, разогреемся!", icon: Flame },
      { value: "B", text: "А привалы будут?", icon: MessageCircleQuestion },
      { value: "C", text: "Это туда и обратно?..", icon: Snail },
    ],
  },
  {
    id: 2,
    question: "Дождь на самом красивом месте",
    options: [
      { value: "A", text: "Фоткаюсь под дождём", icon: Camera },
      { value: "B", text: "Терплю, но не в восторге", icon: Umbrella },
      { value: "C", text: "Проверяю прогноз на 3 часа", icon: Smartphone },
    ],
  },
  {
    id: 3,
    question: "Тебе дали общий котёл (3 кг)",
    options: [
      { value: "A", text: "Давайте два!", icon: Dumbbell },
      { value: "B", text: "Сколько точно весит?", icon: Scale },
      { value: "C", text: "Я лучше понесу хлеб", icon: Utensils },
    ],
  },
  {
    id: 4,
    question: "Участник группы отстал",
    options: [
      { value: "A", text: "Иду поддержать и помочь", icon: HeartHandshake },
      { value: "B", text: "Жду и контролирую", icon: Eye },
      { value: "C", text: "Главное, что я иду первым", icon: Trophy },
    ],
  },
  {
    id: 5,
    question: "Подъём круче, чем ожидал",
    options: [
      { value: "A", text: "Вот это я понимаю!", icon: Rocket },
      { value: "B", text: "Дышу, но иду", icon: Activity },
      { value: "C", text: "Зачем я сюда пришёл...", icon: Skull },
    ],
  },
  {
    id: 6,
    question: "Ночь в палатке прохладная",
    options: [
      { value: "A", text: "Люблю этот момент", icon: Tent },
      { value: "B", text: "Терпимо, сойдет", icon: Thermometer },
      { value: "C", text: "Где тут отель?", icon: Hotel },
    ],
  },
];

/* =======================
   РЕЗУЛЬТАТЫ
======================= */
const results: Result[] = [
  {
    id: "monster",
    icon: Swords,
    theme: { color: "text-amber-500", bg: "bg-amber-500/10", glow: "bg-amber-500/20", gradient: "from-amber-600 to-orange-600" },
    title: "ПОХОДНЫЙ МОНСТР",
    description: "Ты опасен. Ты идёшь вперёд, даже если карты кончились. С тобой можно в горы, в разведку и на край света.",
    characteristics: ["Не паникуешь", "Ведёшь за собой", "Энергия на максимум"],
    directionSlug: "hiking",
    directionName: "Горы и Походы",
    notRecommended: ["Пикники (будет скучно)"],
  },
  {
    id: "reliable",
    icon: ShieldCheck,
    theme: { color: "text-blue-400", bg: "bg-blue-500/10", glow: "bg-blue-500/20", gradient: "from-blue-600 to-indigo-600" },
    title: "НАДЁЖНЫЙ СПУТНИК",
    description: "Ты держишь баланс. Не истеришь, не геройствуешь попусту. С тобой спокойно. Команда таких ценит.",
    characteristics: ["Рассудительный", "Помогаешь другим", "Идёшь в своём темпе"],
    directionSlug: "kayaking",
    directionName: "Сплавы на байдарках",
  },
  {
    id: "couch",
    icon: Coffee,
    theme: { color: "text-emerald-400", bg: "bg-emerald-500/10", glow: "bg-emerald-500/20", gradient: "from-emerald-600 to-teal-600" },
    title: "ДИВАННЫЙ АЛЬПИНИСТ",
    description: "Ты пока морально в кофейне. Но знаешь что? 90% легенд начинались именно так! Начнем с комфорта.",
    characteristics: ["Честный с собой", "Готов попробовать", "Есть чувство юмора"],
    directionSlug: "local",
    directionName: "Локальные туры",
  },
  {
    id: "potential",
    icon: Sparkles,
    theme: { color: "text-purple-400", bg: "bg-purple-500/10", glow: "bg-purple-500/20", gradient: "from-purple-600 to-fuchsia-600" },
    title: "СКРЫТЫЙ ПОТЕНЦИАЛ",
    description: "В тебе есть и нытик, и герой. Интрига. Если попадешь в хорошую компанию — свернешь горы.",
    characteristics: ["Непредсказуемый", "Способен удивить", "Ищешь себя"],
    directionSlug: "sup",
    directionName: "SUP-прогулки",
  },
];

/* =======================
   КОМПОНЕНТ
======================= */
interface Props {
  open: boolean;
  onClose: () => void;
}

export default function QuizSurvival({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [view, setView] = useState<'question' | 'analyzing' | 'result'>('question');
  const [finalResult, setFinalResult] = useState<Result | null>(null);
  
  const { updateProfile } = useProfile();
  const { saveResult } = useSaveTest();
  const { shouldRender, closing } = useModalTransition(open, 200);

useEffect(() => {
  if (open) {
    document.body.style.overflow = 'hidden';
    setStep(0);
    setAnswers([]);
    setView('question');
    setFinalResult(null);
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [open]);

  const handleAnswer = (value: Answer) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 250);
    } else {
      analyzeSurvival(newAnswers);
    }
  };

  const analyzeSurvival = (finalAnswers: Answer[]) => {
    setView('analyzing');
    setTimeout(() => {
      const res = calculateResult(finalAnswers);
      setFinalResult(res);
      
      // Локальное сохранение
      updateProfile({ touristType: `Выживание: ${res.title}` });
      incrementFunTestPassAction('survival').catch(console.error);

      // Сохранение в базу данных
      saveResult('survival', {
        type: res.title,
        badge: "🏕️",
        description: res.description,
      });

      setView('result');
    }, 2000);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  if (!shouldRender) return null;

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl px-4 transition-opacity duration-200 ease-out",
        closing ? "opacity-0" : "opacity-100"
      )}
      onClick={onClose}
    >
      <div
        className={clsx(
          "relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2rem] p-6 md:p-10 overflow-hidden max-h-[90dvh] flex flex-col shadow-2xl transition-all duration-200 ease-out",
          closing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Закрыть" className="absolute top-5 right-5 text-slate-300 hover:text-white transition-colors z-20 p-3 bg-white/5 hover:bg-white/10 rounded-full">
          <X size={20} />
        </button>

        {/* VIEW 1: ВОПРОСЫ */}
        {view === 'question' && (
          <div key={`q-${step}`} className="flex flex-col h-full z-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-8 pr-12 shrink-0">
              <div className="inline-flex items-center gap-3 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
                 <Flame size={14} className="text-orange-500 animate-pulse"/>
                 <span className="text-[12px] font-black uppercase text-orange-500 tracking-[0.2em]">Тест на выживание</span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight min-h-[72px]">
                {currentQuestion.question}
              </h3>

              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
              {currentQuestion.options.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className="w-full p-4 rounded-2xl text-left bg-slate-800/50 border border-white/5 hover:border-orange-500/40 hover:bg-orange-500/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4 group relative overflow-hidden"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 group-hover:border-orange-500/30 transition-colors z-10 shadow-sm">
                        <OptionIcon size={24} className="text-slate-300 group-hover:text-orange-400 transition-colors" strokeWidth={1.5} />
                    </div>
                    <span className="flex-1 font-medium text-slate-300 group-hover:text-white transition-colors z-10">
                      {option.text}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="shrink-0 mt-4 pt-2 border-t border-transparent h-12">
              {step > 0 && (
                  <button onClick={handleBack} className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-3 transition-colors w-fit">
                  <ArrowLeft size={16} /> Назад
                  </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: АНАЛИЗ */}
        {view === 'analyzing' && (
          <div key="analyzing" className="flex flex-col items-center justify-center min-h-[400px] text-center z-10 animate-in fade-in duration-300">
              <Map className="w-16 h-16 text-orange-500 mb-6 animate-pulse" strokeWidth={1} />
              <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2">Анализ ответов</h3>
              <p className="text-sm text-slate-300 font-mono">Вычисление шансов на выживание...</p>
          </div>
        )}

        {/* VIEW 3: РЕЗУЛЬТАТ */}
        {view === 'result' && finalResult && (
          <div key="result" className="flex flex-col h-full overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
              <div className="text-center mb-8 pt-4 relative">
                <div className={clsx("absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 blur-[80px] rounded-full pointer-events-none opacity-40", finalResult.theme.glow)} />
                
                <div 
                   className={clsx("relative z-10 mx-auto w-24 h-24 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl mb-6 animate-in zoom-in-50 duration-500", finalResult.theme.bg)}
                >
                    <finalResult.icon className={clsx("w-12 h-12", finalResult.theme.color)} strokeWidth={1.5} />
                </div>

                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-tight relative z-10">{finalResult.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium max-w-[90%] mx-auto relative z-10">
                  {finalResult.description}
                </p>
              </div>

              <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-6 mb-6">
                <h4 className="text-[12px] font-bold text-slate-300 uppercase tracking-widest mb-4">Твои характеристики:</h4>
                <div className="space-y-3">
                  {finalResult.characteristics.map((char, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-200 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center shrink-0", finalResult.theme.bg)}>
                          <Check size={14} className={finalResult.theme.color} strokeWidth={3} />
                      </div>
                      <span className="font-medium text-sm">{char}</span>
                    </div>
                  ))}
                </div>
              </div>

              {finalResult.notRecommended && (
                 <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-4">
                    <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-200/80 font-medium">Не лезь сюда: {finalResult.notRecommended.join(", ")}</p>
                 </div>
              )}

              {/* SMART CTA */}
              <div className="pt-6 mt-4 border-t border-white/10 text-center">
                <p className="text-[12px] font-bold uppercase tracking-widest text-slate-300 mb-1">
                    Мы рекомендуем Вам
                </p>
                <h3 className={clsx("text-2xl md:text-3xl font-black uppercase tracking-tight mb-6", finalResult.theme.color)}>
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
                      "flex-1 py-4 rounded-xl text-white font-bold text-[11px] uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r hover:brightness-110 active:scale-95",
                      finalResult.theme.gradient
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

/* =======================
   ЛОГИКА ПОДСЧЁТА
======================= */
function calculateResult(answers: Answer[]): Result {
  const counts = { A: 0, B: 0, C: 0 };
  answers.forEach((a) => counts[a]++);

  if (counts.A >= 4) return results[0]; // Монстр -> Горы
  if (counts.B >= 4) return results[1]; // Надежный -> Сплавы
  if (counts.C >= 4) return results[2]; // Диванный -> Локал
  
  return results[3]; // Скрытый потенциал -> SUP
}