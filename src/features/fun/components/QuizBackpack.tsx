"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Luggage, AlertTriangle, ArrowRight } from "lucide-react";
import { clsx } from "clsx";

/* =======================
   ТИПЫ
======================= */
type Item = {
  id: string;
  name: string;
  emoji: string;
  correct: boolean;
};

type Result = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  score: string;
  recommendedTours: Array<{ name: string }>;
  advice?: string;
};

/* =======================
   ДАННЫЕ (ITEMS)
======================= */
const items: Item[] = [
  { id: "poles", name: "Трек. палки", emoji: "🥢", correct: true },
  { id: "brick", name: "Кирпич", emoji: "🧱", correct: false },
  { id: "medkit", name: "Аптечка", emoji: "💊", correct: true },
  { id: "hairdryer", name: "Фен", emoji: "💨", correct: false },
  { id: "compass", name: "Компас", emoji: "🧭", correct: true },
  { id: "dumbbell", name: "Гантеля", emoji: "🏋️", correct: false },
  { id: "water", name: "Вода", emoji: "💧", correct: true },
  { id: "pillow", name: "Подушка", emoji: "😴", correct: false },
  { id: "raincoat", name: "Дождевик", emoji: "🧥", correct: true },
  { id: "iron", name: "Утюг", emoji: "🔌", correct: false },
  { id: "headlamp", name: "Налобник", emoji: "🔦", correct: true },
  { id: "snack", name: "Сникерс", emoji: "🍫", correct: true },
];

/* =======================
   РЕЗУЛЬТАТЫ
======================= */
const results: Result[] = [
  {
    id: "master",
    emoji: "🏆",
    title: "МАСТЕР УПАКОВКИ",
    description: "Ты точно знаешь, что нужно в горах. Твой рюкзак — пример для других. С тобой хоть на край света!",
    score: "6-7 правильных",
    recommendedTours: [
      { name: "Экспедиция в Карпаты" },
      { name: "Сплав на байдарках" },
    ],
  },
  {
    id: "potential",
    emoji: "👍",
    title: "ЕСТЬ ПОТЕНЦИАЛ",
    description: "Неплохо! Ты понимаешь суть, но пара лишних вещей (или забытых важных) могут усложнить путь.",
    score: "4-5 правильных",
    recommendedTours: [
      { name: "Один день в лесу" },
      { name: "Сплав на байдарках" },
    ],
    advice: "Совет: в походе главное — вода, защита от дождя и свет.",
  },
  {
    id: "blogger",
    emoji: "📸",
    title: "ТУРИСТ-БЛОГЕР",
    description: "Фен в лесу? Серьёзно? 😄 Но зато фотки будут красивые! Не переживай, мы научим собираться.",
    score: "2-3 правильных",
    recommendedTours: [
      { name: "SUP-прогулка (без рюкзака!)" },
      { name: "Пикник на природе" },
    ],
    advice: "База: палки, аптечка, вода, дождевик, фонарик.",
  },
  {
    id: "briefing",
    emoji: "🚨",
    title: "НУЖЕН ИНСТРУКТАЖ",
    description: "Кирпич и гантеля? Ты решил устроить кроссфит? 😱 Давай начнем с чего-то простого.",
    score: "0-1 правильных",
    recommendedTours: [
      { name: "Пикник (всё включено)" },
    ],
    advice: "Начни с формата, где рюкзак не нужен.",
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

export default function QuizBackpack({ open, onClose, onComplete }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  // Блокировка скролла
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleToggle = (itemId: string) => {
    if (selected.includes(itemId)) {
      setSelected(selected.filter((id) => id !== itemId));
    } else {
      if (selected.length < 7) {
        setSelected([...selected, itemId]);
      }
    }
  };

  const handleSubmit = () => {
    if (selected.length === 7) setShowResult(true);
  };

  const handleReset = () => {
    setSelected([]);
    setShowResult(false);
    onClose();
  };

  const result = calculateResult(selected);

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
          className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleReset} className="absolute top-4 right-4 text-slate-400 hover:text-white transition z-20 p-2 bg-white/5 rounded-full">
            <X size={20} />
          </button>

          {!showResult ? (
            <div className="flex flex-col h-full">
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3">
                   <Luggage size={14} className="text-blue-400"/>
                   <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Мини-игра</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Собери рюкзак</h3>
                <p className="text-slate-400 text-sm">В рюкзак влезает ровно 7 предметов. Выбирай с умом!</p>
              </div>

              {/* Progress */}
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-white/5 mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase">Места занято:</span>
                  <div className="flex gap-1.5">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${i < selected.length ? "bg-blue-500 scale-110" : "bg-slate-800"}`} />
                    ))}
                  </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6 overflow-y-auto custom-scrollbar flex-1 pr-1">
                {items.map((item) => {
                  const isSelected = selected.includes(item.id);
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle(item.id)}
                      disabled={!isSelected && selected.length >= 7}
                      className={clsx(
                        "aspect-square p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative group",
                        isSelected 
                          ? "bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                          : "bg-slate-800 border-white/5 hover:border-white/20",
                        !isSelected && selected.length >= 7 && "opacity-30 cursor-not-allowed grayscale"
                      )}
                    >
                      <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">{item.emoji}</span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase">{item.name}</span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <button
                onClick={handleSubmit}
                disabled={selected.length !== 7}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-lg"
              >
                {selected.length === 7 ? "Проверить сборку" : `Выбери ещё ${7 - selected.length}`}
              </button>
            </div>
          ) : (
            <ResultScreen result={result} selected={selected} onComplete={onComplete} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* =======================
   ЭКРАН РЕЗУЛЬТАТА
======================= */
function ResultScreen({ result, selected, onComplete }: { result: Result; selected: string[]; onComplete: (res: string) => void }) {
  const selectedItems = items.filter(item => selected.includes(item.id));
  const wrongItems = selectedItems.filter(item => !item.correct);

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4 animate-bounce">{result.emoji}</div>
        <h3 className="text-3xl font-black text-white mb-2 uppercase italic">{result.title}</h3>
        <p className="text-slate-400 text-sm font-medium">{result.score}</p>
      </div>

      <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 mb-4">
        <p className="text-slate-300 text-center leading-relaxed font-medium">
          {result.description}
        </p>
      </div>

      {wrongItems.length > 0 ? (
         <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6">
            <h4 className="text-rose-400 font-bold uppercase text-xs mb-3 flex items-center gap-2">
                <AlertTriangle size={14}/> Лишний груз:
            </h4>
            <div className="flex flex-wrap gap-2">
                {wrongItems.map(item => (
                    <span key={item.id} className="px-2 py-1 bg-rose-500/20 text-rose-200 text-xs rounded-lg border border-rose-500/30 flex items-center gap-1">
                        {item.emoji} {item.name}
                    </span>
                ))}
            </div>
         </div>
      ) : (
         <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 text-center">
             <span className="text-emerald-400 font-bold text-sm">Идеально! Ничего лишнего.</span>
         </div>
      )}

      <div className="space-y-3 mt-auto">
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Рекомендуем для старта</p>
        {result.recommendedTours.map((tour, i) => (
            <button
              key={i}
              onClick={() => onComplete(`Квиз Рюкзак: ${result.title}. Интересует: ${tour.name}`)}
              className="w-full p-4 bg-slate-800 hover:bg-teal-600 group rounded-xl border border-white/5 hover:border-teal-500/50 transition-all flex justify-between items-center text-left"
            >
              <span className="font-bold text-white text-sm">{tour.name}</span>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-white"/>
              </div>
            </button>
        ))}
      </div>
    </div>
  );
}

/* =======================
   ЛОГИКА
======================= */
function calculateResult(selected: string[]): Result {
  const selectedItems = items.filter((item) => selected.includes(item.id));
  const correctCount = selectedItems.filter((item) => item.correct).length;

  if (correctCount >= 6) return results[0]; // Мастер
  if (correctCount >= 4) return results[1]; // Потенциал
  if (correctCount >= 2) return results[2]; // Блогер
  return results[3]; // Инструктаж
}