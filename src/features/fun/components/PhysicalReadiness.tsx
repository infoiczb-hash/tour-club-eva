"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ArrowLeft, Activity,
  CheckCircle, AlertCircle, Sparkles, Loader2, X, Compass, Dumbbell
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import TourCard from "@/features/tours/components/TourCard";
import { analyzePhysicalAction } from "@/features/fun/actions";
import { Tour } from "@/features/tours/types";
import { useProfile } from "@/hooks/useProfile";  
import { incrementFunTestPassAction } from "@/features/admin/actions/fun";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ─── ДАННЫЕ ──────────────────────────────────────────────────────────────────
type Category = "endurance" | "recovery" | "load" | "discomfort";

const QUESTIONS = [
  { id: 1, category: "endurance" as Category, text: "Как ты переносишь подъём пешком на 5–6 этаж без лифта?", options: [{ value: 1, label: "Задыхаюсь, нужна пауза" }, { value: 2, label: "Тяжело, но дохожу" }, { value: 3, label: "Нормально, слегка учащается дыхание" }, { value: 4, label: "Легко, почти не замечаю" }] },
  { id: 2, category: "endurance" as Category, text: "Сколько ты в среднем проходишь пешком в день?", options: [{ value: 1, label: "Меньше 2 км (в основном транспорт)" }, { value: 2, label: "2–5 км" }, { value: 3, label: "5–8 км" }, { value: 4, label: "Больше 8 км, хожу много" }] },
  { id: 3, category: "endurance" as Category, text: "Ты занимаешься какой-либо физической активностью?", options: [{ value: 1, label: "Нет, практически не занимаюсь" }, { value: 2, label: "Иногда, нерегулярно" }, { value: 3, label: "1–2 раза в неделю" }, { value: 4, label: "3 и более раз в неделю" }] },
  { id: 4, category: "recovery" as Category, text: "Как ты себя чувствуешь на следующий день после долгой прогулки (10+ км)?", options: [{ value: 1, label: "Очень тяжело, болит всё тело" }, { value: 2, label: "Заметная усталость и боли в ногах" }, { value: 3, label: "Небольшая усталость, проходит к обеду" }, { value: 4, label: "Практически не ощущаю" }] },
  { id: 5, category: "recovery" as Category, text: "Как ты спишь после физической нагрузки?", options: [{ value: 1, label: "Хуже обычного, долго уснуть не могу" }, { value: 2, label: "По-разному" }, { value: 3, label: "Так же как всегда" }, { value: 4, label: "Лучше — сразу засыпаю, сплю крепко" }] },
  { id: 6, category: "load" as Category, text: "Приходилось ли тебе нести тяжёлый рюкзак (10+ кг) дольше часа?", options: [{ value: 1, label: "Нет, никогда" }, { value: 2, label: "Один-два раза, было очень тяжело" }, { value: 3, label: "Несколько раз, справлялся нормально" }, { value: 4, label: "Регулярно, привык" }] },
  { id: 7, category: "load" as Category, text: "Как переносишь длительную ходьбу по неровностям (камни, корни)?", options: [{ value: 1, label: "Тяжело, быстро устают ноги и суставы" }, { value: 2, label: "Могу, но недолго" }, { value: 3, label: "Нормально, несколько часов без проблем" }, { value: 4, label: "Комфортно, люблю такой рельеф" }] },
  { id: 8, category: "discomfort" as Category, text: "Как реагируешь на жару или холод при активности?", options: [{ value: 1, label: "Очень тяжело, резко падает самочувствие" }, { value: 2, label: "Неприятно, сильно снижает темп" }, { value: 3, label: "Терпимо, немного некомфортно" }, { value: 4, label: "Адаптируюсь быстро" }] },
  { id: 9, category: "discomfort" as Category, text: "Был опыт ночёвки вне привычных условий (палатка, пол)?", options: [{ value: 1, label: "Нет, и идея меня пугает" }, { value: 2, label: "Нет, но я открыт к этому" }, { value: 3, label: "Да, было неудобно но справился" }, { value: 4, label: "Да, спокойно — это не проблема" }] },
  { id: 10, category: "discomfort" as Category, text: "Отношение к ситуациям без душа или нормального туалета?", options: [{ value: 1, label: "Это серьёзная проблема для меня" }, { value: 2, label: "Некомфортно, но смогу на пару дней" }, { value: 3, label: "Нормально, бывало и так" }, { value: 4, label: "Без разницы, привык" }] },
];

function calcResult(answers: Record<number, number>) {
  const total = Object.values(answers).reduce((a, b) => a + b, 0);
  const pct = total / (QUESTIONS.length * 4);

  if (pct >= 0.75) {
    return { level: "ready", title: "Готов к походу", summary: "Твой уровень позволяет рассматривать маршруты средней сложности. Тело привыкло к нагрузкам.", format: "Многодневные маршруты с набором высоты и переходами 15–20 км." };
  } else if (pct >= 0.5) {
    return { level: "almost", title: "Почти готов", summary: "Хорошая база, но есть зоны, которые стоит укрепить перед первым серьёзным маршрутом.", format: "Однодневные треккинги 10–15 км, затем туры с одной ночёвкой." };
  } else {
    return { level: "prepare", title: "Нужна подготовка", summary: "Это честная отправная точка. Базовую готовность для лёгкого похода можно набрать за 6–8 недель.", format: "Однодневные маршруты до 10 км или спокойные сплавы на воде." };
  }
}

// ─── КОМПОНЕНТ ───────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhysicalReadinessModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<"intro" | "test" | "result" | "ai_result">("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const { updateProfile } = useProfile(); 
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [recommendedTour, setRecommendedTour] = useState<Tour | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Optimistic UX State
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStep("intro");
      setCurrent(0);
      setAnswers({});
      setAiAnalysis("");
      setRecommendedTour(null);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isAiLoading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
    }, 2000); // Тайминг: каждые 2 секунды
    return () => clearInterval(interval);
  }, [isAiLoading]);

  const handleSelect = (value: number) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[current].id]: value }));
    setTimeout(() => {
      if (current + 1 >= QUESTIONS.length) setStep("result");
      else setCurrent(c => c + 1);
    }, 300);
  };

  const result = Object.keys(answers).length === QUESTIONS.length ? calcResult(answers) : null;
  const q = QUESTIONS[current];
  const progress = (current / QUESTIONS.length) * 100;

  const handleGetAiMagic = async () => {
    // 🛡️ Защита: от двойного клика и отсутствия результатов
    if (isAiLoading || !result) return;
    
    setStep("ai_result");
    setIsAiLoading(true);
    setAiAnalysis("");

    try {
      // 🧠 Сборка детального контекста
      const answersText = QUESTIONS.map(q => {
        const selectedLabel = q.options.find(o => o.value === answers[q.id])?.label;
        return `Вопрос: ${q.text}\nОтвет: ${selectedLabel}`;
      }).join("\n\n");

      const res = await analyzePhysicalAction(answersText, result.title, result.summary);
      
          if (res.success) {
    setAiAnalysis(res.analysis || "");
    if (res.tour) setRecommendedTour(res.tour);
    
    // 3. Сохраняем страхи пользователя в его локальный профиль!
       updateProfile({ physicalLevel: result?.level || "prepare" });
incrementFunTestPassAction('physical-readiness').catch(console.error);
      } else {
        setAiAnalysis("Извините, сейчас спортивный ИИ-врач недоступен. Но вы можете посмотреть расписание в каталоге.");
      }
    } catch (error) {
      // 🛡️ Защита: обработка падения сети/сервера
      console.error("Network error:", error);
      setAiAnalysis("Произошла ошибка при соединении с сервером. Пожалуйста, попробуйте позже.");
    } finally {
      setIsAiLoading(false);
    }

  };

  const getLoadingText = () => {
    if (loadingStep === 0) return "Оцениваем выносливость и восстановление...";
    if (loadingStep === 1) return `Анализируем результат: ${result?.title.toLowerCase()}...`;
    return "Подбираем маршруты по твоим силам...";
  };

  if (!isOpen) return null;

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
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-5 right-5 z-20 text-slate-400 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>

          {/* === 1. INTRO === */}
          {step === "intro" && (
            <motion.div key="intro" className="p-6 md:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 mb-8">
                <Dumbbell className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-500 tracking-[0.2em] uppercase">Физическая готовность</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
                Готов ли я<br />
                <span className="text-emerald-400">физически?</span>
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-10 font-medium">
                Честная самооценка на основе твоего реального образа жизни. Не медицинская диагностика — ориентир для понимания своей точки старта.
              </p>
              <button onClick={() => setStep("test")} className="mt-auto w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95">
                Начать оценку <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* === 2. TEST === */}
          {step === "test" && q && (
            <motion.div key={`q-${current}`} className="p-6 md:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
              <div className="mb-8">
                 <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    <span>Вопрос {current + 1} / {QUESTIONS.length}</span>
                    <span>{Math.round(progress)}%</span>
                 </div>
                 <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                    <motion.div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                 </div>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-8 tracking-tight">
                {q.text}
              </h2>

              <div className="space-y-3">
                {q.options.map((opt, idx) => {
                  const isSel = answers[q.id] === opt.value;
                  return (
                    <button key={opt.value} onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 flex items-center gap-4",
                        isSel ? "border-emerald-500 bg-emerald-500/10 text-white" : "border-white/5 bg-slate-800/50 hover:bg-slate-800 text-slate-300"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold", isSel ? "bg-emerald-500 border-emerald-500 text-slate-950" : "border-slate-600 text-slate-500")}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {current > 0 && (
                <button onClick={() => setCurrent(c => c - 1)} className="mt-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest w-fit">
                  <ArrowLeft size={14} /> Назад
                </button>
              )}
            </motion.div>
          )}

          {/* === 3. BASE RESULT === */}
          {step === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 w-fit",
                result.level === "ready" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                result.level === "almost" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              )}>
                {result.level === "ready" ? <CheckCircle size={14} /> : result.level === "almost" ? <AlertCircle size={14} /> : <Activity size={14} />}
                <span className="text-xs font-bold uppercase tracking-widest">{result.title}</span>
              </div>

              <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Резюме формы</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">{result.summary}</p>

              <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 mb-8">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Подходящий формат</div>
                <p className="text-white text-sm font-bold">{result.format}</p>
              </div>

              {/* AI UPSELL */}
              <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-3xl p-6 md:p-8 mt-auto text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none" />
                <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white mb-2">Глубокий разбор от AI</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  ИИ проанализирует ответы как спортивный врач и <strong className="text-white">подберет 1 идеальный тур</strong> из нашего расписания.
                </p>
                <button onClick={handleGetAiMagic} disabled={isAiLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 relative z-10 disabled:opacity-70">
                  <Sparkles size={16} /> Получить разбор
                </button>
              </div>
            </motion.div>
          )}

          {/* === 4. AI RESULT === */}
          {step === "ai_result" && (
            <motion.div key="ai_result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 md:p-10">
                {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full animate-pulse" />
                            <Loader2 className="w-16 h-16 text-emerald-400 animate-spin relative z-10" />
                        </div>
                        <motion.h3 
                            key={loadingStep}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-lg font-bold text-white text-center tracking-wide"
                        >
                            {getLoadingText()}
                        </motion.h3>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="text-center mb-8 border-b border-white/10 pb-6 pt-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <Activity className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Анализ формы</h2>
                        </div>

                        {/* Текст от AI */}
                        <div className="prose prose-sm prose-invert max-w-none text-slate-300 leading-relaxed font-medium mb-10 text-justify">
                            {aiAnalysis.split('\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-4">{paragraph}</p>
                            ))}
                        </div>

                        {/* КАРТОЧКА ТУРА */}
                        {recommendedTour ? (
                            <div className="mt-4 pt-8 border-t border-white/10">
                                <div className="flex items-center gap-2 mb-6">
                                    <Compass className="text-emerald-400" size={20} />
                                    <h3 className="text-lg font-black text-white uppercase tracking-wide">Тур для твоего уровня:</h3>
                                </div>
                                <div className="w-full">
                                    <TourCard tour={recommendedTour} />
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl text-center border border-white/5">
                                <p className="text-slate-400 text-sm mb-4">Для твоего уровня сейчас нет идеального совпадения в расписании, но мы поможем подобрать альтернативу.</p>
                                <button onClick={onClose} className="text-emerald-400 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">
                                    Закрыть
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}