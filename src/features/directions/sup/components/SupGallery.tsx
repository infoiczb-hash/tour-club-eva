'use client';

import Image from 'next/image';
import { Heart, Camera, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";
import { useInView } from '@/hooks/useInView';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Ваши реальные фотографии
const PHOTOS = [
    { 
        src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609707/photo_2026-02-20_15-28-30_nuci5x.jpg", 
        // Первая картинка будет огромной (2х2) на десктопе
        className: "md:col-span-2 md:row-span-2",
        priority: true
    },
    { 
        src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_15-27-17_afgjtz.jpg", 
        className: "md:col-span-1 md:row-span-1" 
    },
    { 
        src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_19-35-45_ldctdt.jpg", 
        className: "md:col-span-1 md:row-span-1" 
    },
    { 
        src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_15-27-17_2_uzrahg.jpg", 
        className: "md:col-span-1 md:row-span-1" 
    },
    { 
        src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_19-35-10_qhfxnb.jpg", 
        className: "md:col-span-1 md:row-span-1" 
    },
    { 
        src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_15-39-18_wwdqoo.jpg", 
        className: "md:col-span-1 md:row-span-1" 
    }
];

export default function SupGallery() {
    const { ref: refHeader, inView: headerInView } = useInView({ rootMargin: "-50px" });
    const { ref: refGrid,   inView: gridInView   } = useInView({ rootMargin: "-100px" });

    return (
        // 🔥 Уменьшили внешние отступы (py-8 md:py-16)
        <section className="py-8 md:py-16 bg-slate-950 relative overflow-hidden border-t border-white/5">
            
            {/* Легкие фоновые акценты */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* 🔥 ЗАГОЛОВОК: Строгое выравнивание по левому краю */}
                <div 
                    ref={refHeader}
                    className={cn(
                      "text-left mb-8 md:mb-12 max-w-3xl transition-all duration-500 ease-out",
                      headerInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"
                    )}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-4 md:mb-6 backdrop-blur-md">
                        <Camera className="w-4 h-4 text-slate-400" />
                        <span className="text-[12px] md:text-[14px] font-bold tracking-widest text-slate-300 uppercase">
                            Без фильтров и постановки
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Живые <span className="text-teal-500">Эмоции</span>
                    </h2>
                    <p className="text-[14px] md:text-base text-slate-400 font-medium leading-relaxed">
                        Посмотрите, как проходят наши маршруты. Улыбки гостей — наша главная гордость.
                    </p>
                </div>
                
                {/* 🔥 ОБЕРТКА ДЛЯ СКРОЛЛА */}
                <div className="relative">
                    <div
                        ref={refGrid}
                        // 🔥 Магия адаптива: flex и snap для мобилок, grid для десктопа
                        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-4 md:mx-0 md:px-0 md:auto-rows-[300px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        {PHOTOS.map((photo, idx) => (
                            <div
                                key={idx}
                                style={{ transitionDelay: gridInView ? `${idx * 150}ms` : '0ms' }}
                                className={cn(
                                    // 🔥 Добавили ширину и высоту для скролла на мобилке (w-[85vw] h-[400px])
                                    "relative shrink-0 snap-center w-[85vw] h-[400px] md:w-auto md:h-full rounded-[2rem] overflow-hidden group border border-white/10 isolate bg-slate-900 cursor-pointer shadow-2xl transition-all duration-600 ease-out",
                                    photo.className,
                                    gridInView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-[0.97]"
                                )}
                            >
                                {/* Сама фотография */}
                                <Image 
                                    src={photo.src} 
                                    alt={`SUP Emotion ${idx + 1}`} 
                                    fill 
                                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110" 
                                    sizes={idx === 0 ? "(max-width: 768px) 85vw, 66vw" : "(max-width: 768px) 85vw, 33vw"}
                                    priority={photo.priority}
                                />
                                
                                {/* Затемнение при наведении (эффект погружения) */}
                                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors duration-500" />

                                {/* Стеклянная иконка в центре, которая появляется при наведении */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out">
                                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-xl">
                                        <Heart size={24} className="fill-white/20" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 🔥 Подсказка "Мотай" */}
                    <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
                        <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                        <ChevronRight size={14} />
                    </div>
                </div>

            </div>
        </section>
    );
}