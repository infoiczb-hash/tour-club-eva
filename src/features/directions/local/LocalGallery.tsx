'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Camera, ChevronRight } from 'lucide-react'; // 🔥 Добавили иконки
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

// Функция для объединения классов
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ВАШИ НОВЫЕ ФОТОГРАФИИ
const GALLERY_IMAGES = [
    // Широкий кадр (Костер и гитара - атмосфера)
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669025/2_e0imrh.jpg",
    // Обычный кадр (Байдарки на закате)
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669311/3_hwlb7w.webp",
    // Обычный кадр (Вид на воду сверху)
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669023/5_blvvir.jpg",
    // Широкий кадр (Скалы и река - масштаб)
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669309/4_k5ylnt.webp",
    // Обычный кадр (Вид из пещеры)
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669024/1_kac1bp.webp",
    // Широкий кадр (Группа с флагом на вершине)
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669024/6_imtnsk.jpg",
];

export default function LocalGallery() {
    return (
        // 🔥 1. Уплотнили внешние отступы
        <section className="py-8 md:py-16 bg-slate-950 border-t border-white/5 relative overflow-hidden">
            
            {/* Фоновое свечение */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-900/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* 🔥 2. ВЫРАВНИВАНИЕ ВЛЕВО */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-left mb-8 md:mb-12 max-w-3xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-4 md:mb-6 backdrop-blur-md">
                        <Camera className="w-4 h-4 text-stone-400" />
                        <span className="text-[12px] md:text-[14px] font-bold tracking-widest text-stone-300 uppercase">
                            Без фильтров и постановки
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                        Живые <span className="text-emerald-500">Моменты</span>
                    </h2>
                    <p className="text-[14px] md:text-base text-stone-400 font-medium leading-relaxed">
                        Никакого позирования — только настоящие эмоции, красивые виды и атмосфера наших выездов.
                    </p>
                </motion.div>

                {/* 🔥 3. ОБЕРТКА ДЛЯ СКРОЛЛА (СВАЙП НА МОБИЛКЕ) */}
                <div className="relative">
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-4 md:mx-0 md:px-0 md:auto-rows-[300px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {GALLERY_IMAGES.map((src, i) => {
                            // Логика для создания асимметрии на десктопе
                            const isWide = i === 0 || i === 3 || i === 5;
                            
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className={cn(
                                        // 🔥 На мобилке: w-[85vw] h-[400px]. На десктопе: h-full, сетка.
                                        "relative shrink-0 snap-center w-[85vw] h-[400px] md:w-auto md:h-full rounded-[2rem] overflow-hidden group border border-white/10 isolate bg-slate-900 cursor-pointer shadow-xl",
                                        isWide ? "md:col-span-2" : "md:col-span-1"
                                    )}
                                >
                                    <Image 
                                        src={src} 
                                        alt={`Фото из похода ${i + 1}`}
                                        fill 
                                        className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                                        sizes={isWide
  ? "(max-width: 640px) 85vw, (max-width: 1024px) 85vw, 66vw"
  : "(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"}
                                        priority={i === 0}
                                    />
                                    {/* Легкое затемнение при наведении */}
                                    <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-transparent transition-colors duration-500" />
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* 🔥 4. Подсказка "Мотай" */}
                    <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-emerald-500/80 animate-pulse pointer-events-none">
                        <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                        <ChevronRight size={14} />
                    </div>
                </div>

            </div>
        </section>
    );
}