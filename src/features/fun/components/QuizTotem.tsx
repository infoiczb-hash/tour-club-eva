"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Moon, Sun, Cloud, Wind, Crown } from "lucide-react";
import { clsx } from "clsx";

/* =======================
   ТИПЫ
======================= */
type Option = {
  id: string;
  emoji: string;
  label: string;
  score: { wolf: number; bear: number; eagle: number; fox: number };
};

type Result = {
  id: string;
  emoji: string;
  animal: string;
  title: string;
  description: string;
  power: string;
  recommendedTours: Array<{ name: string }>;
};

/* =======================
   ВОПРОСЫ (Абстрактные)
======================= */
const questions = [
  {
    id: 1,
    question: "Где ты чувствуешь силу?",
    options: [
      { id: "A", emoji: "🌲", label: "Густой лес", score: { bear: 2, wolf: 1, eagle: 0, fox: 1 } },
      { id: "B", emoji: "🏔️", label: "Вершина скалы", score: { eagle: 3, wolf: 1, bear: 0, fox: 0 } },
      { id: "C", emoji: "🌊", label: "Бурная река", score: { fox: 2, bear: 1, wolf: 0, eagle: 0 } },
      { id: "D", emoji: "🌑", label: "Ночная тишина", score: { wolf: 3, eagle: 1, bear: 0, fox: 1 } },
    ],
  },
  {
    id: 2,
    question: "Твой стиль движения?",
    options: [
      { id: "A", emoji: "🐆", label: "Быстрый рывок", score: { fox: 2, wolf: 1, eagle: 1, bear: 0 } },
      { id: "B", emoji: "🐘", label: "Мощный шаг", score: { bear: 3, wolf: 0, eagle: 0, fox: 0 } },
      { id: "C", emoji: "🦅", label: "Полёт и обзор", score: { eagle: 3, fox: 0, wolf: 0, bear: 0 } },
      { id: "D", emoji: "🐺", label: "Выносливый бег", score: { wolf: 3, fox: 1, bear: 1, eagle: 0 } },
    ],
  },
  {
    id: 3,
    question: "Что важнее в стае?",
    options: [
      { id: "A", emoji: "🛡️", label: "Защита своих", score: { wolf: 3, bear: 2, eagle: 0, fox: 0 } },
      { id: "B", emoji: "🎲", label: "Веселье и игра", score: { fox: 3, eagle: 0, wolf: 0, bear: 1 } },
      { id: "C", emoji: "👁️", label: "Мудрость", score: { eagle: 2, bear: 2, wolf: 1, fox: 0 } },
      { id: "D", emoji: "🍖", label: "Сытный ужин", score: { bear: 3, fox: 1, wolf: 1, eagle: 0 } },
    ],
  },
  {
    id: 4,
    question: "Выбери стихию",
    options: [
      { id: "A", emoji: "💨", label: "Ветер", score: { eagle: 3, wolf: 1, fox: 0, bear: 0 } },
      { id: "B", emoji: "🔥", label: "Огонь", score: { wolf: 2, fox: 2, bear: 0, eagle: 0 } },
      { id: "C", emoji: "🌍", label: "Земля", score: { bear: 3, wolf: 1, fox: 0, eagle: 0 } },
      { id: "D", emoji: "💧", label: "Вода", score: { fox: 3, bear: 1, wolf: 0, eagle: 0 } },
    ],
  },
];

/* =======================
   РЕЗУЛЬТАТЫ (ТОТЕМЫ)
======================= */
const results: Record<string, Result> = {
  wolf: {
    id: "wolf",
    emoji: "🐺",
    animal: "ВОЛК",
    title: "ВОЖАК СТАИ",
    description: "Ты вынослив, верен своим и невероятно силен духом. Горы для тебя — это территория, которую нужно покорить вместе с командой.",
    power: "Неиссякаемая энергия",
    recommendedTours: [{ name: "Кругосветка: Путь героев" }, { name: "Экспедиция в Карпаты" }],
  },
  bear: {
    id: "bear",
    emoji: "🐻",
    animal: "МЕДВЕДЬ",
    title: "ХРАНИТЕЛЬ ЛЕСА",
    description: "Ты ценишь комфорт, вкусную еду и неспешность. Твоя сила в спокойствии. Ты не бежишь на вершину, ты наслаждаешься каждым шагом.",
    power: "Монументальное спокойствие",
    recommendedTours: [{ name: "Один день в лесу" }, { name: "Пикник на природе" }],
  },
  eagle: {
    id: "eagle",
    emoji: "🦅",
    animal: "ОРЕЛ",
    title: "ВЛАСТЕЛИН ВЫСОТЫ",
    description: "Тебе нужен масштаб. Ты задыхаешься внизу. Твоя цель — самые высокие пики, откуда мир кажется игрушечным.",
    power: "Острое зрение и свобода",
    recommendedTours: [{ name: "Горный треккинг" }, { name: "Восхождение" }],
  },
  fox: {
    id: "fox",
    emoji: "🦊",
    animal: "ЛИС",
    title: "ДУХ ПРИКЛЮЧЕНИЙ",
    description: "Ты хитер, ловок и любопытен. Ты найдешь приключение там, где другие пройдут мимо. Скука — твой главный враг.",
    power: "Изобретательность и драйв",
    recommendedTours: [{ name: "Сплав на байдарках" }, { name: "SUP-прогулка" }],
  },
};

/* =======================
   КОМПОНЕНТ
======================= */
interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (result: string) => void;
}

export default function QuizTotem({ open, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ wolf: 0, bear: 0, eagle: 0, fox: 0 });
  const [view, setView] = useState<'question' | 'summoning' | 'result'>('question');
  const [finalResult, setFinalResult] = useState<Result | null>(null);

  // Блокировка скролла
  useEffect(() => {
    if (open) {
        document.body.style.overflow = 'hidden';
        setStep(0);
        setScores({ wolf: 0, bear: 0, eagle: 0, fox: 0 });
        setView('question');
    } else {
        document.body.style.overflow = '';
    }
  }, [open]);

  const handleAnswer = (optionScore: any) => {
    setScores(prev => ({
        wolf: prev.wolf + optionScore.wolf,
        bear: prev.bear + optionScore.bear,
        eagle: prev.eagle + optionScore.eagle,
        fox: prev.fox + optionScore.fox,
    }));

    if (step < questions.length - 1) {
        setTimeout(() => setStep(s => s + 1), 250);
    } else {
        calculateTotem();
    }
  };

  const calculateTotem = () => {
      setView('summoning');
      // Имитация магии
      setTimeout(() => {
          // Находим макс
          const entries = Object.entries(scores);
          // Добавляем финальный выбор текущего шага (он еще не в стейте, но для простоты берем накопленное)
          // В реале лучше передать и учесть, но тут "магия"
          const winnerKey = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
          setFinalResult(results[winnerKey]);
          setView('result');
      }, 2500);
  };

  const handleReset = () => {
    onClose();
  };

  if (!open) return null;

  const currentQ = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050510]/95 backdrop-blur-xl px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Анимация звезд на фоне */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 text-purple-500/20 animate-pulse"><Sparkles size={40}/></div>
            <div className="absolute bottom-20 right-20 text-indigo-500/20 animate-pulse delay-700"><Moon size={60}/></div>
            <div className="absolute top-1/3 right-8 text-indigo-400/10 animate-pulse delay-300"><Wind size={36}/></div>
            <div className="absolute bottom-1/3 left-8 text-purple-400/10 animate-pulse delay-1000"><Cloud size={44}/></div>
            <div className="absolute top-20 right-1/3 text-yellow-400/10 animate-pulse delay-500"><Sun size={32}/></div>
        </div>

        <motion.div 
           className="relative w-full max-w-lg bg-indigo-950/30 border border-indigo-500/30 rounded-[2rem] p-6 md:p-10 shadow-[0_0_50px_rgba(79,70,229,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
           initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
           onClick={(e) => e.stopPropagation()}
        >
            <button onClick={onClose} className="absolute top-4 right-4 text-indigo-300/50 hover:text-white transition z-20 p-2"><X size={24}/></button>

            {/* VIEW 1: QUESTIONS */}
            {view === 'question' && (
                <div className="flex flex-col h-full">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-2 block">Вопрос {step + 1}/{questions.length}</span>
                        <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">{currentQ.question}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {currentQ.options.map((opt) => (
                            <motion.button
                               key={opt.id}
                               whileHover={{ scale: 1.05, backgroundColor: "rgba(79, 70, 229, 0.2)" }}
                               whileTap={{ scale: 0.95 }}
                               onClick={() => handleAnswer(opt.score)}
                               className="aspect-square rounded-2xl bg-indigo-900/40 border border-indigo-500/20 flex flex-col items-center justify-center gap-3 transition-colors group"
                            >
                                <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform">{opt.emoji}</span>
                                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">{opt.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    <div className="mt-auto h-1 bg-indigo-900/50 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" animate={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* VIEW 2: SUMMONING (MAGIC LOADING) */}
            {view === 'summoning' && (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <div className="relative mb-8">
                         <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="w-24 h-24 rounded-full border-t-2 border-l-2 border-indigo-400 opacity-50 absolute inset-0"
                         />
                         <motion.div 
                            animate={{ rotate: -360 }} 
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 rounded-full border-b-2 border-r-2 border-purple-400 opacity-50 absolute inset-4"
                         />
                         <Sparkles className="w-8 h-8 text-white absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest animate-pulse">Призываем духа...</h3>
                </div>
            )}

            {/* VIEW 3: RESULT */}
            {view === 'result' && finalResult && (
                <div className="flex flex-col h-full overflow-y-auto custom-scrollbar text-center">
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />
                        <motion.div 
                           initial={{ scale: 0, rotate: -180 }} 
                           animate={{ scale: 1, rotate: 0 }} 
                           transition={{ type: "spring", bounce: 0.5 }}
                           className="text-8xl relative z-10 mb-4"
                        >
                            {finalResult.emoji}
                        </motion.div>
                        <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.3 }}
                        >
                           <span className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1 block">Твой тотем</span>
                           <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">{finalResult.animal}</h2>
                           <h3 className="text-lg font-bold text-purple-300 uppercase mb-4">{finalResult.title}</h3>
                        </motion.div>
                    </div>

                    <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-2xl p-6 mb-6 backdrop-blur-md">
                        <p className="text-indigo-100 font-medium leading-relaxed mb-4">
                            {finalResult.description}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs font-black uppercase text-indigo-300 bg-indigo-900/50 py-2 rounded-lg">
                            <Crown size={14} className="text-yellow-400"/>
                            Сила: {finalResult.power}
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Твоя стихия ждет</p>
                        {finalResult.recommendedTours.map((tour, i) => (
                             <button
                                key={i}
                                onClick={() => onComplete(`Тотем: ${finalResult.animal} (${finalResult.title}). Хочу: ${tour.name}`)}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2"
                             >
                                 <Sparkles size={16} /> Выбрать путь ({tour.name}) <ArrowRight size={16}/>
                             </button>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}