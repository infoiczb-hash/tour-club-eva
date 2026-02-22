"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

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

  // 🔥 УБРАН margin-bottom
  return (
    <section className="scroll-mt-24" id="gallery">
      
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20">
           <Camera size={20} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
           Галерея
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 h-[500px] md:h-[600px] rounded-3xl overflow-hidden bg-slate-900 border border-white/5">
        
        {displayedImages.map((img, index) => {
          const isMain = index === 0;
          const isLastVisible = index === 4;

          return (
            <div 
              key={index}
              onClick={() => openLightbox(index)}
              className={`relative group cursor-pointer overflow-hidden bg-slate-800 ${
                isMain 
                  ? "col-span-2 md:col-span-2 md:row-span-2" 
                  : "col-span-1"
              }`}
            >
              <Image 
                src={img} 
                alt={`Gallery ${index}`} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={isMain} 
                sizes={isMain ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
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

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center touch-none"
            onClick={closeLightbox}
          >
            <button 
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
              onClick={closeLightbox}
            >
               <X size={32} />
            </button>

            <motion.div 
               key={currentIndex}
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
               className="relative w-full h-full max-w-7xl max-h-[85vh] mx-4 flex items-center justify-center"
               onClick={(e) => e.stopPropagation()}
            >
               <Image 
                 src={images[currentIndex]} 
                 alt="Fullscreen view" 
                 fill 
                 className="object-contain"
                 priority
                 quality={100}
               />
            </motion.div>

            <button 
              className="absolute left-2 md:left-4 p-4 text-white/50 hover:text-white transition-colors hover:scale-110 active:scale-95"
              onClick={prevImage}
            >
               <ChevronLeft size={40} />
            </button>
            <button 
              className="absolute right-2 md:right-4 p-4 text-white/50 hover:text-white transition-colors hover:scale-110 active:scale-95"
              onClick={nextImage}
            >
               <ChevronRight size={40} />
            </button>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white/70 font-medium text-sm backdrop-blur-md border border-white/5">
               {currentIndex + 1} / {images.length}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}