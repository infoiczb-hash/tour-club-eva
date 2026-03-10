"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { m as motion, AnimatePresence } from 'framer-motion';
import { Camera, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const galleryImages = [
  { id: 1, src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584114/196866761_4343080962371184_6042688601785630843_n_w7jdqu.jpg", alt: "Счастливая группа на воде", focus: "object-center" },
  { id: 2, src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584132/104_vapoxq.jpg", alt: "Эмоции на байдарке", focus: "object-top" },
  { id: 3, src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584228/%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_viber_2025-06-21_11-50-14-080_a7uba5.jpg", alt: "Привал на диком пляже", focus: "object-center" },
  { id: 4, src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584255/%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_viber_2023-09-23_21-20-27-585_cqucfh.jpg", alt: "Командный дух", focus: "object-center" },
];

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // Блокировка скролла страницы при открытом лайтбоксе
  useEffect(() => {
    if (selectedImage !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedImage]);

  // Навигация с клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      if (e.key === 'Escape') setSelectedImage(null);
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  const showNext = () => {
    setSelectedImage((prev) => (prev === null || prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const showPrev = () => {
    setSelectedImage((prev) => (prev === null || prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  return (
    <section className="py-12 md:py-24 bg-[#020617] relative overflow-hidden border-t border-white/5 font-sans">
      {/* Декоративный фон */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* HEADER */}
        <div className="max-w-3xl mb-10 md:mb-16 text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
              <Camera size={14} className="text-teal-400" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">Фотоотчет</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
              Живые <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Эмоции</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              Лучше один раз увидеть, чем сто раз прочитать. Наши походы — это тысячи счастливых улыбок и гигабайты контента.
            </p>
          </motion.div>
        </div>

        {/* GRID: 2 колонки на мобильных, 4 на десктопе */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {galleryImages.map((img, idx) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              onClick={() => setSelectedImage(idx)}
              className="group relative aspect-square md:aspect-[4/5] rounded-[2rem] overflow-hidden cursor-pointer bg-slate-900 border border-white/5 shadow-lg"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className={cn("object-cover transition-transform duration-700 group-hover:scale-110", img.focus)}
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              
              {/* Оверлей при наведении с иконкой "Увеличить" */}
              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors duration-500 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <Maximize2 className="text-white w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ЛАЙТБОКС (Полноэкранный просмотр) */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          >
            {/* Кнопка закрытия */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all z-50"
            >
              <X size={24} />
            </button>

            {/* Контролы перелистывания (Десктоп) */}
            <button
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all z-50"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all z-50"
            >
              <ChevronRight size={32} />
            </button>

            {/* Сама картинка в лайтбоксе */}
            <div className="relative w-full max-w-6xl aspect-[4/3] md:aspect-[16/9] px-4 md:px-0" onClick={(e) => e.stopPropagation()}>
              <Image
                src={galleryImages[selectedImage].src}
                alt={galleryImages[selectedImage].alt}
                fill
                className="object-contain"
                sizes="100vw"
                quality={90}
                priority
              />
            </div>

            {/* Невидимые зоны для клика на мобилках (листание тапами по краям экрана) */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-40 md:hidden" onClick={(e) => { e.stopPropagation(); showPrev(); }} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-40 md:hidden" onClick={(e) => { e.stopPropagation(); showNext(); }} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}