'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

// Функция для объединения классов (чтобы сетка работала корректно)
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
        <section className="py-12 md:py-20 bg-slate-950 border-t border-white/5">
            <div className="container mx-auto px-4 max-w-6xl">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12 md:mb-20 text-center"
                >
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Живые <span className="text-emerald-500">Моменты</span>
                    </h2>
                    <p className="text-stone-400 font-medium text-base md:text-lg max-w-2xl mx-auto">
                        Никакого позирования — только настоящие эмоции, красивые виды и атмосфера наших выездов.
                    </p>
                </motion.div>

                {/* Асимметричная сетка для 6 фото (3 колонки на десктопе) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[300px]">
                    {GALLERY_IMAGES.map((src, i) => {
                        // Логика для создания асимметрии (чередуем широкие и обычные блоки)
                        // Фото 0, 3, 5 будут занимать 2 колонки на десктопе
                        const isWide = i === 0 || i === 3 || i === 5;
                        
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                                className={cn(
                                    "relative rounded-3xl overflow-hidden group h-full w-full",
                                    isWide ? "md:col-span-2" : "md:col-span-1",
                                    // На мобилках первое фото делаем большим
                                    i === 0 && "sm:col-span-2"
                                )}
                            >
                                <Image 
                                    src={src} 
                                    alt={`Фото из похода ${i + 1}`}
                                    fill 
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                {/* Легкое затемнение при наведении */}
                                <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-transparent transition-colors duration-500" />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}