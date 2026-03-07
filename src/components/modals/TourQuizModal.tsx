"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ArrowLeft, ArrowRight, Check, Sparkles, Info, Loader2, Trophy,
  Compass, Anchor, Waves, Mountain, Baby, Backpack, Zap, ShieldCheck, 
  Users, Briefcase, Trees, Camera, Rocket, Calendar, Eye
} from "lucide-react";
import { clsx } from "clsx";

/* --- ТИПЫ ДАННЫХ --- */
type Answers = {
  experience: string;
  concern: string;
  priority: string;
  readiness: string;
};

// Новый тип: Направление вместо конкретного тура
type DirectionResult = {
  id: string; // slug направления (sup, kayaking, hiking, local)
  match: number;
  icon: React.ElementType;
  title: string;
  description: string;
  whyThis: string[];
  href_info: string;
  href_tours: string;
};

/* --- КОНСТАНТЫ ВОПРОСОВ (Только Lucide) --- */
const questions = [
  {
    id: 1,
    question: "Какой у вас опыт походов?",
    hint: "Подберем маршрут под ваш уровень подготовки",
    multiple: false,
    options: [
      { value: "never", label: "Никогда не был", icon: Baby, hint: "Сделаем первый шаг вместе" },
      { value: "few", label: "Пару раз ходил", icon: Backpack, hint: "Базовые навыки есть" },
      { value: "regular", label: "Регулярно", icon: Mountain, hint: "Горы — второй дом" },
    ],
  },
  {
    id: 2,
    question: "Что сейчас волнует больше всего?",
    hint: "Ответьте честно, мы учтем это при подборе",
    multiple: false,
    options: [
      { value: "physical", label: "Боюсь не справиться", icon: Zap, hint: "Подберем легкий старт" },
      { value: "people", label: "Не знаю никого в группе", icon: Users, hint: "У нас все знакомятся" },
      { value: "gear", label: "Нет своего снаряжения", icon: Briefcase, hint: "Всё выдадим на месте" },
      { value: "nothing", label: "Я абсолютно готов", icon: ShieldCheck, hint: "Отличный настрой!" },
    ],
  },
  {
    id: 3,
    question: "Что для вас самое важное в туре?",
    hint: "Можно выбрать несколько вариантов",
    multiple: true,
    options: [
      { value: "relax", label: "Перезагрузка и отдых", icon: Trees, hint: "Тишина и природа" },
      { value: "people", label: "Новые знакомства", icon: Users, hint: "Командный дух" },
      { value: "challenge", label: "Бросить себе вызов", icon: Mountain, hint: "Проверка на прочность" },
      { value: "nature", label: "Сделать крутые фото", icon: Camera, hint: "Самые красивые локации" },
    ],
  },
  {
    id: 4,
    question: "Когда планируете отправиться?",
    hint: "Это поможет оценить срочность подготовки",
    multiple: false,
    options: [
      { value: "soon", label: "В ближайшие выходные", icon: Rocket, hint: "Быстрый старт" },
      { value: "weeks", label: "Через 2-4 недели", icon: Calendar, hint: "Есть время на сборы" },
      { value: "explore", label: "Пока просто смотрю", icon: Eye, hint: "Изучаю варианты" },
    ],
  },
];

/* --- КОМПОНЕНТ --- */
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function TourQuizModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ experience: "", concern: "", priority: "", readiness: "" });
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  const [view, setView] = useState<'question' | 'analyzing' | 'results'>('question');
  const [analysisText, setAnalysisText] = useState("Анализируем ответы...");

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

  const startAnalysis = () => {
    setView('analyzing');
    const texts = [
      "Оцениваем физическую нагрузку...", 
      "Проверяем наличие снаряжения...", 
      "Подбираем лучшие направления...", 
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
    }, 700);
  };

  const recommendations = getRecommendations(answers);
  const progress = ((step + 1) / questions.length) * 100;
  const currentQ = questions[step];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            role="dialog" aria-modal="true" aria-labelledby="modal-quiz-title" className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"         >
            <button onClick={onClose} className="absolute top-5 right-5 z-20 text-slate-400 hover:text-white transition-colors p-3 bg-white/5 hover:bg-white/10 rounded-full">
               <X size={20} />
            </button>

            {/* === VIEW 1: ВОПРОСЫ === */}
            {view === 'question' && (
               <div className="p-6 md:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
                  
                  <div className="mb-8">
                     <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <span>Шаг {step + 1} / {questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                     </div>
                     <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                           className="h-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                           initial={{ width: 0 }}
                           animate={{ width: `${progress}%` }}
                           transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                     </div>
                  </div>

                  <motion.div
                     key={step}
                     initial={{ x: 20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     exit={{ x: -20, opacity: 0 }}
                     className="flex-1"
                  >
                     <h3 id="modal-quiz-title" className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                        {currentQ.question}
                     </h3>
                     <p className="text-slate-400 text-sm md:text-base mb-8 font-medium">
                        {currentQ.hint}
                     </p>

                     <div className="grid gap-3">
                        {currentQ.options.map((opt) => {
                           const isSelected = currentQ.multiple ? selectedMultiple.includes(opt.value) : false;
                           const Icon = opt.icon;

                           return (
                             <button
                               key={opt.value}
                               onClick={() => handleAnswer(opt.value)}
                               className={clsx(
                                  "w-full p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 group text-left",
                                  isSelected 
                                    ? "bg-teal-500/10 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.1)]" 
                                    : "bg-slate-900/50 border-slate-800 hover:border-teal-500/50 hover:bg-slate-900"
                               )}
                             >
                                <div className={clsx(
                                    "w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-300",
                                    isSelected ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-teal-500 group-hover:bg-teal-500/20"
                                )}>
                                    <Icon size={24} />
                                </div>
                                
                                <div className="flex-1">
                                   <div className={clsx("font-bold text-base mb-0.5 transition-colors", isSelected ? "text-teal-400" : "text-white")}>
                                       {opt.label}
                                   </div>
                                   <div className="text-xs text-slate-400 font-medium">{opt.hint}</div>
                                </div>
                                
                                {isSelected && <Check className="text-teal-500 shrink-0" />}
                             </button>
                           )
                        })}
                     </div>
                  </motion.div>

                  <div className="mt-8 flex items-center justify-between">
                     {step > 0 ? (
                        <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                           <ArrowLeft size={14}/> Назад
                        </button>
                     ) : <div/>}

                     {currentQ.multiple && (
                        <button 
                           onClick={handleNextMultiple}
                           disabled={selectedMultiple.length === 0}
                           className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 px-8 py-3 rounded-xl font-bold uppercase tracking-widest transition-all text-xs"
                        >
                           Далее <ArrowRight size={14} className="inline ml-1 mb-0.5" />
                        </button>
                     )}
                  </div>
               </div>
            )}

            {/* === VIEW 2: АНАЛИЗ === */}
            {view === 'analyzing' && (
                <div className="flex flex-col items-center justify-center h-[400px] md:h-[500px] p-10 text-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-teal-500/20 blur-2xl rounded-full animate-pulse" />
                        <Loader2 className="w-16 h-16 text-teal-400 animate-spin relative z-10" />
                    </div>
                    <motion.h3 
                       key={analysisText}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="text-xl md:text-2xl font-black text-white uppercase tracking-tight"
                    >
                       {analysisText}
                    </motion.h3>
                </div>
            )}

            {/* === VIEW 3: РЕЗУЛЬТАТЫ === */}
            {view === 'results' && (
               <div className="flex flex-col h-full overflow-hidden bg-slate-950">
                  <div className="p-6 md:p-8 pb-4 text-center shrink-0 border-b border-white/5">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full mb-4">
                         <Sparkles size={14} className="text-teal-400" />
                         <span className="text-[14px] font-black uppercase text-teal-400 tracking-widest">AI подбор завершен</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">Идеально для вас</h3>
                      <p className="text-slate-400 text-sm font-medium">Мы подобрали направления с наивысшим процентом совпадения.</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                      {recommendations.slice(0, 2).map((direction, idx) => (
                          <ResultCard 
                             key={direction.id} 
                             direction={direction} 
                             rank={idx + 1} 
                             onClose={onClose}
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

/* --- ПОДКОМПОНЕНТ КАРТОЧКИ РЕЗУЛЬТАТА --- */
function ResultCard({ direction, rank, onClose }: { direction: DirectionResult, rank: number, onClose: () => void }) {
    const isBest = rank === 1;
    const Icon = direction.icon;
    
    return (
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: rank * 0.1 }}
           className={clsx(
               "relative p-5 md:p-6 rounded-[2rem] border transition-all duration-300 flex flex-col gap-5",
               isBest 
                 ? "bg-slate-900 border-teal-500/40 shadow-[0_10px_30px_rgba(20,184,166,0.1)]" 
                 : "bg-slate-900/50 border-white/5"
           )}
        >
            {isBest && (
                <div className="absolute -top-3 left-6 bg-teal-500 text-slate-950 text-[14px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <Trophy size={12} fill="currentColor"/> Лучший выбор
                </div>
            )}
            
            {/* Header */}
            <div className="flex justify-between items-start mt-1">
                <div className="flex items-center gap-4">
                    <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        isBest ? "bg-teal-500/20 text-teal-400" : "bg-white/5 text-slate-400"
                    )}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-white text-xl tracking-tight leading-none mb-1.5">{direction.title}</h4>
                        <p className="text-xs text-slate-400 font-medium">{direction.description}</p>
                    </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                    <span className={clsx("block font-black text-2xl leading-none", isBest ? "text-teal-400" : "text-white")}>
                        {direction.match}%
                    </span>
                    <span className="text-[12px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">Совпадение</span>
                </div>
            </div>

            {/* Почему это подходит */}
            <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                    <Info size={14} className="text-teal-500"/>
                    <span className="text-[14px] font-bold text-teal-500 uppercase tracking-widest">Почему именно это:</span>
                </div>
                <ul className="space-y-2">
                    {direction.whyThis.map((reason, i) => (
                        <li key={i} className="text-xs text-slate-300 font-medium flex items-start gap-2.5 leading-relaxed">
                            <span className="text-teal-500/50 mt-0.5 shrink-0">❖</span> {reason}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Смарт-кнопки 2026 года (Soft & Hard CTA) */}
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Link 
                    href={direction.href_info}
                    onClick={onClose}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all text-center flex items-center justify-center gap-2"
                >
                    <Compass size={14}/> О направлении
                </Link>
                <Link 
                    href={direction.href_tours}
                    onClick={onClose}
                    className={clsx(
                        "flex-1 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2",
                        isBest 
                            ? "bg-teal-500 text-slate-950 hover:bg-teal-400" 
                            : "bg-white text-slate-950 hover:bg-slate-200"
                    )}
                >
                    Смотреть туры <ArrowRight size={14}/>
                </Link>
            </div>
        </motion.div>
    )
}

/* --- ВЗВЕШЕННЫЙ АЛГОРИТМ (Senior Level Algorithm) --- */
function getRecommendations(answers: Answers): DirectionResult[] {
    // 1. Инициализируем направления с базовым рейтингом
    let scores = { sup: 0, kayaking: 0, hiking: 0, local: 0 };

    // 2. Система весов (Weight System)
    // --- Опыт ---
    if (answers.experience === "never") { scores.sup += 30; scores.local += 20; scores.kayaking += 10; }
    if (answers.experience === "few") { scores.kayaking += 30; scores.hiking += 10; scores.sup += 10; }
    if (answers.experience === "regular") { scores.hiking += 40; scores.kayaking += 20; }

    // --- Страхи ---
    if (answers.concern === "physical") { scores.sup += 30; scores.local += 20; }
    if (answers.concern === "people") { scores.local += 25; scores.kayaking += 20; scores.hiking += 15; }
    if (answers.concern === "gear") { scores.sup += 20; scores.kayaking += 20; scores.local += 20; }
    if (answers.concern === "nothing") { scores.hiking += 30; scores.kayaking += 20; }

    // --- Приоритеты (Множественный выбор) ---
    const priorities = answers.priority.split(",");
    if (priorities.includes("relax")) { scores.sup += 30; scores.local += 25; scores.kayaking += 15; }
    if (priorities.includes("people")) { scores.kayaking += 30; scores.hiking += 20; }
    if (priorities.includes("challenge")) { scores.hiking += 40; scores.kayaking += 15; }
    if (priorities.includes("nature")) { scores.hiking += 25; scores.kayaking += 20; scores.sup += 15; }

    // 3. Динамическая генерация причин "Почему"
    const generateReasons = (type: keyof typeof scores): string[] => {
        const reasons: string[] = [];
        
        if (answers.experience === "never" && (type === "sup" || type === "local")) {
            reasons.push("Идеально для новичков: не требует физической подготовки и опыта.");
        }
        if (answers.concern === "physical" && type === "sup") {
            reasons.push("Минимальная нагрузка. Можно грести сидя или просто лежать на доске.");
        }
        if (answers.concern === "gear" && type !== "hiking") {
            reasons.push("Мы предоставляем абсолютно всё снаряжение премиум-класса.");
        }
        if (priorities.includes("challenge") && type === "hiking") {
            reasons.push("Настоящий вызов: рельеф, высота и проверка собственных сил в горах.");
        }
        if (priorities.includes("relax") && type === "local") {
            reasons.push("Максимальный релакс недалеко от дома, без долгих переездов.");
        }
        if (priorities.includes("people") && type === "kayaking") {
            reasons.push("Командная работа в байдарке — лучший способ завести новые знакомства.");
        }

        // Если специфичных причин не набралось, добавляем универсальные
        if (reasons.length === 0) {
            if (type === "sup") reasons.push("Самый популярный и эстетичный вид отдыха на воде.");
            if (type === "kayaking") reasons.push("Классика туризма: вода, природа и отличная компания.");
            if (type === "hiking") reasons.push("Глубокое погружение в дикую природу вдали от цивилизации.");
            if (type === "local") reasons.push("Отличный способ сбежать от городской суеты на один день.");
        }

        return reasons.slice(0, 2); // Оставляем 2 самые весомые причины
    };

    // 4. Формируем массив результатов с нормализацией процентов (чтобы лучший был ~92-98%)
    const maxScorePossible = 110; // Примерный максимум по весам
    
    const results: DirectionResult[] = [
        {
            id: "sup",
            match: Math.min(98, Math.round((scores.sup / maxScorePossible) * 100) + 20), // +20 базовых очков для красивого отображения
            icon: Anchor,
            title: "SUP Прогулки",
            description: "Медитация на воде и эстетика рассветов",
            whyThis: generateReasons("sup"),
            href_info: "/directions/sup",
            href_tours: "/tour?category=sup"
        },
        {
            id: "kayaking",
            match: Math.min(96, Math.round((scores.kayaking / maxScorePossible) * 100) + 15),
            icon: Waves,
            title: "Сплавы на байдарках",
            description: "Классическое водное приключение для всех",
            whyThis: generateReasons("kayaking"),
            href_info: "/directions/kayaking",
            href_tours: "/tour?category=kayaking"
        },
        {
            id: "hiking",
            match: Math.min(99, Math.round((scores.hiking / maxScorePossible) * 100) + 10),
            icon: Mountain,
            title: "Горы и Походы",
            description: "Настоящий вызов и дикая природа Карпат",
            whyThis: generateReasons("hiking"),
            href_info: "/directions/hiking",
            href_tours: "/tour?category=hiking"
        },
        {
            id: "local",
            match: Math.min(95, Math.round((scores.local / maxScorePossible) * 100) + 25),
            icon: Compass,
            title: "Местная Программа",
            description: "Быстрая перезагрузка без долгих сборов",
            whyThis: generateReasons("local"),
            href_info: "/directions/local",
            href_tours: "/tour?category=local"
        }
    ];

    // 5. Сортируем по убыванию процента совпадения
    return results.sort((a, b) => b.match - a.match);
}