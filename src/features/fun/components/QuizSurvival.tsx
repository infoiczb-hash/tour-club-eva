"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { 
  X, ArrowLeft, Check, Flame, Mountain, AlertTriangle, ArrowRight,
  MessageCircleQuestion, Snail, Camera, Umbrella, Smartphone,
  Dumbbell, Scale, Utensils, HeartHandshake, Eye, Trophy,
  Rocket, Activity, Skull, Tent, Thermometer, Hotel,
  Swords, ShieldCheck, Coffee, Sparkles, Map,
  LucideIcon
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
  theme: {
    color: string;
    bg: string;
    glow: string;
    gradient: string;
  };
  title: string;
  description: string;
  characteristics: string[];
  recommendedTours: Array<{ name: string }>;
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
    theme: {
      color: "text-red-500",
      bg: "bg-red-500/10",
      glow: "bg-red-500/20",
      gradient: "from-red-600 to-orange-600"
    },
    title: "ПОХОДНЫЙ МОНСТР",
    description: "Ты опасен. Ты идёшь вперёд, даже если карты кончились. С тобой можно в горы, в разведку и на край света.",
    characteristics: ["Не паникуешь", "Ведёшь за собой", "Энергия на максимум"],
    recommendedTours: [{ name: "Горный треккинг: Вершины" }, { name: "Экспедиция в Карпаты" }],
    notRecommended: ["Пикники (будет скучно)"],
  },
  {
    id: "reliable",
    icon: ShieldCheck,
    theme: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      glow: "bg-blue-500/20",
      gradient: "from-blue-600 to-indigo-600"
    },
    title: "НАДЁЖНЫЙ СПУТНИК",
    description: "Ты держишь баланс. Не истеришь, не геройствуешь попусту. С тобой спокойно. Команда таких ценит.",
    characteristics: ["Рассудительный", "Помогаешь другим", "Идёшь в своём темпе"],
    recommendedTours: [{ name: "Сплав на байдарках" }, { name: "Один день в лесу" }],
  },
  {
    id: "couch",
    icon: Coffee,
    theme: {
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      glow: "bg-slate-500/20",
      gradient: "from-slate-600 to-zinc-600"
    },
    title: "ДИВАННЫЙ АЛЬПИНИСТ",
    description: "Ты пока морально в кофейне. Но знаешь что? 90% легенд начинались именно так!",
    characteristics: ["Честный с собой", "Готов попробовать", "Есть чувство юмора"],
    recommendedTours: [{ name: "SUP-прогулка (без рюкзака)" }, { name: "Пикник на природе" }],
  },
  {
    id: "potential",
    icon: Sparkles,
    theme: {
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      glow: "bg-purple-500/20",
      gradient: "from-purple-600 to-fuchsia-600"
    },
    title: "СКРЫТЫЙ ПОТЕНЦИАЛ",
    description: "В тебе есть и нытик, и герой. Интрига. Если попадешь в хорошую компанию — свернешь горы.",
    characteristics: ["Непредсказуемый", "Способен удивить", "Ищешь себя"],
    recommendedTours: [{ name: "Один день в лесу" }, { name: "SUP-прогулка" }],
  },
];

/* =======================
 АНИМАЦИИ
======================= */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20, filter: "blur(4px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 24 } }
};
/* =======================
   КОМПОНЕНТ
======================= */
export default function QuizSurvival({ open, onClose, onComplete }: any) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [view, setView] = useState<'question' | 'analyzing' | 'result'>('question');
  const [finalResult, setFinalResult] = useState<Result | null>(null);

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
      setFinalResult(calculateResult(finalAnswers));
      setView('result');
    }, 2000);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  if (!open) return null;

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0505]/95 backdrop-blur-2xl px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#120a0a]/80 border border-red-500/20 rounded-[2.5rem] p-6 md:p-10 overflow-hidden max-h-[90vh] flex flex-col shadow-[0_0_80px_rgba(239,68,68,0.1)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-5 right-5 text-red-500/50 hover:text-red-400 transition z-20 p-2 bg-red-500/5 hover:bg-red-500/20 rounded-full">
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            {/* VIEW 1: ВОПРОСЫ */}
            {view === 'question' && (
              <motion.div 
                key={`q-${step}`}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full z-10"
              >
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
                     <Flame size={14} className="text-red-500 animate-pulse"/>
                     <span className="text-[12px] font-black uppercase text-red-500 tracking-[0.2em]">Тест на выживание</span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight min-h-[72px]">
                    {currentQuestion.question}
                  </h3>

                  <div className="h-1.5 bg-red-950/50 rounded-full overflow-hidden border border-red-500/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                <motion.div 
                  variants={containerVariants} initial="hidden" animate="show"
                  className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2"
                >
                  {currentQuestion.options.map((option) => {
                    const OptionIcon = option.icon;
                    return (
                      <motion.button
                        key={option.value}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, x: 4, backgroundColor: "rgba(239,68,68,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(option.value)}
                        className="w-full p-4 rounded-2xl text-left bg-red-950/10 border border-red-500/10 hover:border-red-500/40 transition-all flex items-center gap-4 group relative overflow-hidden"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#1a0f0f] flex items-center justify-center border border-red-500/10 group-hover:border-red-500/30 group-hover:bg-red-500/10 transition-colors z-10">
                            <OptionIcon size={24} className="text-red-500/50 group-hover:text-red-400 transition-colors" strokeWidth={1.5} />
                        </div>
                        <span className="flex-1 font-medium text-slate-300 group-hover:text-white transition-colors z-10">
                          {option.text}
                        </span>
                      </motion.button>
                    )
                  })}
                </motion.div>

                <div className="mt-6 h-6">
                  {step > 0 && (
                      <button onClick={handleBack} className="text-sm font-bold text-red-500/60 hover:text-red-400 flex items-center gap-2 transition-colors w-fit">
                      <ArrowLeft size={16} /> Назад
                      </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* VIEW 2: АНАЛИЗ */}
            {view === 'analyzing' && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[400px] text-center z-10"
              >
                  <Map className="w-16 h-16 text-red-500 mb-6 animate-pulse" strokeWidth={1} />
                  <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2">Анализ ответов</h3>
                  <p className="text-sm text-red-400/80 font-mono">Вычисление шансов на выживание...</p>
              </motion.div>
            )}

            {/* VIEW 3: РЕЗУЛЬТАТ */}
            {view === 'result' && finalResult && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full overflow-y-auto custom-scrollbar z-10"
              >
                <div className="text-center mb-8 pt-4 relative">
                  <div className={clsx("absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 blur-[80px] rounded-full pointer-events-none opacity-50", finalResult.theme.glow)} />
                  
                  <motion.div 
                     initial={{ scale: 0, rotate: -10 }} 
                     animate={{ scale: 1, rotate: 0 }} 
                     transition={{ type: "spring", bounce: 0.6 }}
                     className={clsx("relative z-10 mx-auto w-24 h-24 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl mb-6", finalResult.theme.bg)}
                  >
                      <finalResult.icon className={clsx("w-12 h-12", finalResult.theme.color)} strokeWidth={1.5} />
                  </motion.div>

                  <h3 className="text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-tight relative z-10">{finalResult.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium max-w-[90%] mx-auto relative z-10">
                    {finalResult.description}
                  </p>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-6">
                  <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-4">Твои характеристики:</h4>
                  <div className="space-y-3">
                    {finalResult.characteristics.map((char, i) => (
                      <div key={i} className="flex items-center gap-3 text-slate-200 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                        <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center shrink-0", finalResult.theme.bg)}>
                            <Check size={14} className={finalResult.theme.color} strokeWidth={3} />
                        </div>
                        <span className="font-medium text-sm">{char}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  <p className={clsx("text-center text-[12px] font-bold uppercase tracking-widest mb-2", finalResult.theme.color)}>
                      Рекомендуем для старта
                  </p>
                  
                  {finalResult.recommendedTours.map((tour, i) => (
                      <button
                        key={i}
                        onClick={() => onComplete(`Квиз Выживание: ${finalResult.title}. Хочу: ${tour.name}`)}
                        className={clsx("w-full p-4 hover:brightness-110 rounded-xl transition-all flex justify-between items-center group shadow-lg text-white font-bold bg-gradient-to-r", finalResult.theme.gradient)}
                      >
                        <span className="text-sm tracking-wide">{tour.name}</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                      </button>
                  ))}

                  {finalResult.notRecommended && (
                     <div className="flex items-center justify-center gap-2 text-[12px] text-slate-500 mt-4 uppercase font-bold">
                        <AlertTriangle size={14} className="text-red-500/50" />
                        <span>Не лезь сюда: {finalResult.notRecommended.join(", ")}</span>
                     </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* =======================
   ЛОГИКА ПОДСЧЁТА
======================= */
function calculateResult(answers: Answer[]): Result {
  const counts = { A: 0, B: 0, C: 0 };
  answers.forEach((a) => counts[a]++);

  if (counts.A >= 4) return results[0]; // Монстр
  if (counts.B >= 4) return results[1]; // Надежный
  if (counts.C >= 4) return results[2]; // Диванный
  
  return results[3]; // Скрытый потенциал
}