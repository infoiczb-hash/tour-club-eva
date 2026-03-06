'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Users, HeartHandshake, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const FEARS = [
    "А вдруг он испугается без родителей?",
    "Безопасно ли отпускать в лес?",
    "Что, если он никого там не знает?"
];

const GUARANTEES = [
    {
        icon: ShieldCheck,
        title: "Безопасность №1",
        desc: "Мы не строим из себя героев, а создаем безопасные условия. Проверенные маршруты, инструкторы с опытом и связь 24/7.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        hover: "group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40"
    },
    {
        icon: Users,
        title: "Малые группы",
        desc: "Мы видим настроение каждого. Внимательно следим за динамикой в отряде, чтобы адаптация прошла мягко и без стресса.",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        hover: "group-hover:bg-amber-500/20 group-hover:border-amber-500/40"
    },
    {
        icon: HeartHandshake,
        title: "Здоровая атмосфера",
        desc: "Никакого буллинга. Только человеческое тепло, поддержка и взаимопомощь. Здесь принято делиться и помогать.",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        hover: "group-hover:bg-blue-500/20 group-hover:border-blue-500/40"
    }
];

export default function KidsParents() {
    return (
        // 🔥 1. Максимально убрали отступ сверху (pt-0), чтобы приклеить к Hero
        <section className="pt-0 pb-12 md:pb-20 bg-slate-950 relative overflow-hidden">
            {/* Фоновое свечение для теплой атмосферы */}
            <div className="absolute top-1/4 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-900/10 md:blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-900/10 md:blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* 🔥 2. ВВОДНЫЙ ТЕКСТ (МАНИФЕСТ) - Уровень Senior GOLD */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 md:mb-24 max-w-4xl text-left"
                >
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter mb-6 md:mb-8 leading-none">
                        Детство должно быть с <br className="hidden md:block"/><span className="text-amber-500"> приключениями</span>
                    </h2>
                    
                    <div className="border-l-4 border-amber-500 pl-5 md:pl-8 py-2">
                        <p className="text-[16px] md:text-2xl font-medium text-slate-400 leading-snug tracking-tight">
                            Детский и подростковый туризм — это возможность расти <span className="text-white font-bold">сильнее и счастливее</span>. Природа учит смелости, любознательности и <span className="text-white font-bold">уважению к другим</span>. Каждый маршрут — маленькое приключение, которое <span className="text-white font-bold">остаётся в памяти навсегда</span>.
                        </p>
                    </div>
                </motion.div>

                {/* 3 и 4. ДВУХКОЛОНОЧНАЯ СЕТКА (Цитата + Страхи) */}
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-stretch mb-16 md:mb-20">
                    
                    {/* Цитата Инструктора */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-6 md:p-8 bg-slate-900/40 backdrop-blur-sm border-l-4 border-emerald-500 rounded-r-[2rem] relative flex flex-col justify-center shadow-xl border-y border-r border-white/5"
                    >
                        <div className="absolute top-4 right-6 text-6xl text-slate-800 font-serif leading-none opacity-50">"</div>
                        
                        <p className="text-[15px] md:text-base text-slate-300 italic font-medium relative z-10 mb-6 md:mb-8 leading-relaxed">
                            Моя задача — не просто научить, а включить. Сделать так, чтобы ребёнок сам захотел — идти, делать, открываться. Из леса мы делаем лагерь, а из веревки — приключение.
                        </p>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-800 rounded-full flex items-center justify-center border border-emerald-500/30 shrink-0 overflow-hidden relative shadow-lg">
                                <span className="text-slate-400 font-bold text-lg">А</span>
                            </div>
                            <div>
                                <div className="font-bold text-white text-base md:text-lg">Алексей</div>
                                <div className="text-emerald-500 text-[11px] md:text-[12px] uppercase font-bold tracking-widest mt-0.5">
                                    Тренер по командообразованию
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Блок со страхами */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col justify-center"
                    >
                        <h3 className="text-3xl md:text-4xl font-black text-white mb-6 uppercase tracking-tighter">
                            Мы знаем ваши <br className="hidden md:block"/><span className="text-emerald-500">Вопросы</span>
                        </h3>
                        
                        <div className="space-y-4 md:space-y-5">
                            {FEARS.map((fear, idx) => (
                                <div key={idx} className="flex items-center gap-4 opacity-80 hover:opacity-100 transition-opacity group">
                                    <div className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-emerald-500 transition-colors shrink-0" />
                                    {/* 🔥 Убрали зачеркивание, оставили чистый читаемый текст */}
                                    <span className="text-[14px] md:text-base text-slate-300 font-medium">
                                        {fear}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>

                {/* 5. ЗАГОЛОВОК "ДЛЯ НАС ВАЖНО" */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-left mb-6 md:mb-8"
                >
                    <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                        Для нас <span className="text-amber-500">важно</span>
                    </h3>
                </motion.div>

                {/* 6. КАРТОЧКИ (Горизонтальный скролл на мобилке, 3 колонки на десктопе) */}
                <div className="relative">
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {GUARANTEES.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="shrink-0 snap-center w-[85vw] md:w-auto p-6 bg-slate-900/40 backdrop-blur-sm rounded-[2rem] border border-white/5 transition-colors flex flex-col gap-5 items-start group hover:bg-slate-900/80 shadow-lg"
                                >
                                    <div className={cn("shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-all duration-300", item.bg, item.border, item.hover)}>
                                        <Icon className={item.color} size={24} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg md:text-xl font-bold text-white mb-2 tracking-tight transition-colors">
                                            {item.title}
                                        </h4>
                                        <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
                                            {item.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Подсказка "Мотай" */}
                    <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
                        <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                        <ChevronRight size={14} />
                    </div>
                </div>

            </div>
        </section>
    );
}