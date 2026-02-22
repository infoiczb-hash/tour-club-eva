"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Check, Compass, Waves, Flame, Sparkles, ArrowRight, MapPin } from "lucide-react";

/* =======================
   ТИПЫ
======================= */
type Answer = "A" | "B" | "C";

type Result = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  values: string[];
  recommendedTours: Array<{ name: string }>;
  startWith: { name: string; why: string };
};

/* =======================
   ВОПРОСЫ
======================= */
const questions = [
  {
    id: 1,
    question: "Ты идёшь в поход ради:",
    options: [
      { value: "A" as Answer, text: "Людей и общения", emoji: "👥" },
      { value: "B" as Answer, text: "Видов и вершин", emoji: "🏔️" },
      { value: "C" as Answer, text: "Тишины и себя", emoji: "🧘" },
    ],
  },
  {
    id: 2,
    question: "План или спонтанность?",
    options: [
      { value: "A" as Answer, text: "Полная импровизация", emoji: "🎲" },
      { value: "B" as Answer, text: "Есть план, но гибкий", emoji: "⚖️" },
      { value: "C" as Answer, text: "Чёткий тайминг", emoji: "📋" },
    ],
  },
  {
    id: 3,
    question: "Костёр вечером — это:",
    options: [
      { value: "A" as Answer, text: "Центр веселья и песен", emoji: "🎸" },
      { value: "B" as Answer, text: "Источник тепла", emoji: "🔥" },
      { value: "C" as Answer, text: "Магия и созерцание", emoji: "✨" },
    ],
  },
  {
    id: 4,
    question: "Если ты устал на маршруте:",
    options: [
      { value: "A" as Answer, text: "Шучу, чтобы подбодрить всех", emoji: "😄" },
      { value: "B" as Answer, text: "Сцепил зубы и иду", emoji: "💪" },
      { value: "C" as Answer, text: "Ухожу в свои мысли", emoji: "🎧" },
    ],
  },
  {
    id: 5,
    question: "Лучший момент похода:",
    options: [
      { value: "A" as Answer, text: "Ужин всей бандой", emoji: "🥘" },
      { value: "B" as Answer, text: "Фото на вершине", emoji: "📸" },
      { value: "C" as Answer, text: "Утро в тумане", emoji: "🌫️" },
    ],
  },
  {
    id: 6,
    question: "Твоя роль в группе:",
    options: [
      { value: "A" as Answer, text: "Душа компании", emoji: "🎉" },
      { value: "B" as Answer, text: "Надёжное плечо", emoji: "🛡️" },
      { value: "C" as Answer, text: "Наблюдатель", emoji: "👁️" },
    ],
  },
];

/* =======================
   РЕЗУЛЬТАТЫ
======================= */
const results: Result[] = [
  {
    id: "team",
    emoji: "🤝",
    title: "ЧЕЛОВЕК КОМАНДЫ",
    description: "Тебя вдохновляют люди. Поход для тебя — это социальная сеть в офлайне. Ты создаёшь атмосферу, объединяешь группу и превращаешь любой дождь в вечеринку.",
    values: ["Командный дух", "Новые знакомства", "Эмоции"],
    recommendedTours: [
      { name: "Сплав на байдарках" },
      { name: "Кругосветка: Путь героев" },
    ],
    startWith: {
      name: "Один день в лесу",
      why: "Игры на знакомство и костёр — твоя стихия",
    },
  },
  {
    id: "seeker",
    emoji: "🏔️",
    title: "ИСКАТЕЛЬ ВЫСОТЫ",
    description: "Тебя вдохновляют достижения. Ты ценишь момент преодоления и вид с вершины. Физический вызов для тебя — часть смысла жизни.",
    values: ["Панорамы", "Преодоление", "Результат"],
    recommendedTours: [
      { name: "Горный треккинг" },
      { name: "Экспедиция" },
    ],
    startWith: {
      name: "Точка роста",
      why: "Попробуй свои силы в локальных горах",
    },
  },
  {
    id: "contemplator",
    emoji: "🌿",
    title: "СОЗЕРЦАТЕЛЬ",
    description: "Тебе нужна тишина. Поход для тебя — это детокс от города, возможность замедлиться, услышать птиц и свой внутренний голос.",
    values: ["Уединение", "Гармония", "Природа"],
    recommendedTours: [
      { name: "SUP-прогулка на закате" },
      { name: "Пикник в тишине" },
    ],
    startWith: {
      name: "SUP-прогулка",
      why: "Медитативно, спокойно, только ты и вода",
    },
  },
  {
    id: "balanced",
    emoji: "⚖️",
    title: "ГАРМОНИЧНЫЙ ТУРИСТ",
    description: "Дзен-мастер. Ты умеешь и повеселиться у костра, и помолчать на рассвете. Тебе комфортно везде, и с тобой комфортно всем.",
    values: ["Баланс", "Гибкость", "Открытость"],
    recommendedTours: [
      { name: "Сплав на байдарках" },
      { name: "Комбо-форматы" },
    ],
    startWith: {
      name: "Сплав на байдарках",
      why: "Идеальный микс общения и созерцания природы",
    },
  },
];

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

  // Блокировка скролла
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
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

  const handleReset = () => {
    setStep(0);
    setAnswers([]);
    setShowResult(false);
    onClose();
  };

  const result = calculateResult(answers);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0a1812] border border-white/10 rounded-3xl p-6 md:p-10 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleReset} className="absolute top-4 right-4 text-slate-400 hover:text-white transition z-20 p-2 bg-white/5 rounded-full">
            <X size={20} />
          </button>

          {!showResult ? (
            <div className="flex flex-col h-full">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                   <Compass size={14} className="text-emerald-500"/>
                   <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Психотип туриста</span>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-6 leading-tight min-h-[64px]">
                  {currentQuestion.question}
                </h3>

                {/* Progress */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                {currentQuestion.options.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(option.value)}
                    className="w-full p-4 rounded-xl text-left bg-slate-900 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {option.emoji}
                    </div>
                    <span className="flex-1 font-medium text-slate-200 group-hover:text-white">
                      {option.text}
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="mt-6">
                {step > 0 && (
                    <button onClick={handleBack} className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                    <ArrowLeft size={16} /> Назад
                    </button>
                )}
              </div>
            </div>
          ) : (
            <ResultScreen result={result} onComplete={onComplete} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* =======================
   ЭКРАН РЕЗУЛЬТАТА
======================= */
const resultIconMap: Record<string, React.ReactNode> = {
  team:         <Flame size={18} className="text-emerald-400" />,
  seeker:       <Compass size={18} className="text-emerald-400" />,
  contemplator: <Waves size={18} className="text-emerald-400" />,
  balanced:     <Sparkles size={18} className="text-emerald-400" />,
};

function ResultScreen({ result, onComplete }: { result: Result; onComplete: (res: string) => void }) {
  const startIcon = resultIconMap[result.id] ?? <MapPin size={18} className="text-emerald-400" />;
  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4 animate-pulse">{result.emoji}</div>
        <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">{result.title}</h3>
        <p className="text-lg text-slate-400 leading-relaxed font-medium">
          {result.description}
        </p>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 mb-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Твои ценности:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {result.values.map((val, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-200 text-sm font-bold bg-white/5 p-2 rounded-lg justify-center">
              <Check size={14} className="text-emerald-500" strokeWidth={3} />
              <span>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 mt-auto">
        
        {/* Главная рекомендация */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/30 transition-colors pointer-events-none"/>
            
            <h4 className="text-white font-bold mb-3 flex items-center gap-2 relative z-10">
                {startIcon}
                Идеальный старт для тебя:
            </h4>
            
            <div className="mb-4 relative z-10">
                <h5 className="text-xl font-black text-white mb-1">{result.startWith.name}</h5>
                <p className="text-sm text-emerald-200/70 italic">"{result.startWith.why}"</p>
            </div>

            <button 
                onClick={() => onComplete(`Психотип: ${result.title}. Хочу начать с: ${result.startWith.name}`)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 relative z-10"
            >
                Узнать подробнее <ArrowRight size={16}/>
            </button>
        </div>

        {/* Дополнительные туры */}
        <div className="space-y-2">
            <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">Также тебе понравится</p>
            {result.recommendedTours.map((tour, i) => (
                <button
                key={i}
                onClick={() => onComplete(`Психотип: ${result.title}. Интересует: ${tour.name}`)}
                className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl transition flex justify-between items-center text-slate-400 hover:text-white group"
                >
                <span className="font-bold text-xs">{tour.name}</span>
                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"/>
                </button>
            ))}
        </div>

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

  if (counts.A >= 3 && counts.A > counts.B && counts.A > counts.C) return results[0]; // Team
  if (counts.B >= 3 && counts.B > counts.A && counts.B > counts.C) return results[1]; // Seeker
  if (counts.C >= 3 && counts.C > counts.A && counts.C > counts.B) return results[2]; // Contemplator
  
  return results[3]; // Balanced (если поровну или смешано)
}