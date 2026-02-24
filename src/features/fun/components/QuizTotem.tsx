"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { 
  X, ArrowRight, Sparkles, Moon, Sun, Cloud, Wind, Crown,
  Trees, Mountain, Waves, MoonStar, Zap, Footprints, 
  Telescope, ShieldCheck, PartyPopper, GraduationCap,
  Flame, Globe, Droplets, Compass, Activity, Utensils,
  LucideIcon
} from "lucide-react";
import { clsx } from "clsx";

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
  animal: string;
  title: string;
  description: string;
  power: string;
  recommendedTours: Array<{ name: string }>;
};

/* =======================
   ВОПРОСЫ (С Lucide иконками)
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
    animal: "ВОЛК",
    title: "ВОЖАК СТАИ",
    description: "Ты вынослив, верен своим и невероятно силен духом. Горы для тебя — это территория, которую нужно покорить вместе с командой.",
    power: "Неиссякаемая энергия",
    recommendedTours: [{ name: "Кругосветка: Путь героев" }, { name: "Экспедиция в Карпаты" }],
  },
  bear: {
    id: "bear",
    icon: ShieldCheck,
    colorClass: "text-amber-500",
    glowClass: "bg-amber-500/20",
    animal: "МЕДВЕДЬ",
    title: "ХРАНИТЕЛЬ ЛЕСА",
    description: "Ты ценишь комфорт, вкусную еду и неспешность. Твоя сила в спокойствии. Ты не бежишь на вершину, ты наслаждаешься каждым шагом.",
    power: "Монументальное спокойствие",
    recommendedTours: [{ name: "Один день в лесу" }, { name: "Пикник на природе" }],
  },
  eagle: {
    id: "eagle",
    icon: Compass,
    colorClass: "text-sky-400",
    glowClass: "bg-sky-500/20",
    animal: "ОРЕЛ",
    title: "ВЛАСТЕЛИН ВЫСОТЫ",
    description: "Тебе нужен масштаб. Ты задыхаешься внизу. Твоя цель — самые высокие пики, откуда мир кажется игрушечным.",
    power: "Острое зрение и свобода",
    recommendedTours: [{ name: "Горный треккинг" }, { name: "Восхождение" }],
  },
  fox: {
    id: "fox",
    icon: Sparkles,
    colorClass: "text-orange-500",
    glowClass: "bg-orange-500/20",
    animal: "ЛИС",
    title: "ДУХ ПРИКЛЮЧЕНИЙ",
    description: "Ты хитер, ловок и любопытен. Ты найдешь приключение там, где другие пройдут мимо. Скука — твой главный враг.",
    power: "Изобретательность и драйв",
    recommendedTours: [{ name: "Сплав на байдарках" }, { name: "SUP-прогулка" }],
  },
};

/* =======================
   АНИМАЦИИ (Variants)
======================= */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 20 } 
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

export default function QuizTotem({ open, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ wolf: 0, bear: 0, eagle: 0, fox: 0 });
  const [view, setView] = useState<'question' | 'summoning' | 'result'>('question');
  const [finalResult, setFinalResult] = useState<Result | null>(null);

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
    // Имитация магии призыва (задержка 2.5 секунды)
    setTimeout(() => {
      // Ищем животное с максимальным баллом
      const entries = Object.entries(scores);
      const winnerKey = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
      setFinalResult(results[winnerKey]);
      setView('result');
    }, 2500);
  };

  if (!open) return null;

  const currentQ = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050510]/95 backdrop-blur-2xl px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Анимация звезд и стихий на заднем фоне модалки */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 text-indigo-500/10 animate-pulse"><Sparkles size={60}/></div>
            <div className="absolute bottom-20 right-20 text-purple-500/10 animate-pulse delay-700"><Moon size={80}/></div>
            <div className="absolute top-1/3 right-8 text-sky-400/10 animate-pulse delay-300"><Wind size={50}/></div>
            <div className="absolute bottom-1/3 left-8 text-orange-400/10 animate-pulse delay-1000"><Flame size={70}/></div>
        </div>

        <motion.div 
           className="relative w-full max-w-lg bg-indigo-950/40 border border-indigo-500/30 rounded-[2.5rem] p-6 md:p-10 shadow-[0_0_80px_rgba(79,70,229,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
           initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
           onClick={(e) => e.stopPropagation()}
        >
            <button onClick={onClose} className="absolute top-5 right-5 text-indigo-300/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition z-20 p-2"><X size={20}/></button>

            <AnimatePresence mode="wait">
              {/* VIEW 1: QUESTIONS */}
              {view === 'question' && (
                  <motion.div 
                    key={`q-${step}`}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col h-full z-10"
                  >
                      <div className="text-center mb-8">
                          <span className="text-[12px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-3 block">Вопрос {step + 1}/{questions.length}</span>
                          <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">{currentQ.question}</h3>
                      </div>

                      <motion.div 
                        variants={containerVariants} initial="hidden" animate="show"
                        className="grid grid-cols-2 gap-4 mb-8"
                      >
                          {currentQ.options.map((opt) => {
                            const OptionIcon = opt.icon;
                            return (
                             <motion.button
   key={opt.id}
   variants={itemVariants}
   whileHover={{ scale: 1.05 }} 
   whileTap={{ scale: 0.95 }}
   onClick={() => handleAnswer(opt.score)}
   className="aspect-square rounded-3xl bg-indigo-900/30 hover:bg-indigo-600/20 border border-indigo-500/20 flex flex-col items-center justify-center gap-4 transition-all duration-300 group relative overflow-hidden"
>
                                  {/* Легкое свечение при наведении */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <OptionIcon className="w-10 h-10 text-indigo-300 group-hover:text-white transition-colors group-hover:scale-110 duration-300" strokeWidth={1.5} />
                                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider relative z-10">{opt.label}</span>
                              </motion.button>
                            );
                          })}
                      </motion.div>

                      <div className="mt-auto h-1.5 bg-indigo-950 rounded-full overflow-hidden border border-indigo-500/10">
                          <motion.div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 shadow-[0_0_15px_#6366f1]" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                      </div>
                  </motion.div>
              )}

              {/* VIEW 2: SUMMONING (MAGIC LOADING) */}
              {view === 'summoning' && (
                  <motion.div 
                    key="summoning"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-[400px] text-center z-10"
                  >
                      <div className="relative mb-8 w-32 h-32 flex items-center justify-center">
                           <motion.div 
                              animate={{ rotate: 360 }} 
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="w-full h-full rounded-full border-t-2 border-l-2 border-indigo-500 opacity-50 absolute inset-0"
                           />
                           <motion.div 
                              animate={{ rotate: -360 }} 
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="w-24 h-24 rounded-full border-b-2 border-r-2 border-purple-400 opacity-50 absolute"
                           />
                           <Sparkles className="w-10 h-10 text-white animate-pulse" />
                      </div>
                      <h3 className="text-xl font-black text-indigo-200 uppercase tracking-[0.2em] animate-pulse">Призываем духа...</h3>
                  </motion.div>
              )}

              {/* VIEW 3: RESULT */}
              {view === 'result' && finalResult && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col h-full overflow-y-auto custom-scrollbar text-center z-10"
                  >
                      <div className="mb-8 relative flex flex-col items-center pt-4">
                          <div className={clsx("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 blur-[60px] rounded-full pointer-events-none", finalResult.glowClass)} />
                          
                          <motion.div 
                             initial={{ scale: 0, rotate: -180 }} 
                             animate={{ scale: 1, rotate: 0 }} 
                             transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                             className="relative z-10 mb-6 w-24 h-24 rounded-full bg-indigo-950/50 border border-white/10 flex items-center justify-center shadow-xl"
                          >
                              <finalResult.icon className={clsx("w-12 h-12", finalResult.colorClass)} strokeWidth={1.5} />
                          </motion.div>

                          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                             <span className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 block">Твой тотем</span>
                             <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">{finalResult.animal}</h2>
                             <h3 className={clsx("text-lg font-bold uppercase mb-4", finalResult.colorClass)}>{finalResult.title}</h3>
                          </motion.div>
                      </div>

                      <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-6 mb-6 backdrop-blur-md">
                          <p className="text-indigo-100/90 font-medium leading-relaxed mb-5 text-sm">
                              {finalResult.description}
                          </p>
                          <div className="flex items-center justify-center gap-2 text-xs font-black uppercase text-indigo-200 bg-indigo-900/40 py-2.5 rounded-xl border border-indigo-500/10">
                              <Crown size={16} className={finalResult.colorClass}/>
                              Сила: {finalResult.power}
                          </div>
                      </div>

                      <div className="mt-auto space-y-3">
                          <p className="text-[12px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Твоя стихия ждет</p>
                          {finalResult.recommendedTours.map((tour, i) => (
                               <button
                                  key={i}
                                  onClick={() => onComplete(`Тотем: ${finalResult.animal} (${finalResult.title}). Хочу: ${tour.name}`)}
                                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-3 group"
                               >
                                   <Sparkles size={16} className="text-indigo-200 group-hover:text-white transition-colors" /> 
                                   Выбрать путь ({tour.name}) 
                                   <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                               </button>
                          ))}
                      </div>
                  </motion.div>
              )}
            </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}