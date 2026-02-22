'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Users, HeartHandshake } from 'lucide-react';
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
        border: "border-emerald-500/20"
    },
    {
        icon: Users,
        title: "Малые группы",
        desc: "Мы видим настроение каждого. Внимательно следим за динамикой в отряде, чтобы адаптация прошла мягко и без стресса.",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20"
    },
    {
        icon: HeartHandshake,
        title: "Здоровая атмосфера",
        desc: "Никакого буллинга. Только человеческое тепло, поддержка и взаимопомощь. Здесь принято делиться и помогать.",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
    }
];

export default function KidsParents() {
    return (
        <section className="py-12 md:py-20 bg-slate-950 relative overflow-hidden border-t border-white/5">
            {/* Фоновое свечение для акцента на доверии */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-900/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    
                    {/* ЛЕВАЯ КОЛОНКА: Страхи и Цитата */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-8 uppercase tracking-tighter">
                            Мы знаем ваши <span className="text-emerald-500">Вопросы</span>
                        </h2>
                        
                        {/* Список "зачеркнутых" страхов */}
                        <div className="space-y-5 mb-12">
                            {FEARS.map((fear, idx) => (
                                <div key={idx} className="flex items-center gap-4 opacity-70 group">
                                    <div className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-emerald-500 transition-colors" />
                                    <span className="text-base md:text-lg text-slate-400 line-through decoration-slate-600 decoration-2 font-medium">
                                        {fear}
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        {/* Цитата инструктора (Реальная) */}
                        <div className="p-6 md:p-8 bg-slate-900/50 backdrop-blur-sm border-l-4 border-emerald-500 rounded-r-3xl relative">
                            {/* Декоративная кавычка */}
                            <div className="absolute top-4 right-6 text-6xl text-slate-800 font-serif leading-none opacity-50">"</div>
                            
                            <p className="text-base md:text-lg text-slate-300 italic font-medium relative z-10 mb-6 leading-relaxed">
                                Моя задача — не просто научить, а включить. Сделать так, чтобы ребёнок сам захотел — идти, делать, открываться. Из леса мы делаем лагерь, а из веревки — приключение.
                            </p>
                            
                            <div className="flex items-center gap-4 relative z-10">
                                {/* Заглушка для фото Алексея (потом вставите реальное фото) */}
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-emerald-500/30 shrink-0 overflow-hidden relative">
                                    <span className="text-slate-400 font-bold text-lg">А</span>
                                    {/* Когда будет фото, раскомментируйте код ниже: */}
                                    {/* <Image src="/path-to-alexey.jpg" alt="Алексей" fill className="object-cover" /> */}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-base">Алексей</div>
                                    <div className="text-emerald-500 text-[10px] md:text-xs uppercase font-bold tracking-widest mt-0.5">
                                        Тренер по командообразованию
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ПРАВАЯ КОЛОНКА: Гарантии (Bento-стиль) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-4 md:gap-5"
                    >
                        {GUARANTEES.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div 
                                    key={idx} 
                                    className="p-6 bg-slate-900/40 backdrop-blur-sm rounded-[2rem] border border-white/5 hover:border-emerald-500/20 transition-colors flex gap-5 items-start group"
                                >
                                    <div className={cn("shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors duration-300", item.bg, item.border, "group-hover:bg-emerald-500/20")}>
                                        <Icon className={item.color} size={26} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-emerald-50 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-slate-400 leading-relaxed text-sm font-medium">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </motion.div>

                </div>
            </div>
        </section>
    );
}