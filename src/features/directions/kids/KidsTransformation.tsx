'use client';

import { m as motion } from 'framer-motion';
import { Flame, Compass, Users, ArrowRight, Smartphone, Frown, User, ChevronRight } from 'lucide-react'; // 🔥 Добавили ChevronRight
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const TRANSFORMATIONS = [
    {
        icon: Flame,
        oldIcon: Smartphone,
        from: "Телефон",
        to: "Костёр",
        desc: "Учатся разжигать огонь, готовить походную еду и говорить, глядя друг другу в глаза.",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20"
    },
    {
        icon: Compass,
        oldIcon: Frown,
        from: "Страх",
        to: "Действие",
        desc: "Первый раз сам принял решение. Первый раз справился без мамы. Невероятная гордость собой.",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20"
    },
    {
        icon: Users,
        oldIcon: User,
        from: "Я Сам",
        to: "Мы Команда",
        desc: "Здесь находят друзей не по количеству лайков, а по тому, кто помог нести рюкзак.",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
    }
];

export default function KidsTransformation() {
    return (
        // 🔥 1. Уплотнили внешние отступы (py-8 md:py-16)
        <section className="py-8 md:py-16 bg-slate-950 relative overflow-hidden">
             <div className="container mx-auto px-4 max-w-6xl relative z-10">
                 
                 {/* 🔥 2. Заголовок: выровняли по левому краю для консистентности */}
                 <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="text-left mb-8 md:mb-12"
                 >
                     <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter">
                        Что <span className="text-amber-500">Меняется?</span>
                     </h2>
                 </motion.div>

                 {/* 🔥 3. ОБЕРТКА ДЛЯ СКРОЛЛА */}
                 <div className="relative">
                     <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                         {TRANSFORMATIONS.map((item, idx) => {
                             const NewIcon = item.icon;
                             const OldIcon = item.oldIcon;
                             
                             return (
                                 <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    // 🔥 Карточка: ширина 85vw для свайпа, уплотненный паддинг
                                    className="shrink-0 snap-center w-[85vw] md:w-auto p-6 md:p-8 bg-slate-900/40 backdrop-blur-sm rounded-[2.5rem] border border-white/5 hover:bg-slate-900 transition-colors group flex flex-col items-center text-center relative isolate overflow-hidden shadow-xl"
                                 >
                                     {/* Легкий блик при наведении */}
                                     <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none", item.bg)} />

                                     {/* Иконки трансформации */}
                                     <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                                         <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                                             <OldIcon size={18} strokeWidth={1.5} className="md:w-5 md:h-5" />
                                         </div>
                                         <ArrowRight size={18} className="text-slate-700 shrink-0 md:w-5 md:h-5" />
                                         <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-full border flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl shrink-0", item.bg, item.border, item.color)}>
                                             <NewIcon size={24} strokeWidth={1.5} className="md:w-7 md:h-7" />
                                         </div>
                                     </div>

                                     {/* Текст: Было -> Стало */}
                                     <div className="flex items-center justify-center gap-3 text-lg md:text-xl font-black tracking-tight mb-3 md:mb-4 w-full">
                                         <span className="text-slate-400 line-through decoration-red-500/30 decoration-2">
                                             {item.from}
                                         </span>
                                         <ArrowRight size={16} className="text-slate-600" />
                                         <span className="text-white">
                                             {item.to}
                                         </span>
                                     </div>

                                     {/* 🔥 Текст 14px */}
                                     <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
                                         {item.desc}
                                     </p>
                                 </motion.div>
                             );
                         })}
                     </div>

                     {/* 🔥 4. Подсказка "Мотай" (Янтарная) */}
                     <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
                         <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                         <ChevronRight size={14} />
                     </div>
                 </div>

             </div>
        </section>
    );
}