"use client";

import React, { useRef, useState, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from "framer-motion";
import { 
  Mountain, Waves, Tent, Briefcase, 
  ArrowUpRight, Compass, Anchor, ArrowRight, ChevronLeft, ChevronRight 
} from "lucide-react";

// --- ДАННЫЕ ---
const directions = [
  { id: 1, title: "Сплавы на байдарках", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674642/kayak_p2bkyz.webp", icon: Waves, href: "/directions/kayaking" }, 
  { id: 2, title: "SUP прогулки", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674650/sup_zwz9yw.webp", icon: Anchor, href: "/directions/sup" },
  { id: 3, title: "Местная программа", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674647/local_i9ul0e.webp", icon: Compass, href: "/directions/local" },
  { id: 4, title: "Горы и походы", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674641/hiking_modikx.webp", icon: Mountain, href: "/directions/hiking" },
  { id: 5, title: "Junior Академия", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674646/kids_e7lr51.webp", icon: Tent, href: "/directions/kids" },
  { id: 6, title: "Организаторам", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674641/organ_zrvvfc.webp", icon: Briefcase, href: "/directions/organizers" },
];

export default function Philosophy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- MODERN SCROLL LOGIC STATES ---
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // --- CHECK SCROLL LIMITS & PROGRESS ---
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);

      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
      setScrollProgress(progress);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // --- MOUSE DRAG TO SCROLL LOGIC ---
  const handleMouseDown = (e: ReactMouseEvent) => {
    setIsDragging(true);
    setDragDistance(0);
    setStartX(e.pageX - scrollContainerRef.current!.offsetLeft);
    setScrollLeftPos(scrollContainerRef.current!.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setDragDistance(0), 50); // Reset after click event resolves
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current!.offsetLeft;
    const walk = (x - startX) * 1.5; // Чувствительность перетаскивания
    setDragDistance(Math.abs(walk));
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollBehavior = 'auto'; // Отключаем плавность для мгновенного следования за мышкой
      scrollContainerRef.current.scrollLeft = scrollLeftPos - walk;
      scrollContainerRef.current.style.scrollBehavior = 'smooth'; // Возвращаем для кнопок
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340 + 16; // Ширина карточки + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section ref={containerRef} className="relative bg-slate-950 py-12 md:py-20 overflow-hidden border-t border-white/5">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      </div>

      <div className="container mx-auto px-4 relative z-20">
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-20">
            
            {/* --- LEFT: STICKY CONTENT --- */}
            <div className="lg:w-1/3 lg:sticky lg:top-32 h-fit z-30 flex flex-col items-start">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-6">
                        <Compass size={14} className="text-teal-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Ценности</span>
                    </div>

                    {/* Title */}
                   <h2 className="text-3xl md:text-6xl uppercase tracking-tighter leading-none mb-3 md:mb-4">
                        <span className="font-light text-slate-400 block md:inline"> Не просто туризм,</span> 
                        <span className="font-black text-white"> а образ жизни</span>
                        <span className="text-teal-500">.</span>
                    </h2>

                    {/* Text */}
                    <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed mb-8 max-w-md border-l-2 border-white/10 pl-4">
                        Мы не продаем билеты в горы. Мы создаем среду, где приключения становятся инструментом самопознания, а группа — семьей.
                    </p>

                    {/* CONTROLS (Desktop Only) */}
                    <div className="hidden lg:flex items-center gap-4 mt-4 select-none">
                        <button 
                            aria-label="Предыдущий слайд" 
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all ${
                                canScrollLeft 
                                    ? 'bg-white/5 text-white hover:bg-teal-500 hover:text-slate-900 hover:border-teal-500 active:scale-95' 
                                    : 'opacity-30 cursor-not-allowed text-slate-500'
                            }`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            aria-label="Следующий слайд"
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all ${
                                canScrollRight 
                                    ? 'bg-white/5 text-white hover:bg-teal-500 hover:text-slate-900 hover:border-teal-500 active:scale-95' 
                                    : 'opacity-30 cursor-not-allowed text-slate-500'
                            }`}
                        >
                            <ChevronRight size={20} />
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">
                            Листайте направления
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* --- RIGHT: SCROLLABLE CARDS --- */}
            <div className="lg:w-2/3 min-w-0">
                
                {/* Mobile Header (Compact) */}
                <div className="lg:hidden mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Направления</span>
                    <ArrowRight size={14} className="text-teal-500 animate-pulse" />
                </div>

                {/* SCROLL CONTAINER (Interactive) */}
                <div 
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    style={{ WebkitOverflowScrolling: 'touch' }}
                    className={`
                        flex gap-4 overflow-x-auto pb-8 -mx-4 px-4 
                        lg:mx-0 lg:px-0 lg:pb-12 hide-scrollbar scroll-smooth
                        ${isDragging ? 'cursor-grabbing select-none snap-none' : 'cursor-grab lg:snap-x lg:snap-mandatory'}
                    `}
                >
                    {directions.map((dir, idx) => (
                        <motion.div
                            key={dir.id}
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="flex-none snap-center"
                            onClick={(e) => dragDistance > 10 && e.preventDefault()} // Защита от миссклика при Drag
                        >
                            <DirectionCard direction={dir} />
                        </motion.div>
                    ))}
                    
                    {/* "More" Card */}
                    <div className="flex-none snap-center w-[200px] md:w-[280px] aspect-[3/4] flex items-center justify-center">
                        <Link 
                            href="/tour" 
                            onClick={(e) => dragDistance > 10 && e.preventDefault()}
                            className="group flex flex-col items-center gap-4 text-center p-6 rounded-[2rem] border border-dashed border-white/10 hover:border-teal-500/50 hover:bg-white/[0.02] transition-all w-full h-full justify-center"
                        >
                            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-900 transition-all">
                                <ArrowRight size={24} className="text-slate-400 group-hover:text-slate-900" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                                Смотреть все туры
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Dynamic Progress Line (Desktop) */}
                <div className="hidden lg:block w-full h-[2px] bg-white/5 mt-[-20px] relative overflow-hidden rounded-full">
                    <div 
                        className="absolute inset-y-0 left-0 bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)] rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.max(15, scrollProgress)}%` }} // Минимум 15%, чтобы ползунок всегда было видно
                    />
                </div>
            </div>

        </div>
      </div>
    </section>
  );
}

// --- CARD COMPONENT ---
function DirectionCard({ direction }: { direction: any }) {
    return (
        <Link 
            href={direction.href} 
            className="
                group block relative 
                w-[280px] md:w-[340px] aspect-[3/4] 
                rounded-[2rem] overflow-hidden 
                bg-slate-900 border border-white/5 shadow-2xl 
                transition-all duration-500 md:hover:-translate-y-2
                z-0 pointer-events-auto
            "
            draggable={false} // Отключаем дефолтный браузерный drag для картинки
        >
            {/* Image */}
            <Image
                src={direction.image}
                alt={direction.title}
                fill
                draggable={false}
                className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0 select-none"
                sizes="(max-width: 768px) 80vw, 25vw"
            />

            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity pointer-events-none" />

            {/* Content */}
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between z-10 pointer-events-none">
                
                {/* Icon */}
                <div className="self-end w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:bg-teal-500 group-hover:text-slate-900 transition-all duration-300 shadow-lg">
                    <direction.icon size={18} />
                </div>

                {/* Text */}
                <div>
                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-[1] mb-3 group-hover:text-teal-400 transition-colors drop-shadow-md">
                        {direction.title}
                    </h3>
                    
                    {/* Hover Link */}
                    <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <span>Подробнее</span>
                        <ArrowUpRight size={14} />
                    </div>
                </div>
            </div>
        </Link>
    );
}