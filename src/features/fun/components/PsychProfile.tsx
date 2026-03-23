// src/features/fun/components/PsychProfile.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft, RotateCcw, Mountain, Users, Search, 
  Compass, TreePine, Zap, ArrowRight, BookOpen, X,
  Clock, BarChart2, Sparkles, CheckCircle2, Brain
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useProfile } from "@/hooks/useProfile";
import { incrementFunTestPassAction } from "@/features/admin/actions/fun";
import { useSaveTest } from "@/hooks/useSaveTest";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ─── Types & Data ────────────────────────────────────────────────────────────
type TypeKey = "leader" | "keeper" | "analyst" | "explorer" | "soloist" | "adapter";
type Step = "intro" | "instruction" | "test" | "result";

interface Statement { id: number; text: string; type: TypeKey; }
interface ProfileType { 
    key: TypeKey; 
    name: string; 
    tagline: string; 
    icon: React.ReactNode; 
    color: string; 
    colorDim: string; 
    accent: string; 
    desc: string; 
    blind: string; 
    pair: string;
    directionSlug: string; 
    directionName: string;
}

const STATEMENTS: Statement[] = [
  { id: 1,  type: "leader",   text: "Когда план неожиданно меняется, я первым предлагаю что делать дальше" },
  { id: 2,  type: "leader",   text: "В неопределённой ситуации я чувствую подъём, а не тревогу" },
  { id: 3,  type: "leader",   text: "Мне комфортно принимать решения за группу, даже если я не уверен на 100%" },
  { id: 4,  type: "leader",   text: "Когда группа теряет темп, я инстинктивно берусь её вести" },
  { id: 5,  type: "keeper",   text: "Я замечаю когда кому-то в группе плохо — раньше, чем он сам скажет" },
  { id: 6,  type: "keeper",   text: "Мне важнее чтобы все дошли вместе, чем дойти первым" },
  { id: 7,  type: "keeper",   text: "Я готов замедлиться или остановиться если вижу что человек на пределе" },
  { id: 8,  type: "keeper",   text: "После сложного дня я трачу силы на поддержку других, а не только на восстановление себя" },
  { id: 9,  type: "analyst",  text: "Перед тем как действовать, мне нужно понять ситуацию — даже если это занимает время" },
  { id: 10, type: "analyst",  text: "В стрессовой ситуации я становлюсь спокойнее и чётче, а не паникую" },
  { id: 11, type: "analyst",  text: "Я склонен просчитывать риски заранее, иногда это раздражает других" },
  { id: 12, type: "analyst",  text: "Когда группа торопится с решением, я чаще всего оказываюсь прав что стоило подождать" },
  { id: 13, type: "explorer", text: "Знакомый маршрут привлекает меня меньше, чем новый — даже если он сложнее" },
  { id: 14, type: "explorer", text: "Лучшие моменты в походе для меня — неожиданные: случайный вид, незапланированный привал" },
  { id: 15, type: "explorer", text: "Я готов отклониться от маршрута ради интересной находки или вида" },
  { id: 16, type: "explorer", text: "Мне становится скучно когда всё идёт точно по плану" },
  { id: 17, type: "soloist",  text: "После длинного дня в группе мне нужно время наедине с собой чтобы восстановиться" },
  { id: 18, type: "soloist",  text: "Я лучше думаю и чувствую себя когда иду в тишине, а не в разговоре" },
  { id: 19, type: "soloist",  text: "Большие шумные группы утомляют меня быстрее чем физическая нагрузка" },
  { id: 20, type: "soloist",  text: "Самые важные мысли приходят ко мне когда я один на маршруте" },
  { id: 21, type: "adapter",  text: "Моя роль в группе меняется в зависимости от ситуации — и это кажется мне естественным" },
  { id: 22, type: "adapter",  text: "Я одинаково комфортно чувствую себя и в роли лидера, и в роли ведомого" },
  { id: 23, type: "adapter",  text: "Мне не нужна постоянная роль — я занимаю то место которое сейчас нужно группе" },
  { id: 24, type: "adapter",  text: "Другие иногда затрудняются сказать кто я в команде, и меня это не беспокоит" },
];

const TYPES: Record<TypeKey, ProfileType> = {
  leader: { key: "leader", name: "Ведущий", tagline: "Ты не ждёшь когда станет ясно — ты делаешь ясно", icon: <Mountain className="w-6 h-6" />, color: "text-amber-500", colorDim: "text-amber-500/20", accent: "#f59e0b", desc: `В походе ты становишься заметным не потому что хочешь власти, а потому что не можешь иначе. Когда группа останавливается в замешательстве, ты уже смотришь на карту. Когда погода меняется — ты первым говоришь вслух что делать дальше.\n\nТвоя сила в том, что неопределённость тебя не парализует — она тебя активирует. Именно такие люди удерживают группу от паники в критические моменты. Ты не обязательно идёшь первым физически — ты первым берёшь на себя ответственность за решение.`, blind: `Ты можешь принять решение раньше чем выслушал всех. В долгих походах это создаёт напряжение — люди чувствуют что их не слышат. Лучший Ведущий тот, кто научился делать паузу перед действием. Две минуты внимания к группе меняют всё.`, pair: `В паре с Аналитиком вы непобедимы — ты действуешь, он думает. В паре с другим Ведущим стоит заранее договориться кто ведёт на каком участке.`, directionSlug: "hiking", directionName: "Горы и Походы" },
  keeper: { key: "keeper", name: "Хранитель", tagline: "Без тебя группа дойдёт до вершины. С тобой — вернётся командой", icon: <Users className="w-6 h-6" />, color: "text-emerald-500", colorDim: "text-emerald-500/20", accent: "#10b981", desc: `Ты видишь людей. Не маршрут, не погоду, не высоту — людей. Ты замечаешь что Маша молчит уже час, что у Антона изменилась походка, что общая энергия группы падает раньше чем кто-то это признает.\n\nЭто редкий и недооценённый талант. Группы без Хранителя технически доходят до цели — но рассыпаются по дороге или после. Именно ты создаёшь то что потом называют «атмосферой» или «химией группы» — хотя сам этого не замечаешь.`, blind: `Ты отдаёшь больше чем берёшь. К концу сложного похода у тебя может не остаться ресурса на себя. Научись замечать собственное состояние с той же внимательностью с которой замечаешь чужое — это не эгоизм, это устойчивость.`, pair: `Тебе важно перед походом найти человека который будет следить за тобой так же как ты следишь за другими. Лучший партнёр — Ведущий с достаточным самосознанием.`, directionSlug: "kayaking", directionName: "Сплавы на байдарках" },
  analyst: { key: "analyst", name: "Аналитик", tagline: "Ты видишь то чего не видят другие — потому что смотришь дольше", icon: <Search className="w-6 h-6" />, color: "text-sky-500", colorDim: "text-sky-500/20", accent: "#0ea5e9", desc: `Там где другие действуют, ты наблюдаешь. Там где другие торопятся, ты ждёшь. Это не нерешительность — это другой способ обработки реальности, и в горах он спасает жизни.\n\nТы замечаешь изменение погоды раньше остальных. Ты помнишь детали маршрута. Ты задаёшь вопросы которые кажутся лишними пока не оказываются ключевыми. Твоя ценность особенно видна в ретроспективе — когда группа понимает что именно твоя осторожность предотвратила проблему.`, blind: `Скорость. Есть ситуации где нужно действовать за секунды, и твой процесс анализа становится роскошью. Стоит заранее выработать личные протоколы для таких моментов — что ты делаешь когда времени думать нет.`, pair: `Лучшее место в группе для тебя — правая рука Ведущего. Ты думаешь, он действует. Вместе вы принимаете решения быстрее и точнее чем любой из вас по отдельности.`, directionSlug: "local", directionName: "Локальные туры" },
  explorer: { key: "explorer", name: "Исследователь", tagline: "Ты идёшь не по маршруту — ты идёшь навстречу неизвестному", icon: <Compass className="w-6 h-6" />, color: "text-violet-500", colorDim: "text-violet-500/20", accent: "#8b5cf6", desc: `Стандартный маршрут для тебя — минимальная программа. Настоящий поход начинается там где план заканчивается. Тебя тянет за следующий перевал, к той точке на карте без названия, к разговору с местным которого никто не заметил.\n\nТы привносишь в группу то что нельзя запланировать — живость, открытость, ощущение что происходит что-то настоящее. Группы с Исследователем возвращаются с историями. Именно ты превращаешь поход из физического упражнения в опыт.`, blind: `Оценка риска. Любопытство может уводить в сторону от безопасного решения. Тебе важен партнёр рядом — Аналитик или Хранитель — который мягко возвращает к реальности когда авантюра становится опасностью.`, pair: `Твоя суперсила раскрывается в многодневных походах где есть пространство для отклонений. Лучший партнёр — Аналитик: он не гасит твой порыв, но задаёт правильные вопросы.`, directionSlug: "hiking", directionName: "Горы и Походы" },
  soloist: { key: "soloist", name: "Одиночка", tagline: "Тебе не нужна тишина от людей — тебе нужна тишина для себя", icon: <TreePine className="w-6 h-6" />, color: "text-slate-400", colorDim: "text-slate-400/20", accent: "#94a3b8", desc: `Это не про интроверсию в бытовом смысле. В походе ты полноценный участник — разговариваешь, помогаешь, присутствуешь. Но ты знаешь: если провести слишком долго в плотном групповом режиме без паузы, что-то внутри начинает садиться как телефон.\n\nОдиночество для тебя — не изоляция, а зарядка. Именно в тишине ты обрабатываешь опыт, принимаешь решения и понимаешь зачем ты вообще здесь. Твоя наблюдательность и глубина восприятия — прямое следствие этой потребности.`, blind: `Группа может воспринимать твою потребность в пространстве как холодность или недовольство. Стоит говорить об этом заранее — «мне нужно время в тишине, это не про вас». Одна фраза снимает много напряжения.`, pair: `Лучший формат для тебя — небольшие группы с культурой уважения к личному ритму. Идеальный партнёр — Хранитель: он понимает людей и не давит.`, directionSlug: "sup", directionName: "SUP-прогулки" },
  adapter: { key: "adapter", name: "Адаптер", tagline: "Ты не ищешь свою роль — ты занимаешь нужную", icon: <Zap className="w-6 h-6" />, color: "text-rose-500", colorDim: "text-rose-500/20", accent: "#f43f5e", desc: `Это самый редкий и самый ценный тип в походной команде. Ты не привязан к одной роли — ты читаешь ситуацию и становишься тем кто сейчас нужен. Когда лидера нет — берёшь управление. Когда кому-то плохо — становишься Хранителем. Когда нужна пауза — даёшь группе воздух.\n\nЭто требует высокого самосознания и отсутствия эго привязанного к конкретной роли. Не все на это способны. Ты — клей который удерживает разные личности в одной команде.`, blind: `Тебя сложно «прочитать» — и это иногда создаёт недоверие. Люди любят понимать на кого они могут рассчитывать и в каком качестве. Иногда полезно явно назвать свою роль в конкретный момент — даже если для тебя это очевидно.`, pair: `Ты особенно ценен в смешанных группах где нужен баланс между сильными личностями. Лучшее место — между Ведущим и Аналитиком.`, directionSlug: "kayaking", directionName: "Сплавы на байдарках" },
};

const SCALE_LABELS = ["Совсем не про меня", "Скорее нет", "Нейтрально", "Скорее да", "Полностью про меня"];
const TOTAL = STATEMENTS.length;

function calcScores(answers: Record<number, number>): Record<TypeKey, number> {
  const scores: Record<TypeKey, number> = { leader: 0, keeper: 0, analyst: 0, explorer: 0, soloist: 0, adapter: 0 };
  STATEMENTS.forEach((s) => { scores[s.type] += answers[s.id] ?? 0; });
  return scores;
}

function getPrimarySecondary(scores: Record<TypeKey, number>): [TypeKey, TypeKey | null] {
  const sorted = (Object.entries(scores) as [TypeKey, number][]).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];
  const secondary = sorted[1][1] >= sorted[0][1] - 2 ? sorted[1][0] : null;
  return [primary, secondary];
}

const ScoreBar = ({ typeKey, score, max = 20 }: { typeKey: TypeKey; score: number; max?: number }) => {
  const t = TYPES[typeKey];
  const pct = (score / max) * 100;
  return (
    <div className="flex items-center gap-4">
      <div className={cn("w-24 text-right font-bold text-xs uppercase tracking-wider shrink-0", t.color)}>{t.name}</div>
      <div className="flex-1 h-[4px] rounded-full bg-slate-800 relative overflow-hidden">
        <motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: t.accent }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }} />
      </div>
      <div className="text-slate-500 font-bold text-xs w-8 shrink-0">{score}</div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PsychProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { updateProfile } = useProfile();
  const { saveResult } = useSaveTest();
  
  const [step, setStep] = useState<Step>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  const answered = Object.keys(answers).length;
  const progressPct = (answered / TOTAL) * 100;
  const currentStatement = STATEMENTS[current];
  const currentAnswer = answers[currentStatement?.id];

  const scores = calcScores(answers);
  const [primary, secondary] = getPrimarySecondary(scores);
  const primaryType = TYPES[primary];
  const secondaryType = secondary ? TYPES[secondary] : null;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedValue === null) return;
    const timer = setTimeout(() => {
      const next = { ...answers, [currentStatement.id]: selectedValue };
      setAnswers(next);
      setSelectedValue(null);
      
      if (current + 1 >= TOTAL) {
        setStep("result");
        const finalScores = calcScores(next);
        
        const [finalPrimary, finalSecondary] = getPrimarySecondary(finalScores);
        
        let typeString = `Основной тип: ${TYPES[finalPrimary].name}`;
        if (finalSecondary) {
            typeString += `. Скрытый резерв: ${TYPES[finalSecondary].name}`;
        }
        
        updateProfile({ touristType: typeString });
        incrementFunTestPassAction('psych-profile').catch(console.error);

        // Сохранение в БД
        saveResult('psych-profile', {
          type: TYPES[finalPrimary].name,
          badge: "🧠",
          description: TYPES[finalPrimary].tagline,
          score: finalScores
        });

      } else {
        setCurrent((c) => c + 1);
      }
    }, 380);
    return () => clearTimeout(timer);
  }, [selectedValue, current, answers]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden max-h-[90dvh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Bar Header */}
          {step === "test" && (
            <motion.div className="absolute top-0 left-0 h-1.5 z-50 bg-gradient-to-r from-purple-500 to-indigo-500" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
          )}

          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 z-50 p-3 text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            
            {/* ══════════════════════════════ INTRO ══════════════════════════════ */}
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-6 md:p-10"
              >
                <div className="flex-1 flex flex-col justify-center items-center text-center pb-8">
                  <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mb-6 border border-purple-500/20">
                    <Brain size={32} />
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight leading-tight">
                    Кто ты<br /><span className="text-purple-400">в горах?</span>
                  </h1>

                  <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed mb-10 max-w-md">
                    Тест основан на психологии групповой динамики. Нет правильных и неправильных ответов — только честные.
                  </p>

                  <div className="w-full max-w-md mb-10 rounded-2xl border border-white/5 bg-slate-800/50 overflow-hidden text-left">
                    {[
                      { icon: <BarChart2 size={16} />, label: "24 утверждения", sub: "Оцени каждое по шкале от 1 до 5" },
                      { icon: <Clock size={16} />, label: "5–7 минут", sub: "Отвечай первым ощущением" },
                      { icon: <Sparkles size={16} />, label: "6 психотипов", sub: "Ведущий, Хранитель, Аналитик и другие" },
                      { icon: <CheckCircle2 size={16} />, label: "Без правильных ответов", sub: "Результат сохранится в профиле" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-0">
                        <div className="mt-0.5 text-slate-500 shrink-0">{item.icon}</div>
                        <div>
                          <p className="text-slate-200 text-sm font-bold leading-tight mb-1">{item.label}</p>
                          <p className="text-slate-500 text-xs leading-snug font-medium">{item.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => setStep("instruction")}
                    className="w-full inline-flex justify-center items-center gap-3 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest text-sm px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-purple-600/20 active:scale-[0.98]"
                  >
                    <BookOpen size={18} /> Начать тест <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════ INSTRUCTION ══════════════════════════════ */}
            {step === "instruction" && (
              <motion.div
                key="instruction"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-6 md:p-10"
              >
                <div className="flex-1 flex flex-col justify-center pb-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-teal-400 mb-4">
                      <BookOpen size={24} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">Как отвечать?</h2>
                    <p className="text-slate-400 text-sm font-medium">Оценивай утверждения по своим первым ощущениям, используя эту шкалу:</p>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      { val: 1, title: "Совсем не про меня", desc: "Вообще не моя история, я так никогда не делаю" },
                      { val: 2, title: "Скорее нет", desc: "Редко, но иногда бывает" },
                      { val: 3, title: "Нейтрально", desc: "50/50, всё зависит от конкретной ситуации" },
                      { val: 4, title: "Скорее да", desc: "Часто так делаю, это похоже на меня" },
                      { val: 5, title: "Полностью про меня", desc: "Абсолютно в точку, это мой стиль!" },
                    ].map((item) => (
                      <div key={item.val} className="flex items-center gap-4 bg-slate-800/50 border border-white/5 rounded-2xl p-4">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-900 text-white text-lg flex items-center justify-center font-black shadow-inner">
                          {item.val}
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold uppercase tracking-wider mb-1 leading-tight">{item.title}</p>
                          <p className="text-slate-500 text-xs font-medium leading-snug">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => setStep("test")}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)] active:scale-[0.98]"
                  >
                    Всё понятно, погнали!
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════ TEST ═══════════════════════════════ */}
            {step === "test" && currentStatement && (
              <motion.div
                key={`s-${current}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col h-full overflow-hidden p-6 md:p-10"
              >
                <div className="shrink-0 flex items-center justify-between mb-8 pr-12">
                  <span className="font-bold text-xs text-slate-500 uppercase tracking-widest">
                    Вопрос {current + 1} / {TOTAL}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center overflow-y-auto custom-scrollbar pb-4">
                  <p className="text-white text-2xl md:text-3xl font-black leading-tight mb-10 text-center tracking-tight">
                    {currentStatement.text}
                  </p>

                  <div className="max-w-md mx-auto w-full">
                    <div className="flex gap-2 sm:gap-3 justify-between mb-4">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const isSelected = (selectedValue ?? currentAnswer) === val;
                        return (
                          <button
                            key={val}
                            onClick={() => !selectedValue && setSelectedValue(val)}
                            disabled={selectedValue !== null}
                            className={clsx(
                              "flex-1 h-14 sm:h-16 flex flex-col items-center justify-center rounded-2xl border transition-all duration-200",
                              isSelected
                                ? "border-teal-500 bg-teal-500 text-slate-900 scale-105 shadow-[0_0_15px_rgba(20,184,166,0.4)]"
                                : "border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-white/20 text-slate-400"
                            )}
                          >
                            <span className="text-lg font-black">{val}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between px-1">
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-tight max-w-[90px]">
                        {SCALE_LABELS[0]}
                      </span>
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-tight max-w-[90px] text-right">
                        {SCALE_LABELS[4]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-4 border-t border-transparent h-12">
                  <button
                    onClick={() => current > 0 && setCurrent(c => c - 1)}
                    disabled={current === 0 || selectedValue !== null}
                    className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-0 transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    <ChevronLeft size={16} /> Назад
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════ RESULT ═════════════════════════════ */}
            {step === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-4">
                  <div className="text-center mb-10 relative">
                    <div className={clsx("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[60px] rounded-full pointer-events-none opacity-30", primaryType.color.replace('text-', 'bg-'))} />
                    
                    <div className={clsx("inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-2xl relative z-10 border border-white/10", primaryType.colorDim.replace('text-', 'bg-'))}>
                      <div className={primaryType.color}>
                        {primaryType.icon}
                      </div>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-2 relative z-10">
                      {primaryType.name}
                    </h2>
                    <p className={clsx("text-sm font-bold uppercase tracking-widest relative z-10", primaryType.color)}>
                      «{primaryType.tagline}»
                    </p>
                  </div>
                  
                  <div className="mb-8 bg-slate-800/30 p-6 rounded-2xl border border-white/5">
                    <p className="text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-line">
                      {primaryType.desc}
                    </p>
                  </div>
                  
                  {/* Слепое пятно */}
                  <div className="border-l-2 pl-5 mb-6" style={{ borderColor: primaryType.accent }}>
                    <p className={clsx("font-bold text-xs uppercase tracking-widest mb-2", primaryType.color)}>Точка роста</p>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">{primaryType.blind}</p>
                  </div>

                  {/* Идеальный напарник */}
                  <div className="border-l-2 pl-5 mb-8" style={{ borderColor: primaryType.accent }}>
                    <p className={clsx("font-bold text-xs uppercase tracking-widest mb-2", primaryType.color)}>В связке</p>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">{primaryType.pair}</p>
                  </div>

                  {/* Вторичный тип */}
                  {secondaryType && (
                     <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 mb-8 flex items-center gap-4 shadow-inner">
                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10", secondaryType.colorDim.replace('text-', 'bg-'), secondaryType.color)}>
                           {secondaryType.icon}
                        </div>
                        <div>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Скрытый резерв</p>
                           <p className="text-sm text-slate-300 font-medium leading-snug">В критических ситуациях в тебе просыпается <strong className={secondaryType.color}>{secondaryType.name}</strong>.</p>
                        </div>
                     </div>
                  )}

                  <div className="mb-6 mt-6">
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mb-5 border-b border-white/5 pb-2">Все архетипы</p>
                    <div className="space-y-3">
                      {(Object.entries(scores) as [TypeKey, number][]).sort((a, b) => b[1] - a[1]).map(([key, score]) => (
                        <ScoreBar key={key} typeKey={key} score={score} />
                      ))}
                    </div>
                  </div>

                  {/* SMART CTA */}
                  <div className="pt-8 mt-6 border-t border-white/10 text-center">
                    <p className={clsx("text-[10px] font-bold uppercase tracking-widest mb-1", primaryType.color)}>
                      Мы рекомендуем Вам
                    </p>
                    <h3 className={clsx("text-2xl md:text-3xl font-black uppercase tracking-tight mb-6", primaryType.color)}>
                      {primaryType.directionName}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <Link
                        href={`/directions/${primaryType.directionSlug}`}
                        onClick={onClose}
                        className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all text-center flex items-center justify-center gap-2"
                      >
                        <Compass size={16} /> О направлении
                      </Link>
                      <Link
                        href={`/tour?category=${primaryType.directionSlug}`}
                        onClick={onClose}
                        className="flex-1 py-4 rounded-xl text-slate-900 font-bold text-[11px] uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 shadow-lg hover:brightness-110"
                        style={{ backgroundColor: primaryType.accent }}
                      >
                        Выбрать маршрут <ArrowRight size={16} />
                      </Link>
                    </div>

                    <button
                      onClick={() => { setStep("intro"); setCurrent(0); setAnswers({}); setSelectedValue(null); }}
                      className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                      <RotateCcw size={14} /> Пройти заново
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}