"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, Video } from "lucide-react";
import Image from "next/image";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function VideoGuide() {
    // Состояние для переключения между "Обложкой" и "Плеером"
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Ваш ID видео с YouTube
    const videoId = "WmzHFlL0jrg";
    // Автоматически берем лучшую обложку вашего видео с серверов YouTube
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return (
        <section className="py-12 md:py-20 bg-[#020617] relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-5xl relative z-10">
                
                {/* 1. ЗАГОЛОВОК СЕКЦИИ */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center mb-10 md:mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4">
                        <Video size={14} className="text-teal-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Видео-гид</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                        Теория <span className="text-teal-500">на практике</span>
                    </h2>
                    <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium">
                        Посмотрите наш короткий инструктаж. Мы наглядно показываем, как правильно садиться в байдарку, держать весло и уверенно чувствовать себя на воде.
                    </p>
                </motion.div>

                {/* 2. КИНЕМАТОГРАФИЧНЫЙ ПЛЕЕР (Паттерн Фасад) */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden group border border-white/5 shadow-2xl shadow-teal-900/10 bg-slate-900 isolate"
                >
                    {!isPlaying ? (
                        /* СОСТОЯНИЕ 1: КРАСИВАЯ ОБЛОЖКА */
                        <div 
                            className="absolute inset-0 cursor-pointer"
                            onClick={() => setIsPlaying(true)}
                        >
                            <Image 
                                src={thumbnailUrl} 
                                alt="Видео-инструктаж по байдаркам" 
                                fill 
                                className="object-cover opacity-70 group-hover:opacity-50 transition-all duration-700 group-hover:scale-105" 
                                sizes="(max-width: 1024px) 100vw, 1024px"
                                // Разрешаем загрузку с img.youtube.com (если не настроено в next.config, покажет запасной вариант)
                                unoptimized
                            />
                            
                            {/* Затенение снизу для читаемости текста */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90" />

                            {/* КНОПКА PLAY (Glassmorphism + Pulse) */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                                    <div className="relative w-20 h-20 md:w-24 md:h-24 bg-teal-500/90 backdrop-blur-md rounded-full flex items-center justify-center border border-teal-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_40px_rgba(20,184,166,0.3)]">
                                        <Play size={36} className="text-slate-950 fill-slate-950 ml-2" />
                                    </div>
                                </div>
                            </div>

                            {/* ИНФО-ПЛАШКИ ВНУТРИ ВИДЕО */}
                            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex flex-col items-start z-10">
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg mb-3">
                                    Основы управления
                                </span>
                                <h3 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg tracking-tight leading-tight">
                                    Как управлять байдаркой?
                                </h3>
                                <p className="text-slate-300 text-sm mt-2 font-medium drop-shadow-md hidden md:block max-w-md">
                                    Нажмите Play, чтобы увидеть правильную технику гребли и посадки на воду.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* СОСТОЯНИЕ 2: РЕАЛЬНЫЙ YOUTUBE ПЛЕЕР */
                        <div className="absolute inset-0 bg-black">
                            <iframe 
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                    )}
                </motion.div>

            </div>
        </section>
    );
}