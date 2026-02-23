"use client";

import { motion } from "framer-motion";
import { 
  Users, CheckCircle2, Waves, Heart, 
  LifeBuoy, Zap, Sparkles, 
  Megaphone, Anchor, BriefcaseMedical
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- ДАННЫЕ ДЛЯ ОСНОВНОЙ СЕТКИ СТРАХОВ ---
const mainBenefits = [
  {
    id: 1,
    title: "Сплавы по Днестру с ТК «Эва»",
    desc: "Это не только физическая активность, но и идеальный способ провести время с семьёй или друзьями на природе, наслаждаясь её красотами.",
    icon: Waves,
    tag: "Турклуб Эва",
    desktopClass: "md:col-span-2 lg:col-span-6 bg-gradient-to-br from-teal-900/40 to-slate-900 border-teal-500/30",
    isCompactOnMobile: false,
  },
  {
    id: 2,
    title: "Всё продумано до мелочей",
    desc: "Комфорт в деталях — от посадки до хранения ваших вещей в лодке.",
    icon: CheckCircle2,
    features: ["Продуманная логистика", "Удобные мягкие сидушки", "Места для багажа", "Гермомешки для гаджетов (опционально по  запросу"],
    desktopClass: "md:col-span-2 lg:col-span-6",
    isCompactOnMobile: false,
  },
  {
    id: 3,
    title: "Можно с детьми",
    desc: "Спокойные воды и надежные байдарки делают сплав доступным для самых маленьких. От двух лет",
    icon: Users,
    desktopClass: "md:col-span-1 lg:col-span-3",
    isCompactOnMobile: true,
  },
  {
    id: 4,
    title: "Никогда не гребли?",
    desc: "60 % наших гостей — новички. Обучим азам за 15 минут до старта. Подскажем на воде",
    icon: Zap,
    desktopClass: "md:col-span-1 lg:col-span-3 border-orange-500/20 bg-orange-500/5",
    isCompactOnMobile: true,
  },
  {
    id: 5,
    title: "Нужна перезагрузка?",
    desc: "Тишина реки и мерный плеск весла — лучший детокс от суеты.",
    icon: Heart,
    desktopClass: "md:col-span-1 lg:col-span-3 border-pink-500/20 bg-pink-500/5",
    isCompactOnMobile: true,
  },
  {
    id: 6,
    title: "Не умеете плавать?",
    desc: "Наши жилеты держат надежно. У нас есть детские жилеты, размемы от XS до 5 XL и универальные жилеты. Безопасность — приоритет №1.",
    icon: LifeBuoy,
    desktopClass: "md:col-span-1 lg:col-span-3",
    isCompactOnMobile: true,
  }
];

// --- ДАННЫЕ ДЛЯ РОЛИ ИНСТРУКТОРА ---
const instructorRoles = [
    {
        title: "Детальный инструктаж",
        desc: "Перед выходом на воду ставим правильную технику гребли и объясняем правила поведения. Никаких «разберетесь по ходу».",
        icon: Megaphone,
    },
    {
        title: "Помощь на воде",
        desc: "Гид всегда рядом (если от него не уходить). Покажет лучшую траекторию, поможет причалить, а если силы покинут — возьмет на буксир ( но это не точно).",
        icon: Anchor,
    },
    {
        title: "Безопасность и аптечка",
        desc: "У инструктора всегда под рукой стандартная групповая аптечка первой помощи и ремкомплект для непредвиденных ситуаций.",
        icon: BriefcaseMedical,
    }
];

export default function Benefits() {
  return (
    <section className="py-12 md:py-20 bg-[#020617] relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-teal-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* =========================================
            ЧАСТЬ 1: ОСНОВНЫЕ СТРАХИ И БЕНЕФИТЫ
            ========================================= */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
                <Sparkles size={14} className="text-teal-400" />
                <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">Почему мы</span>
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter mb-4 leading-[0.9]">
              Идеальный отдых <br className="hidden md:block" />
              <span className="text-teal-500">на воде</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl">
              Мы берем на себя всю рутину, логистику и безопасность. Вам остается только грести, загорать и наслаждаться видами.
            </p>
          </motion.div>
        </div>

        {/* Сетка Bento (Десктоп) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-12 gap-5 auto-rows-[minmax(200px,auto)] mb-20">
          {mainBenefits.map((item, idx) => (
            <BenefitCard key={item.id} item={item} idx={idx} isDesktop />
          ))}
        </div>

        {/* Гибридный свайп (Мобайл) */}
        <div className="flex flex-col md:hidden gap-4 mb-16">
            <BenefitCard item={mainBenefits[0]} idx={0} />
            <BenefitCard item={mainBenefits[1]} idx={1} />
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {mainBenefits.slice(2, 6).map((item, idx) => (
                    <BenefitCard key={item.id} item={item} idx={idx + 2} isSwipeable />
                ))}
            </div>
        </div>

        {/* =========================================
            ЧАСТЬ 2: АКЦЕНТ НА ИНСТРУКТОРА
            ========================================= */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-12 md:pt-16 border-t border-white/10"
        >
            <div className="text-left mb-10">
                <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
                    Надежный тыл: <br className="md:hidden" /><span className="text-amber-500">Профи на борту</span>
                </h3>
                <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl mx-auto md:mx-0">
                    Ваш поход сопровождает инструктор. Он берет на себя все технические вопросы, чтобы вы могли просто расслабиться (если получится).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {instructorRoles.map((role, idx) => {
                    const Icon = role.icon;
                    return (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            // МАГИЯ АДАПТИВА: flex-row на мобильном, flex-col на десктопе
                            className="bg-slate-900/60 border border-white/5 rounded-[2rem] p-5 md:p-8 hover:border-amber-500/30 transition-all duration-300 group flex flex-row items-center md:flex-col md:items-start text-left"
                        >
                            <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mr-4 md:mr-0 md:mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all duration-500">
                                <Icon size={24} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-base md:text-xl font-black text-white uppercase tracking-tight mb-1 md:mb-3 group-hover:text-amber-400 transition-colors leading-tight">
                                    {role.title}
                                </h4>
                                <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed line-clamp-3 md:line-clamp-none">
                                    {role.desc}
                                </p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </motion.div>

      </div>
    </section>
  );
}

// --- ВНУТРЕННИЙ КОМПОНЕНТ КАРТОЧКИ ---
function BenefitCard({ item, idx, isDesktop = false, isSwipeable = false }: any) {
  const Icon = item.icon;
  
  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05, duration: 0.5 }}
        viewport={{ once: true }}
        className={cn(
            "group relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-md shadow-lg transition-all duration-500 hover:border-teal-500/40 hover:bg-slate-900/60 text-left",
            isDesktop ? item.desktopClass : "",
            isSwipeable ? "flex-shrink-0 snap-center w-[85vw] md:w-auto" : "w-full",
            // МАГИЯ АДАПТИВА: flex-row на мобильном, если карточка компактная, иначе flex-col
            !isDesktop && item.isCompactOnMobile 
                ? "flex flex-row items-center p-5" 
                : "flex flex-col justify-between p-6 md:p-8"
        )}
    >
        <div className={cn("flex justify-between items-start shrink-0", !isDesktop && item.isCompactOnMobile ? "mr-4" : "mb-6 md:mb-8")}>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-500 shadow-[0_0_15px_rgba(20,184,166,0)] group-hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            {item.tag && (
                <span className="hidden md:inline-flex text-[14px] font-bold uppercase tracking-widest bg-teal-500/20 text-teal-400 px-3 py-1.5 rounded-lg border border-teal-500/30">
                    {item.tag}
                </span>
            )}
        </div>

        <div className={cn(!isDesktop && item.isCompactOnMobile ? "flex-1" : "")}>
            <h3 className={cn(
                "font-black text-white uppercase tracking-tight leading-tight group-hover:text-teal-300 transition-colors drop-shadow-md",
                !isDesktop && item.isCompactOnMobile ? "text-base mb-1" : "text-xl md:text-3xl mb-3 md:mb-4"
            )}>
                {item.title}
            </h3>
            <p className={cn(
                "text-slate-400 font-medium leading-relaxed",
                !isDesktop && item.isCompactOnMobile ? "text-xs line-clamp-3" : "text-sm md:text-base"
            )}>
                {item.desc}
            </p>
        </div>

        {item.features && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-6 pt-6 border-t border-white/10">
            {item.features.map((feat: string) => (
                <li key={feat} className="flex items-start gap-2 text-[14px] md:text-xs font-bold text-slate-300 uppercase tracking-widest text-left">
                <div className="mt-0.5 shrink-0"><CheckCircle2 size={14} className="text-teal-500" /></div>
                <span>{feat}</span>
                </li>
            ))}
            </ul>
        )}
    </motion.div>
  );
}