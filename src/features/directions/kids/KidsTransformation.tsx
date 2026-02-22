'use client';

import { motion } from 'framer-motion';
import { Flame, Compass, Users, ArrowRight, Smartphone, Frown, User } from 'lucide-react';
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
        <section className="py-12 md:py-18 bg-slate-950 relative overflow-hidden">
             <div className="container mx-auto px-4 max-w-6xl relative z-10">
                 
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-16"
                 >
                     <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                        Что <span className="text-amber-500">Меняется?</span>
                     </h2>
                 </motion.div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                     {TRANSFORMATIONS.map((item, idx) => {
                         const NewIcon = item.icon;
                         const OldIcon = item.oldIcon;
                         
                         return (
                             <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.15, duration: 0.5 }}
                                className="p-8 md:p-10 bg-slate-900/40 backdrop-blur-sm rounded-[2.5rem] border border-white/5 hover:bg-slate-900 transition-colors group flex flex-col items-center text-center relative isolate overflow-hidden"
                             >
                                 {/* Легкий блик при наведении */}
                                 <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none", item.bg)} />

                                 {/* Иконки трансформации */}
                                 <div className="flex items-center gap-4 mb-8">
                                     <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                                         <OldIcon size={20} strokeWidth={1.5} />
                                     </div>
                                     <ArrowRight size={20} className="text-slate-700" />
                                     <div className={cn("w-16 h-16 rounded-full border flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl", item.bg, item.border, item.color)}>
                                         <NewIcon size={28} strokeWidth={1.5} />
                                     </div>
                                 </div>

                                 {/* Текст: Было -> Стало */}
                                 <div className="flex items-center justify-center gap-3 text-lg md:text-xl font-black tracking-tight mb-4 w-full">
                                     <span className="text-slate-600 line-through decoration-red-500/30 decoration-2">
                                         {item.from}
                                     </span>
                                     <ArrowRight size={16} className="text-slate-600" />
                                     <span className="text-white">
                                         {item.to}
                                     </span>
                                 </div>

                                 <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                                     {item.desc}
                                 </p>
                             </motion.div>
                         );
                     })}
                 </div>
             </div>
        </section>
    );
}