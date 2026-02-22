'use client';

import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { Heart, Camera } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

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

// Анимация каскадного появления сетки
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export default function SupGallery() {
    return (
        <section className="py-12 md:py-20 bg-slate-950 relative overflow-hidden border-t border-white/5">
            
            {/* Легкие фоновые акценты */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-900/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* ЗАГОЛОВОК */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="flex flex-col items-center text-center mb-12 md:mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md">
                        <Camera className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase">
                            Без фильтров и постановки
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Живые <span className="text-teal-500">Эмоции</span>
                    </h2>
                    <p className="text-slate-400 font-medium max-w-2xl mx-auto text-sm md:text-base">
                        Посмотрите, как проходят наши маршруты. Улыбки гостей — наша главная гордость.
                    </p>
                </motion.div>
                
                {/* СЕТКА (BENTO GRID) */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    // На мобильных: карточки высотой 250px. На десктопе: 3 колонки, высота строк 300px.
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[250px] md:auto-rows-[300px]"
                >
                    {PHOTOS.map((photo, idx) => (
                        <motion.div 
                            key={idx}
                            variants={itemVariants}
                            className={cn(
                                "relative rounded-[2rem] overflow-hidden group border border-white/10 isolate bg-slate-900 cursor-pointer shadow-2xl",
                                photo.className
                            )}
                        >
                            {/* Сама фотография */}
                            <Image 
                                src={photo.src} 
                                alt={`SUP Emotion ${idx + 1}`} 
                                fill 
                                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110" 
                                sizes={idx === 0 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
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
                        </motion.div>
                    ))}
                </motion.div>

            </div>
        </section>
    );
}