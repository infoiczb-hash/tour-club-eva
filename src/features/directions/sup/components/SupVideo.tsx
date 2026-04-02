'use client';

import { useState } from 'react';
import { Play, Video } from 'lucide-react';
import Image from 'next/image';
// ✅ ДОБАВЛЕНО: Глобальный хук
import { useInView } from '@/hooks/useInView';

export default function SupVideo() {
    // Состояние, которое переключает обложку на реальный плеер
    const [isPlaying, setIsPlaying] = useState(false);
    
    // ✅ ИСПРАВЛЕНО: Глобальный хук с оригинальными параметрами
    const headerView = useInView({ threshold: 0.1, rootMargin: '-50px' });
    const playerView = useInView({ threshold: 0.1, rootMargin: '-50px' });

    // Данные видео
    const videoId = "Ki5m2YG_ALU";
    const startTime = 27; // Таймкод

    return (
        <section className="py-12 md:py-20 bg-slate-950 relative overflow-hidden border-t border-white/5">
            
            {/* Декоративное свечение */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/10 md:blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-5xl relative z-10">
                
                {/* 1. ЗАГОЛОВОК */}
                <div 
                    ref={headerView.ref}
                    style={{ opacity: headerView.inView ? 1 : 0, transform: headerView.inView ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
                    className="text-center mb-10 md:mb-14"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full mb-6 backdrop-blur-md">
                        <Video className="w-4 h-4 text-teal-400" />
                        <span className="text-[12px] font-bold tracking-widest text-teal-300 uppercase">
                            Живые кадры
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
                       Видео инструтаж <span className="text-teal-500"> для новичков</span>
                    </h2>
                </div>

                {/* 2. КИНЕМАТОГРАФИЧНЫЙ ПЛЕЕР (Фасад) */}
                <div 
                    ref={playerView.ref}
                    style={{ opacity: playerView.inView ? 1 : 0, transform: playerView.inView ? 'scale(1)' : 'scale(0.95)', transition: 'opacity 0.6s ease-out, transform 0.6s ease-out' }}
                    className="relative w-full aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden group border border-white/10 shadow-2xl shadow-teal-900/20 bg-slate-900 isolate cursor-pointer"
                    onClick={() => setIsPlaying(true)}
                >
                    {!isPlaying ? (
                        /* СОСТОЯНИЕ 1: КРАСИВАЯ ОБЛОЖКА */
                        <>
                            {/* Автоматически тянем обложку прямо с YouTube в максимальном качестве */}
                            <Image 
                                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                                alt="SUP Video Thumbnail" 
                                fill 
                                className="object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-105" 
                                sizes="(max-width: 1024px) 100vw, 1024px"
                            />
                            
                            {/* Затенения для глубины */}
                            <div className="absolute inset-0 bg-slate-950/20" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                            {/* КНОПКА PLAY (С эффектом пульсации) */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    {/* Внешнее кольцо-радар (Pulse effect) */}
                                    <div className="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                                    
                                    {/* Сама кнопка (Glassmorphism) */}
                                    <div className="relative w-20 h-20 md:w-24 md:h-24 bg-teal-500/90 backdrop-blur-md rounded-full flex items-center justify-center border border-teal-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_40px_rgba(20,184,166,0.4)]">
                                        <Play size={36} className="text-slate-950 fill-slate-950 ml-2" />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* СОСТОЯНИЕ 2: РЕАЛЬНЫЙ ПЛЕЕР YOUTUBE */
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startTime}&rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    )}
                </div>

            </div>
        </section>
    );
}