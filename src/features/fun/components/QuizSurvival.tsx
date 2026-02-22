"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Check, Flame, Mountain, AlertTriangle, ArrowRight } from "lucide-react";
import { clsx } from "clsx";

/* =======================
   ТИПЫ
======================= */
type Answer = "A" | "B" | "C";

type Result = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  characteristics: string[];
  recommendedTours: Array<{ name: string }>;
  notRecommended?: string[];
  startWith?: { name: string };
};

/* =======================
   ВОПРОСЫ
======================= */
const questions = [
  {
    id: 1,
    question: "Гид говорит: «Идём всего 14 км»",
    options: [
      { value: "A" as Answer, text: "Отлично, разогреемся!", emoji: "🔥" },
      { value: "B" as Answer, text: "А привалы будут?", emoji: "🤔" },
      { value: "C" as Answer, text: "Это туда и обратно?..", emoji: "😰" },
    ],
  },
  {
    id: 2,
    question: "Дождь на самом красивом месте",
    options: [
      { value: "A" as Answer, text: "Фоткаюсь под дождём", emoji: "📸" },
      { value: "B" as Answer, text: "Терплю, но не в восторге", emoji: "😐" },
      { value: "C" as Answer, text: "Проверяю прогноз на 3 часа", emoji: "📱" },
    ],
  },
  {
    id: 3,
    question: "Тебе дали общий котёл (3 кг)",
    options: [
      { value: "A" as Answer, text: "Давайте два!", emoji: "💪" },
      { value: "B" as Answer, text: "Сколько точно весит?", emoji: "⚖️" },
      { value: "C" as Answer, text: "Я лучше понесу хлеб", emoji: "🥖" },
    ],
  },
  {
    id: 4,
    question: "Участник группы отстал",
    options: [
      { value: "A" as Answer, text: "Иду поддержать и помочь", emoji: "🤝" },
      { value: "B" as Answer, text: "Жду и контролирую", emoji: "👀" },
      { value: "C" as Answer, text: "Главное, что я иду первым", emoji: "🥇" },
    ],
  },
  {
    id: 5,
    question: "Подъём круче, чем ожидал",
    options: [
      { value: "A" as Answer, text: "Вот это я понимаю!", emoji: "🤩" },
      { value: "B" as Answer, text: "Дышу, но иду", emoji: "😤" },
      { value: "C" as Answer, text: "Зачем я сюда пришёл...", emoji: "😵" },
    ],
  },
  {
    id: 6,
    question: "Ночь в палатке прохладная",
    options: [
      { value: "A" as Answer, text: "Люблю этот момент", emoji: "⛺" },
      { value: "B" as Answer, text: "Терпимо, если спальник теплый", emoji: "🛌" },
      { value: "C" as Answer, text: "Где тут отель?", emoji: "🏨" },
    ],
  },
];

/* =======================
   РЕЗУЛЬТАТЫ
======================= */
const results: Result[] = [
  {
    id: "monster",
    emoji: "🦁",
    title: "ПОХОДНЫЙ МОНСТР",
    description: "Ты опасен. Ты идёшь вперёд, даже если карты кончились. С тобой можно в горы, в разведку и на край света.",
    characteristics: ["Не паникуешь", "Ведёшь за собой", "Энергия на максимум"],
    recommendedTours: [
      { name: "Горный треккинг: Вершины" },
      { name: "Экспедиция в Карпаты" },
    ],
    notRecommended: ["Пикники (будет скучно)"],
  },
  {
    id: "reliable",
    emoji: "🤝",
    title: "НАДЁЖНЫЙ СПУТНИК",
    description: "Ты держишь баланс. Не истеришь, не геройствуешь попусту. С тобой спокойно. Команда таких ценит.",
    characteristics: ["Рассудительный", "Помогаешь другим", "Идёшь в своём темпе"],
    recommendedTours: [
      { name: "Сплав на байдарках" },
      { name: "Один день в лесу" },
    ],
  },
  {
    id: "couch",
    emoji: "🛋️",
    title: "ДИВАННЫЙ АЛЬПИНИСТ",
    description: "Ты пока морально в кофейне. Но знаешь что? 90% легенд начинались именно так 😄",
    characteristics: ["Честный с собой", "Готов попробовать", "Есть чувство юмора"],
    recommendedTours: [
      { name: "SUP-прогулка (без рюкзака)" },
      { name: "Пикник на природе" },
    ],
  },
  {
    id: "potential",
    emoji: "💎",
    title: "СКРЫТЫЙ ПОТЕНЦИАЛ",
    description: "В тебе есть и нытик, и герой. Интрига. Если попадешь в хорошую компанию — свернешь горы.",
    characteristics: ["Непредсказуемый", "Способен удивить", "Ищешь себя"],
    recommendedTours: [
      { name: "Один день в лесу" },
      { name: "SUP-прогулка" },
    ],
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

export default function QuizSurvival({ open, onClose, onComplete }: Props) {
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
          className="relative w-full max-w-2xl bg-[#0f1216] border border-white/10 rounded-3xl p-6 md:p-10 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleReset} className="absolute top-4 right-4 text-slate-400 hover:text-white transition z-20 p-2 bg-white/5 rounded-full">
            <X size={20} />
          </button>

          {!showResult ? (
            <div className="flex flex-col h-full">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
                   <Flame size={14} className="text-orange-500"/>
                   <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Тест на выживание</span>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-6 leading-tight min-h-[64px]">
                  {currentQuestion.question}
                </h3>

                {/* Progress */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-600"
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
                    className="w-full p-4 rounded-xl text-left bg-slate-900 border border-white/5 hover:border-orange-500/50 hover:bg-orange-950/20 transition-all flex items-center gap-4 group"
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
function ResultScreen({ result, onComplete }: { result: Result; onComplete: (res: string) => void }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4 animate-bounce">{result.emoji}</div>
        <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">{result.title}</h3>
        <p className="text-lg text-slate-400 leading-relaxed font-medium">
          {result.description}
        </p>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 mb-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Твои сильные стороны:</h4>
        <div className="space-y-2">
          {result.characteristics.map((char, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-green-500" strokeWidth={3} />
              </div>
              <span>{char}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 mt-auto">
        <p className="text-center text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
            Рекомендуем для старта
        </p>
        
        {result.recommendedTours.map((tour, i) => (
            <button
              key={i}
              onClick={() => onComplete(`Квиз Выживание: ${result.title}. Хочу: ${tour.name}`)}
              className="w-full p-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-orange-900/40 hover:to-orange-800/40 border border-white/10 hover:border-orange-500/50 rounded-xl transition-all flex justify-between items-center group"
            >
              <div className="flex items-center gap-3">
                 <Mountain size={18} className="text-slate-400 group-hover:text-orange-400 transition-colors"/>
                 <span className="font-bold text-white text-sm">{tour.name}</span>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-white transition-colors"/>
            </button>
        ))}

        {result.notRecommended && (
           <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 mt-4 opacity-70">
              <AlertTriangle size={12} />
              <span>Не рекомендуем: {result.notRecommended.join(", ")}</span>
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

  // Походный монстр: большинство A
  if (counts.A >= 4) return results[0];
  // Надёжный спутник: большинство B
  if (counts.B >= 4) return results[1];
  // Диванный альпинист: большинство C
  if (counts.C >= 4) return results[2];
  
  // Скрытый потенциал: смешанные ответы
  return results[3];
}