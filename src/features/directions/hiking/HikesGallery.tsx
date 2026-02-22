'use client';

import { motion } from 'framer-motion';
import { Image as ImageIcon, Camera, MountainSnow, Coffee } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Данные для заглушек (потом заменим на реальные фото)
const GALLERY_ITEMS = [
    {
        id: 1,
        title: "Масштаб",
        subtitle: "Ощущение себя песчинкой среди вершин",
        icon: MountainSnow,
        className: "md:col-span-2 md:row-span-2 h-[400px] md:h-full", // Большой вертикальный блок слева
    },
    {
        id: 2,
        title: "Атмосфера",
        subtitle: "Туманное утро в лагере",
        icon: Camera,
        className: "md:col-span-2 md:row-span-1 h-[250px]", // Широкий блок сверху справа
    },
    {
        id: 3,
        title: "Детали",
        subtitle: "Иней на хвое",
        icon: ImageIcon,
        className: "md:col-span-1 md:row-span-1 h-[250px]", // Маленький квадрат
    },
    {
        id: 4,
        title: "Уют",
        subtitle: "Горячий кофе на привале",
        icon: Coffee,
        className: "md:col-span-1 md:row-span-1 h-[250px]", // Маленький квадрат
    },
    {
        id: 5,
        title: "Путь",
        subtitle: "Тропа, ведущая к облакам",
        icon: ImageIcon,
        className: "md:col-span-4 md:row-span-1 h-[300px]", // Широкая панорама снизу
    }
];

export default function HikesGallery() {
    return (
        <section className="py-12 md:py-20 bg-stone-950 border-t border-white/5 relative overflow-hidden">
            
            {/* Фоновое свечение */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-teal-900/20 blur-[150px] rounded-full pointer-events-none opacity-50" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                     <div className="text-sm font-bold tracking-[0.2em] text-teal-600 uppercase mb-4">
                        Фотоархив
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">
                        ЭМОЦИИ БЕЗ <span className="text-teal-500">ФИЛЬТРОВ</span>
                    </h2>
                    <p className="text-stone-400 font-medium text-lg max-w-2xl mx-auto">
                        В каждой тропе есть история. Никаких постановочных кадров — только настоящие моменты, прожитые в горах.
                    </p>
                </motion.div>

                {/* Бенто-сетка */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                    {GALLERY_ITEMS.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.6 }}
                                className={cn(
                                    "relative rounded-[2rem] overflow-hidden group isolate border border-white/10 bg-stone-900/50 backdrop-blur-sm hover:border-teal-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-900/20",
                                    item.className
                                )}
                            >
                                {/* Плейсхолдер для фото (Темное стекло) */}
                                <div className="absolute inset-0 bg-gradient-to-br from-stone-800/50 via-stone-900/50 to-stone-950/80 flex flex-col items-center justify-center p-6 transition-transform duration-700 group-hover:scale-105">
                                    <Icon className="w-12 h-12 text-stone-600 mb-4 group-hover:text-teal-500 transition-colors duration-500" />
                                    <span className="text-stone-500 text-xs font-bold uppercase tracking-widest opacity-50">Место для фото</span>
                                </div>
                                
                                {/* Затемнение при наведении */}
                                <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Текст поверх фото */}
                                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent translate-y-4 group-hover:translate-y-0 opacity-80 group-hover:opacity-100 transition-all duration-500">
                                    <div className="text-teal-400 font-bold uppercase tracking-widest text-xs mb-1">
                                        {item.title}
                                    </div>
                                    <div className="text-white font-bold text-lg md:text-xl leading-tight">
                                        {item.subtitle}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

            </div>
        </section>
    );
}