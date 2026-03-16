"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';

interface TourGalleryProps {
  images?: string[];
}

export default function TourGallery({ images = [] }: TourGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const displayedImages = images.slice(0, 5);
  const remainingCount = images.length - 5;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // ✅ УМНАЯ СЕТКА: Динамически задаем количество строк на мобилке в зависимости от кол-ва фото
  const mobileRowsClass = 
    displayedImages.length <= 1 ? 'grid-rows-1' :
    displayedImages.length <= 3 ? 'grid-rows-3' : 
    'grid-rows-4';

  return (
    <section className="scroll-mt-24 animate-in fade-in duration-500" id="gallery">
      
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20 shrink-0">
           <Camera size={20} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
           Галерея
        </h2>
      </div>

      <div className={clsx(
        "grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 rounded-3xl overflow-hidden bg-slate-900 border border-white/5",
        "md:grid-rows-2",
        mobileRowsClass,
        "h-[450px] sm:h-[500px] md:h-[600px]"
      )}>
        
        {displayedImages.map((img, index) => {
          const isMain = index === 0;
          const isLastVisible = index === 4;

          return (
            <div 
              key={index}
              onClick={() => openLightbox(index)}
              className={clsx(
                "relative group cursor-pointer overflow-hidden bg-slate-800",
                isMain ? "col-span-2 row-span-2 md:col-span-2 md:row-span-2" : "col-span-1 row-span-1"
              )}
            >
              <Image 
                src={img} 
                alt={`Gallery ${index}`} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                // ✅ ИСПРАВЛЕНИЕ: Никаких priority для галереи, она всегда ниже фолда
                loading="lazy"
                // ✅ ИСПРАВЛЕНИЕ: Ограничение размера контейнером (1280px)
                sizes={
                  isMain 
                    ? "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px" 
                    : "(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 320px"
                }
                // ✅ ИСПРАВЛЕНИЕ: Снизили качество превьюшек для экономии трафика
                quality={isMain ? 60 : 50}
              />
              
              {isLastVisible && remainingCount > 0 ? (
                 <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center border border-white/10 transition-colors group-hover:bg-slate-900/80">
                     <span className="text-xl md:text-2xl font-black text-white">+{remainingCount}</span>
                 </div>
              ) : (
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Maximize2 className="text-white drop-shadow-md" size={isMain ? 48 : 24} />
                 </div>
              )}
            </div>
          );
        })}
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center touch-none animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <button 
            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-black/50 hover:bg-white text-white hover:text-black border border-white/20 rounded-full transition-all z-[10000] shadow-xl"
            aria-label="Закрыть галерею" onClick={closeLightbox}
          >
             <X size={24} className="md:w-8 md:h-8" />
          </button>

          <div 
             key={currentIndex}
             className="relative w-full h-full max-w-7xl max-h-[85vh] mx-4 flex items-center justify-center animate-in zoom-in-95 duration-200"
             onClick={(e) => e.stopPropagation()}
          >
             <Image 
               src={images[currentIndex]} 
               alt="Fullscreen view" 
               fill 
               className="object-contain"
               // ✅ В лайтбоксе priority оправдан, так как картинка запрашивается по клику юзера
               priority
               sizes="100vw"
               // ✅ Качество в лайтбоксе оставляем высоким для красивого просмотра
               quality={90}
             />
          </div>

          <button 
            className="absolute left-2 md:left-6 p-4 bg-black/20 md:bg-transparent rounded-full text-white/50 hover:text-white transition-colors hover:scale-110 active:scale-95 z-[10000]"
           aria-label="Предыдущее фото" onClick={prevImage}
          >
             <ChevronLeft size={36} className="md:w-10 md:h-10" />
          </button>
          <button 
            className="absolute right-2 md:right-6 p-4 bg-black/20 md:bg-transparent rounded-full text-white/50 hover:text-white transition-colors hover:scale-110 active:scale-95 z-[10000]"
            aria-label="Следующее фото" onClick={nextImage}
          >
             <ChevronRight size={36} className="md:w-10 md:h-10" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/60 rounded-full text-white/90 font-bold text-sm backdrop-blur-md border border-white/10 shadow-lg z-[10000]">
             {currentIndex + 1} / {images.length}
          </div>

        </div>
      )}

    </section>
  );
}