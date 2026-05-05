// src/features/fun/components/QuizTouristType.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  X, ArrowLeft, Check, Compass, Users, Mountain, 
  TreePine, Dices, Scale, ListTodo, Music, Flame, 
  Sparkles, Smile, Activity, Headphones, Utensils, 
  Camera, CloudFog, PartyPopper, Shield, Eye, 
  Handshake, ArrowRight, MapPin, LucideIcon, Umbrella,  Dumbbell, Coffee, Trophy
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
  themeColor: "emerald" | "blue" | "purple" | "amber";
  title: string;
  description: string;
  values: string[];
  directionSlug: string;
  directionName: string;
};

/* =======================
   РЕЗУЛЬТАТЫ
======================= */
const results: Result[] = [
  {
    id: "team",
    icon: Users,
    themeColor: "blue",
    title: "Душа компании",
    description: "Для тебя поход — это прежде всего люди. Вечерние посиделки у костра, песни, шутки и взаимовыручка важнее покоренных километров.",
    values: ["Общение", "Командный дух", "Эмоции"],
    directionSlug: "kayaking",
    directionName: "Сплавы на байдарках",
  },
  {
    id: "sport",
    icon: Mountain,
    themeColor: "amber",
    title: "Покоритель вершин",
    description: "Больше, выше, сильнее! Тебе нужен вызов. Боль в мышцах после похода для тебя — лучшая награда и показатель того, что выходные прошли не зря.",
    values: ["Достижения", "Выносливость", "Преодоление"],
    directionSlug: "hiking",
    directionName: "Горные походы",
  },
  {
    id: "chill",
    icon: Smile,
    themeColor: "purple",
    title: "Гедонист на природе",
    description: "Природа создана для того, чтобы ей наслаждаться. Вкусный кофе с видом на реку, отсутствие тяжелого рюкзака и красивая эстетика — твой выбор.",
    values: ["Комфорт", "Эстетика", "Расслабление"],
    directionSlug: "sup",
    directionName: "SUP-прогулки",
  },
  {
    id: "explorer",
    icon: Compass,
    themeColor: "emerald",
    title: "Искатель впечатлений",
    description: "Ты любишь разнообразие. Тебе интересно попробовать всё понемногу, увидеть новые места, но без фанатизма и жесткого экстрима.",
    values: ["Любопытство", "Баланс", "Новый опыт"],
    directionSlug: "local",
    directionName: "Локальные туры",
  }
];

const THEME_MAP = {
  emerald: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", button: "bg-emerald-600 hover:bg-emerald-500", glow: "bg-emerald-500" },
  blue: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400", button: "bg-blue-600 hover:bg-blue-500", glow: "bg-blue-500" },
  purple: { bg: "bg-purple-500/10 border-purple-500/20", text: "text-purple-400", button: "bg-purple-600 hover:bg-purple-500", glow: "bg-purple-500" },
  amber: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", button: "bg-amber-600 hover:bg-amber-500", glow: "bg-amber-500" },
};

/* =======================
   ВОПРОСЫ
======================= */
const questions: { id: number; text: string; options: Option[] }[] = [
  {
    id: 1,
    text: "Какая фраза описывает твой идеальный выходной?",
    options: [
      { value: "A", text: "Собраться большой шумной компанией и рвануть за город.", icon: PartyPopper },
      { value: "B", text: "Ранний подъем, рюкзак на плечи и 20 км по пересеченной местности.", icon: Activity },
      { value: "C", text: "Проснуться без будильника, выпить кофе с красивым видом.", icon: Coffee }
    ]
  },
  {
    id: 2,
    text: "Что самое крутое в походе?",
    options: [
      { value: "A", text: "Истории у костра до глубокой ночи.", icon: Flame },
      { value: "B", text: "Чувство гордости, когда дошел до финиша.", icon: Trophy },
      { value: "C", text: "Сделать потрясающие фотографии природы.", icon: Camera }
    ]
  },
  {
    id: 3,
    text: "Какую еду ты предпочтешь на природе?",
    options: [
      { value: "A", text: "Общий котелок с кашей, главное — чтобы на всех хватило.", icon: Users },
      { value: "B", text: "Протеиновые батончики и сублиматы — легко нести.", icon: Scale },
      { value: "C", text: "Сыр, вино, фрукты и эстетичная нарезка.", icon: Utensils }
    ]
  },
  {
    id: 4,
    text: "Как ты относишься к тяжелому рюкзаку (15+ кг)?",
    options: [
      { value: "A", text: "Если друзья помогут закинуть на спину — донесу.", icon: Handshake },
      { value: "B", text: "Это часть испытания, я готов к нагрузкам.", icon: Dumbbell },
      { value: "C", text: "Нет, спасибо. Я предпочитаю гулять налегке.", icon: CloudFog }
    ]
  },
  {
    id: 5,
    text: "Во время маршрута начался мелкий дождь. Твои мысли:",
    options: [
      { value: "A", text: "Запоем песню, чтобы было веселее идти!", icon: Music },
      { value: "B", text: "Отлично, это добавит эпичности нашему переходу.", icon: Shield },
      { value: "C", text: "Где ближайшее укрытие, чтобы не промочить ноги?", icon: Umbrella }
    ]
  }
];

/* =======================
   КОМПОНЕНТ
======================= */
interface Props {
  open: boolean;
  onClose: () => void;
}

export default function QuizTouristType({ open, onClose }: Props) {
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  
  const { updateProfile } = useProfile();
  const { saveResult } = useSaveTest();
  const { shouldRender, closing } = useModalTransition(open, 200);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setStep("intro");
      setCurrentQ(0);
      setAnswers([]);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleAnswer = (val: Answer) => {
    const nextAnswers = [...answers, val];
    setAnswers(nextAnswers);

    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ((c) => c + 1), 200);
    } else {
      finishQuiz(nextAnswers);
    }
  };

  const finishQuiz = (finalAnswers: Answer[]) => {
    const res = calculateResult(finalAnswers);
    
    updateProfile({ touristType: res.title });
    incrementFunTestPassAction('tourist-type').catch(console.error);

    saveResult('tourist-type', {
      type: "Тип туриста",
      badge: "🏕️",
      description: `Твой типаж: ${res.title}`,
      fullAnalysis: res.description,
    });

    setStep("result");
  };

  if (!shouldRender) return null;

  const currentQuestion = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const result = step === "result" ? calculateResult(answers) : null;
  const theme = result ? THEME_MAP[result.themeColor] : THEME_MAP.emerald;

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
          "relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] transition-all duration-200 ease-out",
          closing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 z-20 text-slate-300 hover:text-white transition-colors p-3 bg-white/5 hover:bg-white/10 rounded-full"
        >
          <X size={20} />
        </button>

        {step === "intro" && (
          <div key="intro" className="flex flex-col h-full overflow-hidden p-6 md:p-10 text-center justify-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 mx-auto bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <MapPin size={40} />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4 tracking-tight uppercase">
              Какой ты <br /><span className="text-indigo-400">Турист?</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-medium mb-10 max-w-md mx-auto">
              Походы бывают разными: от сурового выживания до расслабленного чилла с бокалом на закате. Пройди короткий тест и узнай свой стиль.
            </p>
            <button 
              onClick={() => setStep("quiz")} 
              className="w-full sm:w-auto px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider mx-auto transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-95"
            >
              Начать тест
            </button>
          </div>
        )}

        {step === "quiz" && (
          <div key={`q-${currentQ}`} className="flex flex-col h-full overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="shrink-0 mb-6 pr-8">
              <div className="flex items-center gap-3 mb-6">
                <Compass className="w-5 h-5 text-indigo-400" />
                <span className="text-indigo-400 text-xs font-bold tracking-widest uppercase">Вопрос {currentQ + 1} из {questions.length}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-6">{currentQuestion.text}</h2>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 space-y-3">
              {currentQuestion.options.map((opt, i) => {
                  const Icon = opt.icon;
                  return (
                    <button 
                      key={i} 
                      onClick={() => handleAnswer(opt.value)} 
                      className="w-full text-left px-5 py-4 rounded-2xl border border-white/5 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-500/50 transition-all duration-300 flex items-center gap-4 group hover:scale-[1.02] hover:translate-x-1 active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-indigo-500/30 transition-colors">
                            <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div className="text-[14px] md:text-[15px] font-bold text-slate-300 group-hover:text-white transition-colors">
                            {opt.text}
                        </div>
                    </button>
                  )
              })}
            </div>

            {currentQ > 0 && (
              <div className="shrink-0 pt-4 border-t border-white/5 mt-2">
                  <button 
                    onClick={() => setCurrentQ(q => q - 1)} 
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    <ArrowLeft size={16} /> Назад
                  </button>
              </div>
            )}
          </div>
        )}

        {step === "result" && result && (
          <div key="result" className="flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-6 text-center">
              
              <div className="mb-8 relative inline-block">
                <div className={clsx("absolute inset-0 blur-3xl opacity-30 rounded-full", theme.glow)} />
                <div className={clsx("w-24 h-24 mx-auto rounded-3xl flex items-center justify-center border relative z-10 shadow-2xl", theme.bg)}>
                  <result.icon className={clsx("w-12 h-12", theme.text)} strokeWidth={1.5}/>
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tight">
                {result.title}
              </h2>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {result.values.map((v, i) => (
                   <span key={i} className={clsx("px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border", theme.bg, theme.text)}>
                      {v}
                   </span>
                ))}
              </div>

              <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium mb-10 max-w-lg mx-auto">
                {result.description}
              </p>

              <div className="border-t border-white/10 pt-8 mt-4">
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Твой идеальный формат:
                </p>
                <h3 className={clsx("text-2xl font-black mb-6 uppercase tracking-wide", theme.text)}>
                  {result.directionName}
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/directions/${result.directionSlug}`}
                    onClick={onClose}
                    className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all text-center flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Compass size={16} /> О направлении
                  </Link>
                  <Link
                    href={`/tour?category=${result.directionSlug}`}
                    onClick={onClose}
                    className={clsx(
                      "flex-1 py-4 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all text-center flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95",
                      theme.button
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

  if (counts.A >= 3 && counts.A > counts.B && counts.A > counts.C) return results[0]; // Team -> Байдарки
  if (counts.B >= 3 && counts.B > counts.A && counts.B > counts.C) return results[1]; // Sport -> Горы
  if (counts.C >= 3 && counts.C > counts.A && counts.C > counts.B) return results[2]; // Chill -> Сапы
  
  return results[3]; // Explorer -> Локальные (Смешанный тип)
}