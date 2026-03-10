"use client";

import React from 'react';
import Image from 'next/image';
import { m as motion, Variants } from 'framer-motion';
import { DirectionData, THEMES } from '@/data/directionsData';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DirectionBentoProps {
  data: DirectionData;
}

export default function DirectionBento({ data }: DirectionBentoProps) {
  const theme = THEMES[data.theme];
  const features = data.features;

  if (!features || features.length === 0) return null;

  // Анимация появления контейнера (по очереди)
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="relative py-20 md:py-32 bg-slate-950 overflow-hidden z-10">
      
      {/* Декоративный фоновый свет из темы */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] md:blur-[150px] rounded-full pointer-events-none opacity-20"
        style={{ backgroundColor: theme.hex }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Заголовок секции */}
        <div className="mb-12 md:mb-16 max-w-2xl">
            <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[1.1] mb-4"
            >
                Почему <span style={{ color: theme.hex }}>именно этот</span> формат?
            </motion.h2>
            <motion.p 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-slate-400 text-base md:text-lg font-medium"
            >
                Мы продумали каждую мелочь, чтобы вы могли отключить голову и просто наслаждаться моментом.
            </motion.p>
        </div>

        {/* УМНАЯ СЕТКА BENTO */}
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-[minmax(280px,auto)]"
        >
            {features.map((feat, idx) => {
                
               // --- УМНАЯ ЛОГИКА АСИММЕТРИИ ---
                const hasImage = !!feat.image;
                let spanClass = "col-span-1"; // По умолчанию

                // Если карточек 4 (как в SUP)
                if (features.length === 4) {
                    spanClass = (idx === 0 || idx === 3) 
                        ? "md:col-span-2 lg:col-span-2" // Широкие (1-я и 4-я)
                        : "md:col-span-1 lg:col-span-1"; // Узкие (2-я и 3-я)
                } 
                // Если карточек 3 (как в Сплавах, Горах, Детских)
                else if (features.length === 3) {
                    if (idx === 0) spanClass = "md:col-span-2 lg:col-span-2"; // Широкая сверху слева
                    if (idx === 1) spanClass = "md:col-span-1 lg:col-span-1"; // Узкая сверху справа
                    if (idx === 2) spanClass = "md:col-span-3 lg:col-span-3"; // Растягиваем 3-ю на всю ширину снизу!
                }

                return (
                    <motion.div
                        key={idx}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className={cn(
                            "group relative overflow-hidden rounded-[2rem] border transition-all duration-500 flex flex-col justify-between",
                            "bg-slate-900/80 border-white/5 hover:border-white/10 hover:shadow-2xl",
                            spanClass, // Вставляем наш вычисленный класс вместо isLarge
                            hasImage ? "p-0" : "p-6 md:p-8"
                        )}
                        style={{
                            boxShadow: `0 0 0 0 ${theme.glow}`, 
                        }}
                    >
                        
                        {/* ЕСЛИ ЕСТЬ ФОТО (Glassmorphism Card) */}
                        {hasImage && (
                            <>
                                <Image 
                                    src={feat.image!} 
                                    alt={feat.title} 
                                    fill 
                                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none" />
                                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end z-10 pointer-events-none">
                                    <div className="mb-4">
                                        <div 
                                            className="w-12 h-12 rounded-2xl backdrop-blur-md border flex items-center justify-center text-white mb-4 transition-transform group-hover:-translate-y-1"
                                            style={{ backgroundColor: theme.glow, borderColor: theme.glow }}
                                        >
                                            <feat.icon size={24} strokeWidth={2} />
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-md">
                                            {feat.title}
                                        </h3>
                                        <p className="text-sm md:text-base text-slate-200 font-medium leading-relaxed drop-shadow-sm max-w-lg">
                                            {feat.description}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ЕСЛИ ФОТО НЕТ (Premium Text Card) */}
                        {!hasImage && (
                            <>
                                <div>
                                    <div 
                                        className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                                        style={{ color: theme.hex }}
                                    >
                                        <feat.icon size={28} strokeWidth={2} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3 transition-colors group-hover:text-white">
                                        {feat.title}
                                    </h3>
                                    <p className="text-sm md:text-base text-slate-400 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                                        {feat.description}
                                    </p>
                                </div>
                                
                                {/* Тонкий декоративный элемент снизу */}
                                <div className="w-full h-1 rounded-full bg-white/5 mt-8 overflow-hidden">
                                    <div 
                                        className="h-full w-0 group-hover:w-full transition-all duration-700 ease-out" 
                                        style={{ backgroundColor: theme.hex }}
                                    />
                                </div>
                            </>
                        )}
                    </motion.div>
                );
            })}
        </motion.div>
      </div>
    </section>
  );
}