"use client";

import { useState, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft, RotateCcw, Mountain, Users, Search, 
  Compass, TreePine, Zap, ArrowRight, BookOpen, X,
  Clock, BarChart2, Sparkles, CheckCircle2
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { incrementFunTestPassAction } from "@/features/admin/actions/fun";

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
  leader: { key: "leader", name: "Ведущий", tagline: "Ты не ждёшь когда станет ясно — ты делаешь ясно", icon: <Mountain className="w-6 h-6" />, color: "text-amber-400", colorDim: "text-amber-400/40", accent: "#f59e0b", desc: `В походе ты становишься заметным не потому что хочешь власти, а потому что не можешь иначе. Когда группа останавливается в замешательстве, ты уже смотришь на карту. Когда погода меняется — ты первым говоришь вслух что делать дальше.\n\nТвоя сила в том, что неопределённость тебя не парализует — она тебя активирует. Именно такие люди удерживают группу от паники в критические моменты. Ты не обязательно идёшь первым физически — ты первым берёшь на себя ответственность за решение.`, blind: `Ты можешь принять решение раньше чем выслушал всех. В долгих походах это создаёт напряжение — люди чувствуют что их не слышат. Лучший Ведущий тот, кто научился делать паузу перед действием. Две минуты внимания к группе меняют всё.`, pair: `В паре с Аналитиком вы непобедимы — ты действуешь, он думает. В паре с другим Ведущим стоит заранее договориться кто ведёт на каком участке.`, directionSlug: "hiking", directionName: "Горы" },
  keeper: { key: "keeper", name: "Хранитель", tagline: "Без тебя группа дойдёт до вершины. С тобой — вернётся командой", icon: <Users className="w-6 h-6" />, color: "text-emerald-400", colorDim: "text-emerald-400/40", accent: "#34d399", desc: `Ты видишь людей. Не маршрут, не погоду, не высоту — людей. Ты замечаешь что Маша молчит уже час, что у Антона изменилась походка, что общая энергия группы падает раньше чем кто-то это признает.\n\nЭто редкий и недооценённый талант. Группы без Хранителя технически доходят до цели — но рассыпаются по дороге или после. Именно ты создаёшь то что потом называют «атмосферой» или «химией группы» — хотя сам этого не замечаешь.`, blind: `Ты отдаёшь больше чем берёшь. К концу сложного похода у тебя может не остаться ресурса на себя. Научись замечать собственное состояние с той же внимательностью с которой замечаешь чужое — это не эгоизм, это устойчивость.`, pair: `Тебе важно перед походом найти человека который будет следить за тобой так же как ты следишь за другими. Лучший партнёр — Ведущий с достаточным самосознанием.`, directionSlug: "kayaking", directionName: "Сплавы" },
  analyst: { key: "analyst", name: "Аналитик", tagline: "Ты видишь то чего не видят другие — потому что смотришь дольше", icon: <Search className="w-6 h-6" />, color: "text-sky-400", colorDim: "text-sky-400/40", accent: "#38bdf8", desc: `Там где другие действуют, ты наблюдаешь. Там где другие торопятся, ты ждёшь. Это не нерешительность — это другой способ обработки реальности, и в горах он спасает жизни.\n\nТы замечаешь изменение погоды раньше остальных. Ты помнишь детали маршрута. Ты задаёшь вопросы которые кажутся лишними пока не оказываются ключевыми. Твоя ценность особенно видна в ретроспективе — когда группа понимает что именно твоя осторожность предотвратила проблему.`, blind: `Скорость. Есть ситуации где нужно действовать за секунды, и твой процесс анализа становится роскошью. Стоит заранее выработать личные протоколы для таких моментов — что ты делаешь когда времени думать нет.`, pair: `Лучшее место в группе для тебя — правая рука Ведущего. Ты думаешь, он действует. Вместе вы принимаете решения быстрее и точнее чем любой из вас по отдельности.`, directionSlug: "local", directionName: "Локальные выезды" },
  explorer: { key: "explorer", name: "Исследователь", tagline: "Ты идёшь не по маршруту — ты идёшь навстречу неизвестному", icon: <Compass className="w-6 h-6" />, color: "text-violet-400", colorDim: "text-violet-400/40", accent: "#a78bfa", desc: `Стандартный маршрут для тебя — минимальная программа. Настоящий поход начинается там где план заканчивается. Тебя тянет за следующий перевал, к той точке на карте без названия, к разговору с местным которого никто не заметил.\n\nТы привносишь в группу то что нельзя запланировать — живость, открытость, ощущение что происходит что-то настоящее. Группы с Исследователем возвращаются с историями. Именно ты превращаешь поход из физического упражнения в опыт.`, blind: `Оценка риска. Любопытство может уводить в сторону от безопасного решения. Тебе важен партнёр рядом — Аналитик или Хранитель — который мягко возвращает к реальности когда авантюра становится опасностью.`, pair: `Твоя суперсила раскрывается в многодневных походах где есть пространство для отклонений. Лучший партнёр — Аналитик: он не гасит твой порыв, но задаёт правильные вопросы.`, directionSlug: "hiking", directionName: "Горы" },
  soloist: { key: "soloist", name: "Одиночка", tagline: "Тебе не нужна тишина от людей — тебе нужна тишина для себя", icon: <TreePine className="w-6 h-6" />, color: "text-stone-300", colorDim: "text-stone-400/40", accent: "#d6d3d1", desc: `Это не про интроверсию в бытовом смысле. В походе ты полноценный участник — разговариваешь, помогаешь, присутствуешь. Но ты знаешь: если провести слишком долго в плотном групповом режиме без паузы, что-то внутри начинает садиться как телефон.\n\nОдиночество для тебя — не изоляция, а зарядка. Именно в тишине ты обрабатываешь опыт, принимаешь решения и понимаешь зачем ты вообще здесь. Твоя наблюдательность и глубина восприятия — прямое следствие этой потребности.`, blind: `Группа может воспринимать твою потребность в пространстве как холодность или недовольство. Стоит говорить об этом заранее — «мне нужно время в тишине, это не про вас». Одна фраза снимает много напряжения.`, pair: `Лучший формат для тебя — небольшие группы с культурой уважения к личному ритму. Идеальный партнёр — Хранитель: он понимает людей и не давит.`, directionSlug: "sup", directionName: "SUP-прогулки" },
  adapter: { key: "adapter", name: "Адаптер", tagline: "Ты не ищешь свою роль — ты занимаешь нужную", icon: <Zap className="w-6 h-6" />, color: "text-rose-400", colorDim: "text-rose-400/40", accent: "#fb7185", desc: `Это самый редкий и самый ценный тип в походной команде. Ты не привязан к одной роли — ты читаешь ситуацию и становишься тем кто сейчас нужен. Когда лидера нет — берёшь управление. Когда кому-то плохо — становишься Хранителем. Когда нужна пауза — даёшь группе воздух.\n\nЭто требует высокого самосознания и отсутствия эго привязанного к конкретной роли. Не все на это способны. Ты — клей который удерживает разные личности в одной команде.`, blind: `Тебя сложно «прочитать» — и это иногда создаёт недоверие. Люди любят понимать на кого они могут рассчитывать и в каком качестве. Иногда полезно явно назвать свою роль в конкретный момент — даже если для тебя это очевидно.`, pair: `Ты особенно ценен в смешанных группах где нужен баланс между сильными личностями. Лучшее место — между Ведущим и Аналитиком.`, directionSlug: "kayaking", directionName: "Сплавы" },
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
      <div className={`w-24 text-right font-mono text-xs ${t.color} uppercase tracking-wider shrink-0`}>{t.name}</div>
      <div className="flex-1 h-[2px] bg-white/5 relative">
        <motion.div className="absolute left-0 top-0 h-full" style={{ background: t.accent }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }} />
      </div>
      <div className="text-white/30 font-mono text-xs w-8 shrink-0">{score}</div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PsychProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { updateProfile } = useProfile();
  
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
    if (selectedValue === null) return;
    const timer = setTimeout(() => {
      const next = { ...answers, [currentStatement.id]: selectedValue };
      setAnswers(next);
      setSelectedValue(null);
      
      if (current + 1 >= TOTAL) {
        setStep("result");
        const finalScores = calcScores(next);
        
        // 👇 1. ДОСТАЕМ И ОСНОВНОЙ, И ВТОРИЧНЫЙ ТИПЫ
        const [finalPrimary, finalSecondary] = getPrimarySecondary(finalScores);
        
        // 👇 2. ФОРМИРУЕМ УМНУЮ СТРОКУ ДЛЯ ИИ
        let typeString = `Основной тип: ${TYPES[finalPrimary].name}`;
        if (finalSecondary) {
            typeString += `. Скрытый резерв: ${TYPES[finalSecondary].name}`;
        }
        
        // 👇 3. СОХРАНЯЕМ ПОЛНУЮ КАРТИНУ
        updateProfile({ touristType: typeString });
        incrementFunTestPassAction('psych-profile').catch(console.error);
      } else {
        setCurrent((c) => c + 1);
      }
    }, 380);
    return () => clearTimeout(timer);
  }, [selectedValue, current, answers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto" style={{ background: "#0d0d12" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .font-spectral { font-family: 'Spectral', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 z-50 p-2 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
      >
        <X size={24} />
      </button>

      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none fixed">
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px" }} />
        <div className="absolute top-0 left-1/3 w-px h-full opacity-[0.04]" style={{ background: "linear-gradient(to bottom, transparent, #fff, transparent)" }} />
        <div className="absolute top-0 right-1/3 w-px h-full opacity-[0.03]" style={{ background: "linear-gradient(to bottom, transparent, #fff, transparent)" }} />
      </div>

      {step === "test" && (
        <motion.div className="fixed top-0 left-0 h-[2px] z-50" style={{ background: "linear-gradient(90deg, #f59e0b, #a78bfa)" }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
      )}

      <div className="relative z-10 min-h-screen flex flex-col font-body">
        <AnimatePresence mode="wait">
          
          {/* ══════════════════════════════ INTRO ══════════════════════════════ */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="flex-1 flex flex-col justify-center items-center px-6 py-16 max-w-2xl mx-auto w-full"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-spectral text-center text-4xl sm:text-5xl md:text-6xl font-light text-white mb-4 leading-[1.15]"
              >
                Кто ты<br /><em className="not-italic" style={{ color: "#a78bfa" }}>в горах?</em>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-white/40 text-center text-sm sm:text-base leading-relaxed mb-10 max-w-md"
              >
                Тест основан на психологии групповой динамики. Нет правильных и неправильных ответов — только честные.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-md mb-10 rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden"
              >
                {[
                  {
                    icon: <BarChart2 className="w-4 h-4" />,
                    label: "24 утверждения",
                    sub: "Оцени каждое по шкале от 1 до 5"
                  },
                  {
                    icon: <Clock className="w-4 h-4" />,
                    label: "5–7 минут",
                    sub: "Отвечай первым ощущением, не думай долго"
                  },
                  {
                    icon: <Sparkles className="w-4 h-4" />,
                    label: "6 психотипов",
                    sub: "Ведущий, Хранитель, Аналитик, Исследователь, Одиночка, Адаптер"
                  },
                  {
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    label: "Без правильных ответов",
                    sub: "Результат сохранится в твоём профиле участника"
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.08 }}
                    className="flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-0"
                  >
                    <div className="mt-0.5 text-white/30 shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{item.label}</p>
                      <p className="text-white/35 text-xs mt-0.5 leading-relaxed">{item.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.button
              onClick={() => setStep("instruction")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/8 text-white/80 hover:text-white font-light text-sm sm:text-base px-8 py-4 rounded-full transition-all duration-300"
              >
                <BookOpen className="w-4 h-4 opacity-60" /> Начать тест <ArrowRight className="w-4 h-4 opacity-60" />
              </motion.button>
            </motion.div>
          )}
{/* ══════════════════════════════ INSTRUCTION ══════════════════════════════ */}
          {step === "instruction" && (
            <motion.div
              key="instruction"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 flex flex-col justify-center px-6 py-12 max-w-xl mx-auto w-full"
            >
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-teal-400 mb-4">
                  <BookOpen size={24} />
                </div>
                <h2 className="font-spectral text-3xl sm:text-4xl font-light text-white mb-3">Как отвечать?</h2>
                <p className="text-white/40 text-sm sm:text-base">Оценивай утверждения по своим первым ощущениям, используя эту шкалу:</p>
              </div>

              <div className="space-y-3 mb-12">
                {[
                  { val: 1, title: "Совсем не про меня", desc: "Вообще не моя история, я так никогда не делаю" },
                  { val: 2, title: "Скорее нет", desc: "Редко, но иногда бывает" },
                  { val: 3, title: "Нейтрально", desc: "50/50, всё зависит от конкретной ситуации" },
                  { val: 4, title: "Скорее да", desc: "Часто так делаю, это похоже на меня" },
                  { val: 5, title: "Полностью про меня", desc: "Абсолютно в точку, это мой стиль!" },
                ].map((item, i) => (
                  <motion.div 
                    key={item.val}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white/10 text-white font-mono text-lg flex items-center justify-center font-light">
                      {item.val}
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-bold uppercase tracking-wider mb-0.5">{item.title}</p>
                      <p className="text-white/40 text-xs">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                onClick={() => setStep("test")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm uppercase tracking-widest py-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(13,148,136,0.3)]"
              >
                Всё понятно, погнали!
              </motion.button>
            </motion.div>
          )}
          {/* ══════════════════════════════ TEST ═══════════════════════════════ */}
          {step === "test" && currentStatement && (
            <motion.div
              key={`s-${current}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="flex-1 flex flex-col justify-center px-6 py-12 max-w-2xl mx-auto w-full"
            >
              <div className="flex items-center justify-between mb-10">
                <button
                  onClick={() => current > 0 && setCurrent(c => c - 1)}
                  disabled={current === 0}
                  className="flex items-center gap-1.5 text-white/20 hover:text-white/50 disabled:opacity-0 transition-colors text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Назад
                </button>
                <span className="font-mono text-xs text-white/40 tracking-[0.2em]">{current + 1} / {TOTAL}</span>
              </div>

              <motion.p
                className="text-white/90 text-xl sm:text-2xl md:text-3xl font-light leading-relaxed mb-10 font-spectral"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                {currentStatement.text}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
              >
                {/* Кнопки шкалы */}
                <div className="flex gap-2 sm:gap-3 justify-between mb-3">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const isSelected = (selectedValue ?? currentAnswer) === val;
                    return (
                      <motion.button
                        key={val}
                        onClick={() => !selectedValue && setSelectedValue(val)}
                        disabled={selectedValue !== null}
                        whileHover={!selectedValue ? { scale: 1.08, y: -2 } : {}}
                        whileTap={!selectedValue ? { scale: 0.94 } : {}}
                        className={`flex-1 h-14 sm:h-16 flex flex-col items-center justify-center rounded-2xl border transition-all duration-200 ${
                          isSelected
                            ? "border-white/50 bg-white/15 scale-105"
                            : "border-white/8 bg-white/[0.03] hover:border-white/20"
                        }`}
                      >
                        <span className={`font-mono text-lg font-light ${isSelected ? "text-white" : "text-white/30"}`}>
                          {val}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex justify-between px-1">
                  <span className="text-white/25 text-[10px] leading-tight max-w-[90px]">
                    {SCALE_LABELS[0]}
                  </span>
                  <span className="text-white/25 text-[10px] leading-tight max-w-[90px] text-right">
                    {SCALE_LABELS[4]}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ══════════════════════════════ RESULT ═════════════════════════════ */}
          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 flex flex-col px-6 py-12 max-w-2xl mx-auto w-full pb-20"
            >
              <div className="text-center mb-12">
                <div className={`inline-flex items-center gap-2 mb-3 ${primaryType.color}`}>
                  {primaryType.icon}
                  <h2 className="font-spectral text-4xl sm:text-5xl font-light">{primaryType.name}</h2>
                </div>
                <p className={`text-sm sm:text-base font-normal italic ${primaryType.color} opacity-70 mb-3 font-spectral`}>«{primaryType.tagline}»</p>
              </div>
              
              <div className="mb-10">
                <p className="text-white/55 text-sm sm:text-base leading-relaxed whitespace-pre-line font-spectral font-normal">
                  {primaryType.desc}
                </p>
              </div>
              
              {/* Слепое пятно */}
              <div className="border-l-2 pl-5 mb-6" style={{ borderColor: primaryType.accent + "40" }}>
                <p className={`font-mono text-xs uppercase tracking-widest mb-2 ${primaryType.color} opacity-50`}>Слепое пятно</p>
                <p className="text-white/60 text-sm leading-relaxed font-spectral font-normal">{primaryType.blind}</p>
              </div>

              {/* Идеальный напарник */}
              <div className="border-l-2 pl-5 mb-8" style={{ borderColor: primaryType.accent + "40" }}>
                <p className={`font-mono text-xs uppercase tracking-widest mb-2 ${primaryType.color} opacity-50`}>В связке</p>
                <p className="text-white/60 text-sm leading-relaxed font-spectral font-normal">{primaryType.pair}</p>
              </div>

              {/* Вторичный тип */}
              {secondaryType && (
                 <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-8 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 shrink-0 ${secondaryType.color}`}>
                       {secondaryType.icon}
                    </div>
                    <div>
                       <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-1">Скрытый резерв</p>
                       <p className="text-sm text-white/80 font-spectral leading-snug">В критических ситуациях в тебе просыпается <strong className={secondaryType.color}>{secondaryType.name}</strong>.</p>
                    </div>
                 </div>
              )}

              <div className="mb-10 mt-6">
                <p className="font-mono text-xs text-white/40 uppercase tracking-widest mb-5">Все типы</p>
                <div className="space-y-4">
                  {(Object.entries(scores) as [TypeKey, number][]).sort((a, b) => b[1] - a[1]).map(([key, score]) => (
                    <ScoreBar key={key} typeKey={key} score={score} />
                  ))}
                </div>
              </div>

              {/* Смарт-кнопки перехода к турам (Hard & Soft CTA) */}
              <div className="shrink-0 pt-8 mt-2 border-t border-white/10">
                <p className="text-center text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Твоя стихия ждет</p>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
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

                {/* Системные действия */}
                <div className="flex flex-col items-center gap-6">
                  <button
                    onClick={onClose}
                    className="bg-white/5 hover:bg-white/10 text-white px-8 py-3.5 rounded-full text-sm font-medium transition-colors w-full sm:w-auto"
                  >
                    Закрыть и сохранить в профиль
                  </button>
                  <button
                    onClick={() => { setStep("intro"); setCurrent(0); setAnswers({}); setSelectedValue(null); }}
                    className="inline-flex items-center gap-2 text-white/20 hover:text-white/50 text-sm transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Пройти заново
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}