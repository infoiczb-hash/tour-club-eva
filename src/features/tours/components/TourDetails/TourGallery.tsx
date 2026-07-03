"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Camera, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';

interface TourGalleryProps {
  images?: string[];
}

export default function TourGallery({ images = [] }: TourGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  }, []);

  const nextImage = useCallback((e?: React.MouseEvent | Event) => {
    e?.stopPropagation();
    if (images.length) setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e?: React.MouseEvent | Event) => {
    e?.stopPropagation();
    if (images.length) setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; 

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      closeLightbox();
    } else {
      setLastTap(now);
    }
  }, [lastTap, closeLightbox]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeLightbox, nextImage, prevImage]);

  if (!images || images.length === 0) return null;

  const displayedImages = images.slice(0, 5);
  const remainingCount = images.length - 5;

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
        "grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 rounded-[2rem] md:rounded-3xl overflow-hidden bg-slate-900 border border-white/5 shadow-xl",
        "md:grid-rows-2",
        mobileRowsClass,
        "aspect-[3/4] sm:aspect-[4/3] md:aspect-[2/1] lg:aspect-[2.5/1]"
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
                alt={`Галерея тура фото ${index + 1}`} 
                fill 
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes={isMain
                  ? "(max-width: 768px) 100vw, 50vw"
                  : "(max-width: 768px) 50vw, 25vw"
                }
                loading={index === 0 ? "eager" : "lazy"}
                quality={isMain ? 65 : 55}
              />
              
              {isLastVisible && remainingCount > 0 ? (
                 <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center border border-white/10 transition-colors group-hover:bg-slate-900/80">
                     <span className="text-2xl md:text-3xl font-black text-white">+{remainingCount}</span>
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
          className="fixed inset-0 z-[9999] bg-black/98 isolate backdrop-blur-xl flex flex-col items-center justify-center touch-none animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <div 
             key={currentIndex}
             className="relative w-full h-[85dvh] md:h-[90dvh] max-w-7xl mx-auto flex items-center justify-center animate-in zoom-in-95 duration-200"
             onClick={handleImageClick}
          >
            <Image 
               src={images[currentIndex]} 
               alt={`Фотография ${currentIndex + 1} из ${images.length}`} 
               fill 
               className="object-contain"
               sizes="100vw"
               loading="eager" 
               quality={75}
             />
          </div>

          {images.length > 1 && (
            <>
              <button 
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-black/40 md:bg-transparent rounded-full text-white/70 hover:text-white transition-colors hover:scale-110 active:scale-95 z-[10000]"
                aria-label="Предыдущее фото" 
                onClick={prevImage}
              >
                 <ChevronLeft size={36} className="md:w-12 md:h-12" />
              </button>
              <button 
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-black/40 md:bg-transparent rounded-full text-white/70 hover:text-white transition-colors hover:scale-110 active:scale-95 z-[10000]"
                aria-label="Следующее фото" 
                onClick={nextImage}
              >
                 <ChevronRight size={36} className="md:w-12 md:h-12" />
              </button>
            </>
          )}

          {/* ИСПРАВЛЕНО: Вернули iOS safe-area для счетчика снизу, чтобы не перекрывался полоской свайпа */}
          <div className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/60 rounded-full text-white/90 font-bold text-sm backdrop-blur-md border border-white/10 shadow-lg z-[10000] pointer-events-none">
             {currentIndex + 1} / {images.length}
          </div>

          {/* ИСПРАВЛЕНО: Добавили iOS safe-area для челки (notch) сверху */}
          <button 
            className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 md:top-6 md:right-6 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white backdrop-blur-md border border-white/10 rounded-full transition-all z-[10000] shadow-xl"
            aria-label="Закрыть галерею" 
            onClick={closeLightbox}
          >
             <X size={20} className="md:w-6 md:h-6" />
          </button>

          <div className="absolute inset-y-0 left-0 w-1/3 z-40 md:hidden" onClick={(e) => { e.stopPropagation(); prevImage(); }} />
          <div className="absolute inset-y-0 right-0 w-1/3 z-40 md:hidden" onClick={(e) => { e.stopPropagation(); nextImage(); }} />
        </div>
      )}

    </section>
  );
}