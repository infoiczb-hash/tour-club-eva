"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Check, Sparkles, Info, Loader2, Trophy } from "lucide-react";
import { clsx } from "clsx";

/* --- ТИПЫ ДАННЫХ --- */
type Answers = {
  experience: string;
  concern: string;
  priority: string;
  readiness: string;
};

type TourResult = {
  id: number;
  match: number;
  emoji: string;
  title: string;
  description: string;
  whyThis: string[];
  features: string[];
  duration: string;
  difficulty: string;
  price: string;
  link_slug: string; // Slug для ссылки или контекста
};

/* --- КОНСТАНТЫ ВОПРОСОВ --- */
const questions = [
  {
    id: 1,
    question: "Ты когда-нибудь ходил в походы?",
    hint: "Не переживай, мы подберём маршрут под любой уровень",
    options: [
      { value: "never", label: "Никогда", icon: "👶", hint: "Всё будет просто!" },
      { value: "few", label: "1-2 раза", icon: "🎒", hint: "Есть база!" },
      { value: "regular", label: "Регулярно", icon: "🏔️", hint: "Опытный!" },
      
    ],
  },
  {
    id: 2,
    question: "Что сейчас волнует больше всего?",
    hint: "Честно — это поможет подобрать правильный формат",
    options: [
      { value: "physical", label: "Боюсь не справиться", icon: "💪", hint: "Все проходят!" },
      { value: "people", label: "Не знаю никого", icon: "👥", hint: "Познакомишься!" },
      { value: "gear", label: "Что брать с собой", icon: "🎒", hint: "Поможем!" },
      { value: "nothing", label: "Ничего не волнует", icon: "😎", hint: "Отлично!" },
    ],
  },
  {
    id: 3,
    question: "Что для тебя важнее всего?",
    hint: "Можешь выбрать несколько вариантов",
    multiple: true,
    options: [
      { value: "relax", label: "Отдохнуть от города", icon: "🌲", hint: "Перезагрузка" },
      { value: "people", label: "Познакомиться", icon: "🤝", hint: "Новые друзья" },
      { value: "challenge", label: "Проверить себя", icon: "🏔️", hint: "Вызов!" },
      { value: "nature", label: "Красивые места", icon: "📸", hint: "Фото-тур" },
    ],
  },
  {
    id: 4,
    question: "Когда ты готов идти в поход?",
    hint: "Это поможет показать подходящие даты",
    options: [
      { value: "soon", label: "В ближайшие выходные", icon: "🚀", hint: "Быстрый старт!" },
      { value: "weeks", label: "Через 2-4 недели", icon: "📅", hint: "Есть время" },
      { value: "explore", label: "Хочу только посмотреть", icon: "👀", hint: "Без давления" },
    ],
  },
];

/* --- КОМПОНЕНТ --- */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect: (tourTitle: string) => void; // Коллбек для открытия Хаба
}

export default function TourQuizModal({ isOpen, onClose, onResultSelect }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ experience: "", concern: "", priority: "", readiness: "" });
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  
  // Состояния этапов
  const [view, setView] = useState<'question' | 'analyzing' | 'results'>('question');
  
  // Для анимации анализа
  const [analysisText, setAnalysisText] = useState("Анализируем ответы...");

  // Сброс при открытии
  useEffect(() => {
    if (isOpen) {
        setStep(0);
        setView('question');
        setAnswers({ experience: "", concern: "", priority: "", readiness: "" });
        setSelectedMultiple([]);
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Логика переключения вопросов
  const handleAnswer = (value: string) => {
    const key = ["experience", "concern", "priority", "readiness"][step] as keyof Answers;
    
    if (questions[step].multiple) {
      setSelectedMultiple(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    } else {
      setAnswers(prev => ({ ...prev, [key]: value }));
      goToNextStep();
    }
  };

  const handleNextMultiple = () => {
    setAnswers(prev => ({ ...prev, priority: selectedMultiple.join(",") }));
    goToNextStep();
  };

  const goToNextStep = () => {
    if (step < questions.length - 1) {
      setTimeout(() => setStep(s => s + 1), 250);
    } else {
      startAnalysis();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  // Эффект "Магии" (Анализ)
  const startAnalysis = () => {
    setView('analyzing');
    const texts = [
      "Проверяем твой уровень...", 
      "Ищем лучшие локации...", 
      "Подбираем команду...", 
      "Готово!"
    ];
    let i = 0;
    const interval = setInterval(() => {
       setAnalysisText(texts[i]);
       i++;
       if (i >= texts.length) {
         clearInterval(interval);
         setView('results');
       }
    }, 600); // 2.4 секунды общей задержки
  };

  // Получаем результаты
  const recommendations = getRecommendations(answers);
  const progress = ((step + 1) / questions.length) * 100;
  const currentQ = questions[step];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
          >
            {/* Кнопка закрытия */}
            <button onClick={onClose} className="absolute top-5 right-5 z-20 text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full">
               <X size={20} />
            </button>

            {/* === VIEW 1: ВОПРОСЫ === */}
            {view === 'question' && (
               <div className="p-6 md:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
                  
                  {/* Прогресс бар */}
                  <div className="mb-8">
                     <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <span>Шаг {step + 1} / {questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                     </div>
                     <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                           className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                           initial={{ width: 0 }}
                           animate={{ width: `${progress}%` }}
                           transition={{ duration: 0.5 }}
                        />
                     </div>
                  </div>

                  {/* Вопрос */}
                  <motion.div
                     key={step}
                     initial={{ x: 20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     exit={{ x: -20, opacity: 0 }}
                     className="flex-1"
                  >
                     <h3 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
                        {currentQ.question}
                     </h3>
                     <p className="text-slate-400 text-sm md:text-base mb-8 font-medium">
                        {currentQ.hint}
                     </p>

                     <div className="space-y-3">
                        {currentQ.options.map((opt) => {
                           const isSelected = currentQ.multiple 
                              ? selectedMultiple.includes(opt.value)
                              : false; // Для одиночного выбора не подсвечиваем, т.к. сразу переключаем

                           return (
                             <button
                               key={opt.value}
                               onClick={() => handleAnswer(opt.value)}
                               className={clsx(
                                  "w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 group",
                                  isSelected 
                                    ? "bg-teal-500/10 border-teal-500" 
                                    : "bg-slate-900 border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/80"
                               )}
                             >
                                <span className="text-3xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                                <div className="flex-1">
                                   <div className={clsx("font-bold text-base mb-0.5", isSelected ? "text-teal-400" : "text-white")}>{opt.label}</div>
                                   <div className="text-xs text-slate-400 font-medium">{opt.hint}</div>
                                </div>
                                {isSelected && <Check className="text-teal-500" />}
                             </button>
                           )
                        })}
                     </div>
                  </motion.div>

                  {/* Футер (Назад / Далее) */}
                  <div className="mt-8 flex items-center justify-between">
                     {step > 0 ? (
                        <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
                           <ArrowLeft size={16}/> Назад
                        </button>
                     ) : <div/>}

                     {currentQ.multiple && (
                        <button 
                           onClick={handleNextMultiple}
                           disabled={selectedMultiple.length === 0}
                           className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition-all"
                        >
                           Далее
                        </button>
                     )}
                  </div>
               </div>
            )}

            {/* === VIEW 2: АНАЛИЗ (Fake Loading) === */}
            {view === 'analyzing' && (
                <div className="flex flex-col items-center justify-center h-[500px] p-10 text-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-teal-500/30 blur-xl rounded-full animate-pulse" />
                        <Loader2 className="w-16 h-16 text-teal-400 animate-spin relative z-10" />
                    </div>
                    <motion.h3 
                       key={analysisText}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="text-2xl font-black text-white uppercase tracking-tight"
                    >
                       {analysisText}
                    </motion.h3>
                </div>
            )}

            {/* === VIEW 3: РЕЗУЛЬТАТЫ === */}
            {view === 'results' && (
               <div className="flex flex-col h-full overflow-hidden bg-slate-900">
                  <div className="p-6 md:p-8 pb-4 text-center shrink-0">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full mb-4">
                         <Sparkles size={14} className="text-teal-400" />
                         <span className="text-[10px] font-black uppercase text-teal-400 tracking-widest">AI подбор завершен</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-white mb-2">Идеально для тебя</h3>
                      <p className="text-slate-400 text-sm">Мы нашли {recommendations.length} варианта, которые подходят под твои ответы.</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0 space-y-4">
                      {recommendations.map((tour, idx) => (
                          <ResultCard 
                             key={tour.id} 
                             tour={tour} 
                             rank={idx + 1} 
                             onSelect={() => {
                                 onClose();
                                 onResultSelect(tour.title);
                             }}
                          />
                      ))}
                  </div>
               </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* --- ПОДКОМПОНЕНТ КАРТОЧКИ --- */
function ResultCard({ tour, rank, onSelect }: { tour: TourResult, rank: number, onSelect: () => void }) {
    const isBest = rank === 1;
    
    return (
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: rank * 0.1 }}
           className={clsx(
               "relative p-5 rounded-2xl border transition-all hover:shadow-lg",
               isBest 
                 ? "bg-gradient-to-br from-teal-900/40 to-slate-900 border-teal-500/50 shadow-teal-900/20" 
                 : "bg-slate-800/50 border-white/5 hover:bg-slate-800"
           )}
        >
            {isBest && (
                <div className="absolute -top-3 left-6 bg-teal-500 text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Trophy size={12} fill="currentColor"/> Твой выбор
                </div>
            )}
            
            <div className="flex justify-between items-start mb-3 mt-1">
                <div className="flex items-center gap-3">
                    <div className="text-4xl">{tour.emoji}</div>
                    <div>
                        <h4 className="font-bold text-white text-lg leading-tight">{tour.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                            <span>{tour.duration}</span>
                            <span className="w-1 h-1 bg-slate-600 rounded-full"/>
                            <span>{tour.difficulty}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-teal-400 font-black text-xl">{tour.match}%</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Совпадение</span>
                </div>
            </div>

            {/* Блок "Почему это подходит" */}
            <div className="bg-black/20 rounded-xl p-3 mb-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={12} className="text-teal-500"/>
                    <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">Почему этот тур:</span>
                </div>
                <ul className="space-y-1">
                    {tour.whyThis.map((reason, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-teal-500/50 mt-1">•</span> {reason}
                        </li>
                    ))}
                </ul>
            </div>

            <button 
                onClick={onSelect}
                className={clsx(
                    "w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2",
                    isBest 
                       ? "bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-lg shadow-teal-500/20"
                       : "bg-white/10 hover:bg-white/20 text-white"
                )}
            >
                Хочу этот тур <ArrowRight size={14}/>
            </button>
        </motion.div>
    )
}

/* --- ЛОГИКА АЛГОРИТМА (Hardcoded Golden Standard) --- */
function getRecommendations(answers: Answers): TourResult[] {
    // В реальном проекте тут можно делать запрос к API
    // Пока используем хардкод, который "безотказен"
    
    // 1. Считаем очки
    const scores = {
        sup: 0,
        kayak: 0,
        oneDay: 0,
        picnic: 0,
        challenge: 0,
        relax: 0,
    };

    // ОПЫТ
    if (answers.experience === "never") { scores.sup += 35; scores.picnic += 30; scores.oneDay += 25; }
    else if (answers.experience === "few") { scores.kayak += 25; scores.oneDay += 20; scores.relax += 20; }
    else { scores.challenge += 35; scores.kayak += 25; }

    // СТРАХИ
    if (answers.concern === "physical") { scores.sup += 30; scores.picnic += 25; scores.relax += 20; }
    if (answers.concern === "people") { scores.oneDay += 25; scores.kayak += 20; }
    if (answers.concern === "gear") { scores.sup += 25; scores.kayak += 20; }

    // ПРИОРИТЕТЫ
    const priorities = answers.priority.split(",");
    if (priorities.includes("relax")) { scores.relax += 25; scores.picnic += 20; scores.sup += 15; }
    if (priorities.includes("people")) { scores.oneDay += 25; scores.kayak += 20; }
    if (priorities.includes("challenge")) { scores.challenge += 30; scores.kayak += 20; }
    if (priorities.includes("nature")) { scores.relax += 20; scores.kayak += 15; }

    // Функция генератора причин "Почему"
    const getWhy = (type: string) => {
        const reasons = [];
        if (answers.experience === "never") reasons.push("Подходит для первого раза, опыт не нужен");
        if (answers.concern === "physical" && (type === 'sup' || type === 'picnic')) reasons.push("Минимальная нагрузка, справится каждый");
        if (answers.concern === "gear") reasons.push("Все снаряжение выдаем, с собой только одежду");
        if (priorities.includes("relax") && type === 'sup') reasons.push("Медитативный формат, полная тишина");
        if (priorities.includes("challenge") && type === 'challenge') reasons.push("Настоящее приключение для проверки себя");
        // Дефолтная причина, если список пуст
        if (reasons.length === 0) reasons.push("Один из самых популярных форматов клуба");
        return reasons.slice(0, 2);
    };

    const allTours: TourResult[] = [
        {
            id: 1,
            match: Math.min(98, 50 + scores.sup),
            emoji: "🏄",
            title: "SUP-прогулка",
            description: "Самый легкий старт. Учим за 5 минут, выдаем жилеты.",
            duration: "3 часа",
            difficulty: "Легко",
            price: "450 MDL",
            link_slug: "sup-dnister",
            whyThis: getWhy('sup'),
            features: [],
        },
        {
            id: 2,
            match: Math.min(95, 45 + scores.kayak),
            emoji: "🚣",
            title: "Сплав на байдарках",
            description: "Классика жанра. Команда, вода и красивые виды.",
            duration: "1 день",
            difficulty: "Средне",
            price: "600 MDL",
            link_slug: "kayak-classic",
            whyThis: getWhy('kayak'),
            features: [],
        },
        {
            id: 3,
            match: Math.min(92, 40 + scores.challenge),
            emoji: "⛰️",
            title: "Горный Треккинг",
            description: "Для тех, кто хочет гор. Румыния, Карпаты.",
            duration: "2 дня",
            difficulty: "Активно",
            price: "1800 MDL",
            link_slug: "mountain-hike",
            whyThis: getWhy('challenge'),
            features: [],
        },
    ];

    // Сортируем по совпадению и отдаем топ-3
    return allTours.sort((a, b) => b.match - a.match);
}