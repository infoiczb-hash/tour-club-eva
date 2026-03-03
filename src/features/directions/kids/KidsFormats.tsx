'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Waves, Users, TreePine, Backpack, ChevronRight } from 'lucide-react'; // 🔥 Добавили ChevronRight
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
        // 🔥 Сделали фон бейджей плотным (bg-slate-950/90) для максимального контраста
        accent: "text-emerald-400 border-emerald-500/30 bg-slate-950/90"
    },
    {
        title: "Кругосветка. Путь героев",
        tags: ["2-3 дня", "10-13/14-18 лет", "База отдыха"],
        desc: "Сплав на байдарках, пешие маршруты и вечерние разговоры. Тур, после которого подростки возвращаются более взрослыми и уверенными.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665937/4_eicktg.jpg",
        accent: "text-blue-400 border-blue-500/30 bg-slate-950/90"
    },
    {
        title: "Точка роста",
        tags: ["3 дня", "6-9/10-16 лет", "Дневной формат"],
        desc: "Каждый день — новая локация: от штолен до SUP-досок. Максимум впечатлений и развития самостоятельности без отрыва от дома на ночь.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665925/3_evqllj.jpg",
        accent: "text-amber-400 border-amber-500/30 bg-slate-950/90"
    },
    {
        title: "Секреты долины Тамашлык",
        tags: ["2-3 дня", "10-15 лет", "Палатки"],
        desc: "Уютный лесной лагерь. Ребенок учится заботиться о себе и окружающих, спит в палатке и находит настоящих друзей.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665919/2_hjcjd8.jpg",
        accent: "text-orange-400 border-orange-500/30 bg-slate-950/90"
    },
    {
        title: "Комбо JUNIOR",
        tags: ["2/3 дня", "9-14 лет", "С ночевкой"],
        desc: "Строенцы и Рашков. Походы по ущельям, загадки природы и пикники с невероятными панорамными видами.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771666029/5_nmcfpa.jpg",
        accent: "text-teal-400 border-teal-500/30 bg-slate-950/90"
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
        // 🔥 1. Уплотнили внешние отступы (было py-12 md:py-20)
        <section className="py-8 md:py-16 bg-[#020617] relative overflow-hidden border-t border-white/5">
            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* 🔥 2. ЗАГОЛОВОК ГЛАВНЫХ ТУРОВ: Выравнивание по левому краю */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="text-left mb-8 md:mb-12 max-w-3xl"
                >
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 uppercase tracking-tighter">
                        Наши <span className="text-amber-500">Форматы</span>
                    </h2>
                    <p className="text-slate-400 text-[14px] md:text-base font-medium leading-relaxed">
                        Мы не просто продаем даты, мы создаем опыт. Выберите формат, который идеально подойдет вашему ребенку по возрасту и уровню подготовки.
                    </p>
                </motion.div>

                {/* 🔥 3. УМНАЯ СЕТКА ГЛАВНЫХ ТУРОВ (СВАЙП НА МОБИЛКЕ) */}
                <div className="relative mb-12 md:mb-20">
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {FORMATS.map((format, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                // Ширина 85vw для свайпа на мобилке, авто для десктопа
                                className="shrink-0 snap-center w-[85vw] md:w-auto group bg-slate-900/60 backdrop-blur-md rounded-[2rem] overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-500 flex flex-col shadow-xl"
                            >
                                <div className="relative h-56 md:h-64 overflow-hidden isolate shrink-0">
                                    <Image 
                                        src={format.img} 
                                        alt={format.title} 
                                        fill 
                                        className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                                        sizes="(max-width: 768px) 85vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                                    
                                    {/* 🔥 4. Теги: Увеличили шрифт до 12px, добавили плотный фон */}
                                    <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
                                        {format.tags.map(tag => (
                                            <span key={tag} className={cn("px-3 py-1.5 text-[12px] font-bold uppercase rounded-xl border shadow-lg tracking-wide", format.accent)}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="p-6 md:p-8 flex flex-col flex-1 relative z-10 bg-slate-900">
                                    <h3 className="text-xl md:text-2xl font-black text-white mb-3 tracking-tight group-hover:text-amber-400 transition-colors leading-tight">
                                        {format.title}
                                    </h3>
                                    {/* Текст увеличен до 14px */}
                                    <p className="text-[14px] md:text-base text-slate-400 leading-relaxed font-medium">
                                        {format.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Подсказка "Мотай" */}
                    <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-amber-500/80 animate-pulse pointer-events-none">
                        <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                        <ChevronRight size={14} />
                    </div>
                </div>

                {/* 5. КОМПАКТНЫЙ БЛОК: ДРУГИЕ ФОРМАТЫ */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="pt-8 border-t border-white/5"
                >
                    {/* 🔥 Выравнивание заголовка "Другие форматы" налево */}
                    <div className="text-left mb-6 md:mb-10 max-w-3xl">
                        <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-3">
                            Другие <span className="text-slate-500">Форматы</span>
                        </h3>
                        <p className="text-slate-400 font-medium text-[14px] md:text-base">
                            Мы также организуем индивидуальные и групповые туры под ваш запрос.
                        </p>
                    </div>

                    {/* 🔥 2-ЭТАЖНЫЙ ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ НА МОБИЛКЕ */}
                    <div className="relative">
                        {/* CSS Grid магия: 2 строки на мобилке, авто-колонки. На десктопе обычная сетка 2х2 */}
                        <div className="grid grid-rows-2 md:grid-rows-none grid-flow-col md:grid-flow-row auto-cols-[85vw] md:auto-cols-auto md:grid-cols-2 gap-3 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-10 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {OTHER_FORMATS.map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                    <div 
                                        key={idx}
                                        className="snap-center flex items-center gap-4 p-5 rounded-[1.5rem] bg-slate-900/40 border border-white/5 hover:border-amber-500/20 hover:bg-slate-900 transition-all group h-full"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-amber-500/30 transition-colors shadow-lg">
                                            <Icon size={22} strokeWidth={1.5} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-[15px] md:text-base leading-tight mb-1 group-hover:text-amber-100 transition-colors">
                                                {item.title}
                                            </h4>
                                            {/* Текст увеличен до 14px */}
                                            <p className="text-[14px] text-slate-500 font-medium leading-snug line-clamp-2">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Подсказка "Мотай" */}
                        <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-slate-500/80 animate-pulse pointer-events-none">
                            <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                            <ChevronRight size={14} />
                        </div>
                    </div>
                </motion.div>
                
            </div>
        </section>
    );
}