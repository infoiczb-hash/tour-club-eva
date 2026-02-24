"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { 
  X, ArrowLeft, Check, Compass, Users, Mountain, 
  TreePine, Dices, Scale, ListTodo, Music, Flame, 
  Sparkles, Smile, Activity, Headphones, Utensils, 
  Camera, CloudFog, PartyPopper, Shield, Eye, 
  Handshake, ArrowRight, MapPin, LucideIcon
} from "lucide-react";
import { clsx } from "clsx";

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
  recommendedTours: Array<{ name: string }>;
  startWith: { name: string; why: string };
};

/* =======================
   ВОПРОСЫ И ИКОНКИ
======================= */
const questions: Array<{ id: number; question: string; options: Option[] }> = [
  {
    id: 1,
    question: "Ты идёшь в поход ради:",
    options: [
      { value: "A", text: "Людей и общения", icon: Users },
      { value: "B", text: "Видов и вершин", icon: Mountain },
      { value: "C", text: "Тишины и себя", icon: TreePine },
    ],
  },
  {
    id: 2,
    question: "План или спонтанность?",
    options: [
      { value: "A", text: "Полная импровизация", icon: Dices },
      { value: "B", text: "Есть план, но гибкий", icon: Scale },
      { value: "C", text: "Чёткий тайминг", icon: ListTodo },
    ],
  },
  {
    id: 3,
    question: "Костёр вечером — это:",
    options: [
      { value: "A", text: "Центр веселья и песен", icon: Music },
      { value: "B", text: "Источник тепла", icon: Flame },
      { value: "C", text: "Магия и созерцание", icon: Sparkles },
    ],
  },
  {
    id: 4,
    question: "Если ты устал на маршруте:",
    options: [
      { value: "A", text: "Шучу, чтобы подбодрить всех", icon: Smile },
      { value: "B", text: "Сцепил зубы и иду", icon: Activity },
      { value: "C", text: "Ухожу в свои мысли", icon: Headphones },
    ],
  },
  {
    id: 5,
    question: "Лучший момент похода:",
    options: [
      { value: "A", text: "Ужин всей бандой", icon: Utensils },
      { value: "B", text: "Фото на вершине", icon: Camera },
      { value: "C", text: "Утро в тумане", icon: CloudFog },
    ],
  },
  {
    id: 6,
    question: "Твоя роль в группе:",
    options: [
      { value: "A", text: "Душа компании", icon: PartyPopper },
      { value: "B", text: "Надёжное плечо", icon: Shield },
      { value: "C", text: "Наблюдатель", icon: Eye },
    ],
  },
];

/* =======================
   РЕЗУЛЬТАТЫ
======================= */
const results: Result[] = [
  {
    id: "team",
    icon: Handshake,
    themeColor: "amber",
    title: "ЧЕЛОВЕК КОМАНДЫ",
    description: "Тебя вдохновляют люди. Поход для тебя — это социальная сеть в офлайне. Ты создаёшь атмосферу, объединяешь группу и превращаешь любой дождь в вечеринку.",
    values: ["Командный дух", "Новые знакомства", "Эмоции"],
    recommendedTours: [{ name: "Сплав на байдарках" }, { name: "Кругосветка: Путь героев" }],
    startWith: { name: "Один день в лесу", why: "Игры на знакомство и костёр — твоя стихия" },
  },
  {
    id: "seeker",
    icon: Mountain,
    themeColor: "blue",
    title: "ИСКАТЕЛЬ ВЫСОТЫ",
    description: "Тебя вдохновляют достижения. Ты ценишь момент преодоления и вид с вершины. Физический вызов для тебя — часть смысла жизни.",
    values: ["Панорамы", "Преодоление", "Результат"],
    recommendedTours: [{ name: "Горный треккинг" }, { name: "Экспедиция" }],
    startWith: { name: "Точка роста", why: "Попробуй свои силы в локальных горах" },
  },
  {
    id: "contemplator",
    icon: TreePine,
    themeColor: "purple",
    title: "СОЗЕРЦАТЕЛЬ",
    description: "Тебе нужна тишина. Поход для тебя — это детокс от города, возможность замедлиться, услышать птиц и свой внутренний голос.",
    values: ["Уединение", "Гармония", "Природа"],
    recommendedTours: [{ name: "SUP-прогулка на закате" }, { name: "Пикник в тишине" }],
    startWith: { name: "SUP-прогулка", why: "Медитативно, спокойно, только ты и вода" },
  },
  {
    id: "balanced",
    icon: Scale,
    themeColor: "emerald",
    title: "ГАРМОНИЧНЫЙ ТУРИСТ",
    description: "Дзен-мастер. Ты умеешь и повеселиться у костра, и помолчать на рассвете. Тебе комфортно везде, и с тобой комфортно всем.",
    values: ["Баланс", "Гибкость", "Открытость"],
    recommendedTours: [{ name: "Сплав на байдарках" }, { name: "Комбо-форматы" }],
    startWith: { name: "Сплав на байдарках", why: "Идеальный микс общения и созерцания природы" },
  },
];

/* =======================
   СЛОВАРИ ЦВЕТОВ (Tailwind)
======================= */
const colorMaps = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    button: "bg-emerald-600 hover:bg-emerald-500",
    glow: "shadow-emerald-900/20",
    gradient: "from-emerald-900/40 to-slate-900",
    blur: "bg-emerald-500/20"
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    button: "bg-blue-600 hover:bg-blue-500",
    glow: "shadow-blue-900/20",
    gradient: "from-blue-900/40 to-slate-900",
    blur: "bg-blue-500/20"
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    button: "bg-purple-600 hover:bg-purple-500",
    glow: "shadow-purple-900/20",
    gradient: "from-purple-900/40 to-slate-900",
    blur: "bg-purple-500/20"
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    button: "bg-amber-600 hover:bg-amber-500",
    glow: "shadow-amber-900/20",
    gradient: "from-amber-900/40 to-slate-900",
    blur: "bg-amber-500/20"
  }
};

/* =======================
   КОМПОНЕНТ
======================= */
interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (result: string) => void;
}

export default function QuizTouristType({ open, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (open) {
        document.body.style.overflow = "hidden";
        setStep(0);
        setAnswers([]);
        setShowResult(false);
    }
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleAnswer = (value: Answer) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 250);
    } else {
      setTimeout(() => setShowResult(true), 250);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const result = calculateResult(answers);

  // Анимация появления списка
  const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = { // <-- Добавили : Variants сюда
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2rem] p-6 md:p-10 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20 p-2 bg-white/5 hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>

          {!showResult ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={step} 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                     <Compass size={14} className="text-emerald-400"/>
                     <span className="text-[12px] font-black uppercase text-emerald-400 tracking-widest">Психотип туриста</span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight min-h-[72px]">
                    {currentQuestion.question}
                  </h3>

                  {/* Progress Bar */}
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <motion.div 
                    variants={listVariants} initial="hidden" animate="show"
                    className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2"
                >
                  {currentQuestion.options.map((option) => {
                    const OptionIcon = option.icon;
                    return (
                      <motion.button
                        key={option.value}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(option.value)}
                        className="w-full p-4 rounded-2xl text-left bg-slate-800/50 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all flex items-center gap-4 group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-colors shadow-sm">
                            <OptionIcon size={24} className="text-slate-400 group-hover:text-emerald-400 transition-colors" strokeWidth={1.5} />
                        </div>
                        <span className="flex-1 font-medium text-slate-300 group-hover:text-white transition-colors">
                          {option.text}
                        </span>
                      </motion.button>
                    )
                  })}
                </motion.div>

                <div className="mt-6 h-6">
                  {step > 0 && (
                      <button onClick={handleBack} className="text-sm font-bold text-slate-500 hover:text-slate-300 flex items-center gap-2 transition-colors w-fit">
                        <ArrowLeft size={16} /> Назад
                      </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <ResultScreen result={result} onComplete={onComplete} theme={colorMaps[result.themeColor]} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* =======================
   ЭКРАН РЕЗУЛЬТАТА
======================= */
function ResultScreen({ result, onComplete, theme }: { result: Result; onComplete: (res: string) => void; theme: any }) {
  const ResultIcon = result.icon;

  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full overflow-y-auto custom-scrollbar"
    >
      <div className="text-center mb-8 pt-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800/50 border border-white/10 mb-6 shadow-xl relative">
            <div className={clsx("absolute inset-0 blur-xl opacity-20 rounded-full", theme.blur)} />
            <ResultIcon className={clsx("w-12 h-12", theme.text)} strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-tight">{result.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed font-medium max-w-[90%] mx-auto">
          {result.description}
        </p>
      </div>

      <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-6 mb-6">
        <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-4">Твои ценности:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {result.values.map((val, i) => (
            <div key={i} className={clsx("flex items-center gap-2 text-slate-200 text-sm font-bold bg-white/5 border p-3 rounded-xl justify-center transition-colors", theme.border)}>
              <Check size={16} className={theme.text} strokeWidth={3} />
              <span>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 mt-auto">
        {/* Главная рекомендация (Светится цветом психотипа) */}
        <div className={clsx("border rounded-2xl p-6 relative overflow-hidden group transition-colors bg-gradient-to-br", theme.gradient, theme.border)}>
            <div className={clsx("absolute top-0 right-0 w-32 h-32 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 transition-colors pointer-events-none", theme.blur, "group-hover:opacity-70")}/>
            
            <h4 className="text-white font-bold mb-3 flex items-center gap-2 relative z-10 text-sm">
                <MapPin size={16} className={theme.text} />
                Идеальный старт для тебя:
            </h4>
            
            <div className="mb-5 relative z-10">
                <h5 className="text-xl font-black text-white mb-1">{result.startWith.name}</h5>
                <p className={clsx("text-sm italic opacity-80", theme.text)}>"{result.startWith.why}"</p>
            </div>

            <button 
                onClick={() => onComplete(`Психотип: ${result.title}. Хочу начать с: ${result.startWith.name}`)}
                className={clsx("w-full py-3.5 text-white font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 relative z-10 shadow-lg", theme.button, theme.glow)}
            >
                Узнать подробнее <ArrowRight size={18}/>
            </button>
        </div>

        {/* Дополнительные туры */}
        <div className="space-y-2 pt-2">
            <p className="text-center text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-3">Также тебе понравится</p>
            {result.recommendedTours.map((tour, i) => (
                <button
                    key={i}
                    onClick={() => onComplete(`Психотип: ${result.title}. Интересует: ${tour.name}`)}
                    className="w-full p-4 bg-slate-800/30 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-xl transition flex justify-between items-center text-slate-400 hover:text-white group"
                >
                    <span className="font-bold text-sm transition-colors">{tour.name}</span>
                    <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"/>
                </button>
            ))}
        </div>
      </div>
    </motion.div>
  );
}

/* =======================
   ЛОГИКА ПОДСЧЁТА
======================= */
function calculateResult(answers: Answer[]): Result {
  const counts = { A: 0, B: 0, C: 0 };
  answers.forEach((a) => counts[a]++);

  if (counts.A >= 3 && counts.A > counts.B && counts.A > counts.C) return results[0]; // Team
  if (counts.B >= 3 && counts.B > counts.A && counts.B > counts.C) return results[1]; // Seeker
  if (counts.C >= 3 && counts.C > counts.A && counts.C > counts.B) return results[2]; // Contemplator
  
  return results[3]; // Balanced
}