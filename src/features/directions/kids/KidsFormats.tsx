'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Waves, Users, TreePine, Backpack } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// РЕАЛЬНЫЕ ДАННЫЕ ВАШЕГО ТУРКЛУБА
const FORMATS = [
    {
        title: "Один день в лесу",
        tags: ["4-5 часов", "8+ лет", "Без ночевки"],
        desc: "Верёвочное ралли, командные игры и обед/чай на костре. Идеально для застенчивых детей и безопасной адаптации к природе.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665911/1_suclsq.jpg",
        accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
    },
    {
        title: "Кругосветка. Путь героев",
        tags: ["2-3 дня", "10-13/14-18 лет", "База отдыха"],
        desc: "Сплав на байдарках, пешие маршруты и вечерние разговоры. Тур, после которого подростки возвращаются более взрослыми и уверенными.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665937/4_eicktg.jpg",
        accent: "text-blue-400 border-blue-500/30 bg-blue-500/10"
    },
    {
        title: "Точка роста",
        tags: ["3 дня", "6-9/10-16 лет", "Дневной формат"],
        desc: "Каждый день — новая локация: от штолен до SUP-досок. Максимум впечатлений и развития самостоятельности без отрыва от дома на ночь.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665925/3_evqllj.jpg",
        accent: "text-amber-400 border-amber-500/30 bg-amber-500/10"
    },
    {
        title: "Секреты долины Тамашлык",
        tags: ["2-3 дня", "10-15 лет", "Палатки"],
        desc: "Уютный лесной лагерь. Ребенок учится заботиться о себе и окружающих, спит в палатке и находит настоящих друзей.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665919/2_hjcjd8.jpg",
        accent: "text-orange-400 border-orange-500/30 bg-orange-500/10"
    },
    {
        title: "Комбо JUNIOR",
        tags: ["2/3 дня", "9-14 лет", "С ночевкой"],
        desc: "Строенцы и Рашков. Походы по ущельям, загадки природы и пикники с невероятными панорамными видами.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771666029/5_nmcfpa.jpg",
        accent: "text-teal-400 border-teal-500/30 bg-teal-500/10"
    }
];

// КОМПАКТНЫЕ ДОПОЛНИТЕЛЬНЫЕ ФОРМАТЫ
const OTHER_FORMATS = [
    {
        title: "Сплавы на байдарках для старшеклассников",
        desc: "Доступны форматы как с родителями, так и полностью самостоятельные группы.",
        icon: Waves,
    },
    {
        title: 'Сплавы "Отцы и дети"',
        desc: "Специальный формат для укрепления связи и совместного преодоления маршрута.",
        icon: Users,
    },
    {
        title: "Прогулки по Кицканскому лесу с костром",
        desc: "Короткие атмосферные выходы на природу на несколько часов.",
        icon: TreePine,
    },
    {
        title: "Выезд со школьниками в приключенческом формате",
        desc: "Идеальная альтернатива скучным классным часам. Командообразование для всего класса.",
        icon: Backpack,
    }
];

export default function KidsFormats() {
    return (
        <section className="py-12 md:py-20 bg-[#020617] relative overflow-hidden border-t border-white/5">
            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* 1. ЗАГОЛОВОК ГЛАВНЫХ ТУРОВ */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 md:mb-20"
                >
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter">
                        Наши <span className="text-amber-500">Форматы</span>
                    </h2>
                    <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
                        Мы не просто продаем даты, мы создаем опыт. Выберите формат, который идеально подойдет вашему ребенку по возрасту и уровню подготовки.
                    </p>
                </motion.div>

                {/* 2. УМНАЯ СЕТКА ГЛАВНЫХ ТУРОВ (С ФОТО) */}
                <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                    {FORMATS.map((format, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            // Ширина: 100% на мобилке, 50% на планшете, 33.3% на десктопе (с учетом gap)
                            className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-22px)] group bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-500 flex flex-col"
                        >
                            <div className="relative h-56 md:h-64 overflow-hidden isolate shrink-0">
                                <Image 
                                    src={format.img} 
                                    alt={format.title} 
                                    fill 
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                                
                                {/* Теги поверх фото */}
                                <div className="absolute top-5 left-5 right-5 flex flex-wrap gap-2">
                                    {format.tags.map(tag => (
                                        <span key={tag} className={cn("px-3 py-1.5 backdrop-blur-md text-[10px] font-bold uppercase rounded-xl border shadow-lg", format.accent)}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="p-6 md:p-8 flex flex-col flex-1 relative z-10 bg-slate-900">
                                <h3 className="text-xl md:text-2xl font-black text-white mb-3 md:mb-4 tracking-tight group-hover:text-amber-400 transition-colors leading-tight">
                                    {format.title}
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                                    {format.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 3. КОМПАКТНЫЙ БЛОК: ДРУГИЕ ФОРМАТЫ */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20 md:mt-32 pt-16 border-t border-white/5"
                >
                    <div className="text-center mb-10 md:mb-12">
                        <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-4">
                            Другие <span className="text-slate-500">Форматы</span>
                        </h3>
                        <p className="text-slate-400 font-medium text-sm md:text-base">
                            Мы также организуем индивидуальные и групповые туры под ваш запрос.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                        {OTHER_FORMATS.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div 
                                    key={idx}
                                    className="flex items-center gap-5 p-5 md:p-6 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-amber-500/20 hover:bg-slate-900 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-amber-500/30 transition-colors">
                                        <Icon size={20} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm md:text-base leading-tight mb-1 group-hover:text-amber-100 transition-colors">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
                
            </div>
        </section>
    );
}