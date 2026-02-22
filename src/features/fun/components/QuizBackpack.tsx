"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Check, Luggage, AlertTriangle, ArrowRight, 
  Milestone, BrickWall, BriefcaseMedical, Wind, 
  Compass, Dumbbell, Droplet, Moon, Umbrella, 
  Plug, Flashlight, Cookie, Trophy, ThumbsUp, Camera, ShieldAlert,
  LucideIcon
} from "lucide-react";
import { clsx } from "clsx";

/* =======================
   ТИПЫ
======================= */
type Item = {
  id: string;
  name: string;
  icon: LucideIcon;
  correct: boolean;
};

type Result = {
  id: string;
  icon: LucideIcon;
  iconColor: string;
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
  { id: "poles", name: "Трек. палки", icon: Milestone, correct: true },
  { id: "brick", name: "Кирпич", icon: BrickWall, correct: false },
  { id: "medkit", name: "Аптечка", icon: BriefcaseMedical, correct: true },
  { id: "hairdryer", name: "Фен", icon: Wind, correct: false },
  { id: "compass", name: "Компас", icon: Compass, correct: true },
  { id: "dumbbell", name: "Гантеля", icon: Dumbbell, correct: false },
  { id: "water", name: "Вода", icon: Droplet, correct: true },
  { id: "pillow", name: "Подушка", icon: Moon, correct: false },
  { id: "raincoat", name: "Дождевик", icon: Umbrella, correct: true },
  { id: "iron", name: "Утюг", icon: Plug, correct: false },
  { id: "headlamp", name: "Налобник", icon: Flashlight, correct: true },
  { id: "snack", name: "Снеки", icon: Cookie, correct: true },
];

/* =======================
   РЕЗУЛЬТАТЫ
======================= */
const results: Result[] = [
  {
    id: "master",
    icon: Trophy,
    iconColor: "text-amber-400",
    title: "МАСТЕР УПАКОВКИ",
    description: "Ты точно знаешь, что нужно в горах. Твой рюкзак — пример для других. С тобой хоть на край света!",
    score: "6-7 правильных",
    recommendedTours: [{ name: "Экспедиция в Карпаты" }, { name: "Сплав на байдарках" }],
  },
  {
    id: "potential",
    icon: ThumbsUp,
    iconColor: "text-blue-400",
    title: "ЕСТЬ ПОТЕНЦИАЛ",
    description: "Неплохо! Ты понимаешь суть, но пара лишних вещей (или забытых важных) могут усложнить путь.",
    score: "4-5 правильных",
    recommendedTours: [{ name: "Один день в лесу" }, { name: "Сплав на байдарках" }],
    advice: "Совет: в походе главное — вода, защита от дождя и свет.",
  },
  {
    id: "blogger",
    icon: Camera,
    iconColor: "text-purple-400",
    title: "ТУРИСТ-БЛОГЕР",
    description: "Фен в лесу? Серьёзно? Но зато фотки будут красивые! Не переживай, мы научим собираться.",
    score: "2-3 правильных",
    recommendedTours: [{ name: "SUP-прогулка (без рюкзака!)" }, { name: "Пикник на природе" }],
    advice: "База: палки, аптечка, вода, дождевик, фонарик.",
  },
  {
    id: "briefing",
    icon: ShieldAlert,
    iconColor: "text-rose-500",
    title: "НУЖЕН ИНСТРУКТАЖ",
    description: "Кирпич и гантеля? Ты решил устроить кроссфит? Давай начнем с чего-то простого.",
    score: "0-1 правильных",
    recommendedTours: [{ name: "Пикник (всё включено)" }],
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setSelected([]);
      setShowResult(false);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleToggle = (itemId: string) => {
    setSelected((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      if (prev.length < 7) return [...prev, itemId];
      return prev;
    });
  };

  const handleReset = () => {
    setSelected([]);
    setShowResult(false);
    onClose();
  };

  const result = calculateResult(selected);

  // Варианты анимации для Stagger-эффекта сетки
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
          className="relative w-full max-w-2xl bg-slate-900/80 border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={handleReset} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20 p-2 bg-white/5 hover:bg-white/10 rounded-full"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>

          {!showResult ? (
            <div className="flex flex-col h-full">
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3">
                   <Luggage size={14} className="text-blue-400"/>
                   <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Инвентарь</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Собери рюкзак</h3>
                <p className="text-slate-400 text-sm">В рюкзак влезает ровно 7 предметов. Выбирай с умом!</p>
              </div>

              {/* Progress Bar 2.0 */}
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-2xl border border-white/5 mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">Места занято:</span>
                  <div className="flex gap-1.5 pr-1">
                    {[...Array(7)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        initial={false}
                        animate={{ 
                          backgroundColor: i < selected.length ? "#3b82f6" : "#1e293b",
                          scale: i < selected.length ? 1.1 : 1 
                        }}
                        className="w-3 h-3 rounded-full" 
                      />
                    ))}
                  </div>
              </div>

              <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="show"
                className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6 overflow-y-auto custom-scrollbar flex-1 pr-1 pb-2"
              >
                {items.map((item) => {
                  const isSelected = selected.includes(item.id);
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle(item.id)}
                      disabled={!isSelected && selected.length >= 7}
                      className={clsx(
                        "aspect-square p-3 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all relative group",
                        isSelected 
                          ? "bg-blue-500/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-blue-400" 
                          : "bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/20 hover:text-white hover:bg-slate-800",
                        !isSelected && selected.length >= 7 && "opacity-30 cursor-not-allowed grayscale hover:scale-100"
                      )}
                    >
                      <Icon className={clsx("w-8 h-8 transition-transform", isSelected ? "scale-110" : "group-hover:scale-110")} strokeWidth={1.5} />
                      <span className={clsx("text-[10px] font-bold uppercase text-center", isSelected ? "text-blue-200" : "text-slate-300")}>
                        {item.name}
                      </span>
                      
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900"
                          >
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </motion.div>

              <button
                onClick={() => setShowResult(true)}
                disabled={selected.length !== 7}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-900/20"
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
  const ResultIcon = result.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
      className="flex flex-col h-full overflow-y-auto custom-scrollbar"
    >
      <div className="text-center mb-6 pt-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800/50 border border-white/10 mb-6 shadow-xl relative">
            <div className={`absolute inset-0 blur-xl opacity-20 rounded-full ${result.iconColor.replace('text-', 'bg-')}`} />
            <ResultIcon className={clsx("w-12 h-12", result.iconColor)} strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight">{result.title}</h3>
        <p className={clsx("text-sm font-bold uppercase tracking-widest", result.iconColor)}>{result.score}</p>
      </div>

      <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 mb-6 shadow-inner">
        <p className="text-slate-300 text-center leading-relaxed font-medium">
          {result.description}
        </p>
      </div>

      {wrongItems.length > 0 ? (
         <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-5 mb-6">
            <h4 className="text-rose-400 font-bold uppercase text-xs mb-3 flex items-center gap-2">
                <AlertTriangle size={16} strokeWidth={2}/> Лишний груз:
            </h4>
            <div className="flex flex-wrap gap-2">
                {wrongItems.map(item => {
                    const WrongIcon = item.icon;
                    return (
                        <span key={item.id} className="px-3 py-1.5 bg-rose-500/10 text-rose-300 text-xs font-medium rounded-lg border border-rose-500/20 flex items-center gap-2">
                            <WrongIcon size={14} /> {item.name}
                        </span>
                    )
                })}
            </div>
         </div>
      ) : (
         <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-5 mb-6 text-center flex items-center justify-center gap-2">
             <Check size={18} className="text-emerald-500" strokeWidth={3} />
             <span className="text-emerald-400 font-bold text-sm">Идеально! Ничего лишнего.</span>
         </div>
      )}

      <div className="space-y-3 mt-auto">
        <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Рекомендуем для старта</p>
        {result.recommendedTours.map((tour, i) => (
            <button
              key={i}
              onClick={() => onComplete(`Квиз Рюкзак: ${result.title}. Интересует: ${tour.name}`)}
              className="w-full p-4 bg-slate-800/50 hover:bg-blue-600/20 group rounded-xl border border-white/5 hover:border-blue-500/50 transition-all flex justify-between items-center text-left"
            >
              <span className="font-bold text-slate-200 group-hover:text-white text-sm transition-colors">{tour.name}</span>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 transition-colors shadow-sm">
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-white transition-colors"/>
              </div>
            </button>
        ))}
      </div>
    </motion.div>
  );
}

/* =======================
   ЛОГИКА
======================= */
function calculateResult(selected: string[]): Result {
  const selectedItems = items.filter((item) => selected.includes(item.id));
  const correctCount = selectedItems.filter((item) => item.correct).length;

  if (correctCount >= 6) return results[0];
  if (correctCount >= 4) return results[1];
  if (correctCount >= 2) return results[2];
  return results[3];
}