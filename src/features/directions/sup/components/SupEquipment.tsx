'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
    Gauge, MoveHorizontal, Timer, ShieldCheck, 
    Waves, Link, LifeBuoy, Smartphone, Backpack 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// 1. Технические характеристики доски
const STATS = [
  { label: "Давление", value: "20 PSI", desc: "Жесткая как пол", icon: Gauge },
  { label: "Ширина", value: "80+ см", desc: "Макс. устойчивость", icon: MoveHorizontal },
  { label: "Обучение", value: "15 мин", desc: "И вы в деле", icon: Timer },
  { label: "Риск падения", value: "< 10%", desc: "Слушая гида", icon: ShieldCheck }
];

// 2. Базовый комплект экипировки
const GEAR = [
    {
        title: "Весло для SUP",
        desc: "Легкое и прочное. Регулируется под ваш рост одним щелчком, чтобы руки не уставали грести.",
        icon: Waves,
    },
    {
        title: "Страховочный лиш",
        desc: "Специальный трос на ногу. Даже если вы упадете, доска никуда не уплывет — это гарантия безопасности.",
        icon: Link,
    },
    {
        title: "Спасжилет (XS - 5XL)",
        desc: "Обязательный атрибут. У нас есть удобные размеры абсолютно для всех: от малышей до богатырей.",
        icon: LifeBuoy,
    },
    {
        title: "Чехол для телефона",
        desc: "Водонепроницаемый бейдж на шею. Делайте крутые фото на воде, не боясь утопить смартфон.",
        icon: Smartphone,
    },
    {
        title: "Гермомешок (10+ л)",
        desc: "Выдаем на маршруты от 5 часов. Поместятся ваши сухие вещи, ключи от машины и перекус.",
        icon: Backpack,
    }
];

export default function SupEquipment() {
    return (
        <section className="py-10 md:py-16 bg-slate-950 relative overflow-hidden border-t border-white/5">
            
            {/* Фоновые свечения для кинематографичности */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* ЗАГОЛОВОК */}
                <div className="text-center mb-8 md:mb-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4"
                    >
                        <ShieldCheck className="text-teal-400" size={14} strokeWidth={2} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                            Премиальное снаряжение
                        </span>
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Ваш <span className="text-teal-500">Арсенал</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto font-medium">
                        Мы продумали каждую деталь, чтобы на воде вы чувствовали себя так же уверенно, как на суше.
                    </p>
                </div>

                {/* ЧАСТЬ 1: ДОСКА И ХАРАКТЕРИСТИКИ */}
                <div className="relative flex flex-col items-center mb-16 md:mb-20">
                    
                    {/* Фото доски */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        // Высота подогнана строго под узкую доску, чтобы убить лишние пустоты (было h-[380px])
                        className="relative w-full max-w-5xl h-[140px] sm:h-[180px] md:h-[240px] lg:h-[280px] z-0 mb-6 md:mb-10"
                    >
                        <motion.div 
                            animate={{ y: [-10, 10, -10] }} 
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            // ИМЕННО ЗДЕСЬ мы увеличиваем доску на 30% на десктопе
                            className="w-full h-full relative md:scale-[1.2] lg:scale-[1.3]"
                        >
                            <Image 
                                src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609412/sup_fl75zk.webp" 
                                alt="SUP Board Touring" 
                                fill 
                                sizes="(max-width: 768px) 100vw, 1200px"
                                className="object-contain drop-shadow-[0_20px_40px_rgba(20,184,166,0.15)]"
                                priority
                            />
                        </motion.div>
                    </motion.div>

                    {/* Плашка с характеристиками (ровная, без отрицательных марджинов) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="w-full bg-white/10 border border-white/10 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
                            {STATS.map((stat, i) => (
                                <div key={i} className="bg-slate-900/90 backdrop-blur-md p-5 md:p-8 flex flex-col items-center text-center group hover:bg-slate-800/90 transition-colors duration-300">
                                    <stat.icon className="text-teal-500/50 group-hover:text-teal-400 transition-colors mb-3 md:mb-4" size={28} strokeWidth={1.5} />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xl md:text-3xl font-black text-white tracking-tighter">
                                            {stat.value}
                                        </span>
                                        <span className="text-[10px] md:text-xs uppercase font-bold text-teal-500 tracking-[0.2em]">
                                            {stat.label}
                                        </span>
                                    </div>
                                    <p className="mt-2 md:mt-3 text-[10px] md:text-sm text-slate-400 font-medium max-w-[140px] mx-auto">
                                        {stat.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ЧАСТЬ 2: ЭКИПИРОВКА (Сетка карточек) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-4 md:gap-6"
                >
                    {GEAR.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div 
                                key={idx} 
                                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-[2rem] p-6 md:p-8 hover:border-teal-500/30 hover:bg-slate-900/80 transition-all duration-300 group flex flex-row items-start gap-4 md:flex-col md:items-start md:gap-0"
                            >
                                <div className="w-12 h-12 shrink-0 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center md:mb-5 group-hover:bg-teal-500 group-hover:border-teal-400 transition-colors duration-300">
                                    <Icon className="text-teal-400 group-hover:text-slate-950 transition-colors" size={22} strokeWidth={1.5} />
                                </div>
                                
                                <div className="flex-1">
                                    <h4 className="text-lg font-black text-white mb-2 tracking-tight group-hover:text-teal-300 transition-colors">
                                        {item.title}
                                    </h4>
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>

            </div>
        </section>
    );
}