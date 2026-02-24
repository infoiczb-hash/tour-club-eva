"use client";

import React, { useRef, useState, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from "framer-motion";
import { 
  Mountain, Waves, Tent, Briefcase, 
  ArrowUpRight, Compass, Anchor, ArrowRight, ChevronLeft, ChevronRight,
  MoveRight
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

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
    setTimeout(() => setDragDistance(0), 50);
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current!.offsetLeft;
    const walk = (x - startX) * 1.5; 
    setDragDistance(Math.abs(walk));
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollBehavior = 'auto'; 
      scrollContainerRef.current.scrollLeft = scrollLeftPos - walk;
      scrollContainerRef.current.style.scrollBehavior = 'smooth'; 
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 356 : 300; // Ширина карточки + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    // ИСПРАВЛЕНО: Заменили bg-[#0b1016] на системный bg-slate-950
    <section ref={containerRef} className="relative bg-slate-950 py-16 md:py-24 overflow-hidden border-t border-white/5">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-900/10 blur-[150px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-20">
        
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            
            {/* --- LEFT: STICKY CONTENT --- */}
            <div className="lg:w-1/3 lg:sticky lg:top-32 h-fit z-30 flex flex-col items-start">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="w-full"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 backdrop-blur-md mb-6">
                        <Compass size={16} className="text-teal-400" />
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-teal-300">Ценности</span>
                    </div>

                    {/* Title */}
                   <h2 className="text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-[1.1] mb-6">
                        <span className="font-light text-slate-400 block md:inline"> Не просто туризм,</span> 
                        <span className="font-black text-white"> а образ жизни</span>
                        <span className="text-teal-500">.</span>
                    </h2>

                    {/* Text */}
                    <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed mb-8 max-w-md border-l-2 border-teal-500/50 pl-5">
                        Мы не продаем билеты в горы. Мы создаем среду, где приключения становятся инструментом самопознания, а группа — семьей.
                    </p>

                    {/* ИСПРАВЛЕНО: Десктопные контролы выстроены в один ряд (flex-row) */}
                    <div className="hidden lg:flex flex-row flex-wrap items-center justify-between gap-4 w-full mt-4">
                        {/* Desktop Controls (Left side of the row) */}
                        <div className="flex items-center gap-3 select-none shrink-0">
                            <button 
                                aria-label="Предыдущий слайд" 
                                onClick={() => scroll('left')}
                                disabled={!canScrollLeft}
                                className={cn(
                                    "w-12 h-12 xl:w-14 xl:h-14 rounded-full border flex items-center justify-center transition-all duration-300",
                                    canScrollLeft 
                                        ? "bg-slate-900 border-white/10 text-white hover:bg-teal-500 hover:text-slate-900 hover:border-teal-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] active:scale-95" 
                                        : "bg-transparent border-white/5 opacity-30 cursor-not-allowed text-slate-500"
                                )}
                            >
                                <ChevronLeft size={24} strokeWidth={2} />
                            </button>
                            <button 
                                aria-label="Следующий слайд"
                                onClick={() => scroll('right')}
                                disabled={!canScrollRight}
                                className={cn(
                                    "w-12 h-12 xl:w-14 xl:h-14 rounded-full border flex items-center justify-center transition-all duration-300",
                                    canScrollRight 
                                        ? "bg-slate-900 border-white/10 text-white hover:bg-teal-500 hover:text-slate-900 hover:border-teal-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] active:scale-95" 
                                        : "bg-transparent border-white/5 opacity-30 cursor-not-allowed text-slate-500"
                                )}
                            >
                                <ChevronRight size={24} strokeWidth={2} />
                            </button>
                        </div>

                        {/* Desktop "All Directions" Link (Right side of the row) */}
                        <Link 
                            href="/directions" 
                            className="inline-flex items-center justify-center gap-2 xl:gap-3 px-5 xl:px-6 py-3.5 xl:py-4 bg-white/5 hover:bg-white text-white hover:text-slate-950 text-xs xl:text-sm font-black uppercase tracking-widest rounded-2xl transition-all duration-300 border border-white/10 hover:border-white shadow-lg shrink-0 group"
                        >
                            Все направления
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* --- RIGHT: SCROLLABLE CARDS --- */}
            <div className="lg:w-2/3 min-w-0 flex flex-col">
                
                {/* Mobile Header (Свайп Индикатор) */}
                <div className="lg:hidden mb-6 flex items-center justify-between pl-2">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-300">Направления</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 shadow-inner">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Свайпай</span>
                        <MoveRight size={14} className="text-teal-400 animate-pulse" />
                    </div>
                </div>

                {/* SCROLL CONTAINER */}
                <div 
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    style={{ WebkitOverflowScrolling: 'touch' }}
                    className={cn(
                        "flex gap-4 sm:gap-6 overflow-x-auto pb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:pb-12 hide-scrollbar scroll-smooth",
                        isDragging ? "cursor-grabbing select-none snap-none" : "cursor-grab lg:snap-x lg:snap-mandatory"
                    )}
                >
                    {directions.map((dir, idx) => (
                        <motion.div
                            key={dir.id}
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="flex-none snap-center"
                            onClick={(e) => dragDistance > 10 && e.preventDefault()}
                        >
                            <DirectionCard direction={dir} />
                        </motion.div>
                    ))}
                </div>

                {/* Dynamic Progress Line (Desktop) */}
                <div className="hidden lg:block w-full h-1 bg-slate-900 mt-[-20px] relative overflow-hidden rounded-full">
                    <div 
                        className="absolute inset-y-0 left-0 bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.8)] rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.max(10, scrollProgress)}%` }} 
                    />
                </div>

                {/* Mobile "All Directions" Button (Огромный CTA снизу) */}
                <div className="lg:hidden mt-2 flex justify-center w-full">
                    <Link 
                        href="/directions" 
                        className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-slate-900 border border-white/10 hover:border-teal-500 hover:bg-teal-500 text-slate-300 hover:text-slate-950 text-sm font-black uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-xl group active:scale-[0.98]"
                    >
                        Все 6 направлений
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                    </Link>
                </div>

            </div>

        </div>
      </div>
    </section>
  );
}

// --- CARD COMPONENT (Premium Glass UI) ---
function DirectionCard({ direction }: { direction: any }) {
    return (
        <Link 
            href={direction.href} 
            className="
                group block relative 
                w-[280px] sm:w-[320px] aspect-[4/5] sm:aspect-[3/4] 
                rounded-[2rem] overflow-hidden 
                bg-slate-900 border-2 border-white/5 shadow-2xl 
                transition-all duration-500 hover:-translate-y-2 hover:border-teal-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]
                z-0 outline-none
            "
            draggable={false}
        >
            {/* Image (Убрали серый фильтр, добавили легкое затемнение) */}
            <Image
                src={direction.image}
                alt={direction.title}
                fill
                draggable={false}
                className="object-cover transition-transform duration-700 group-hover:scale-105 select-none"
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 33vw"
            />

            {/* Gradients для читаемости (Не убивает цвета фото) */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />

            {/* Content Container */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 pointer-events-none">
                
                {/* Icon (Glassmorphism) */}
                <div className="self-end w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:rotate-6">
                    <direction.icon size={20} strokeWidth={2} />
                </div>

                {/* Bottom Content (Title + Persistent Button) */}
                <div className="flex flex-col gap-3 mt-auto transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-[1.1] drop-shadow-xl">
                        {direction.title}
                    </h3>
                    
                    {/* Always visible action row */}
                    <div className="flex items-center justify-between w-full pt-2 border-t border-white/10">
                        <span className="text-xs font-black uppercase tracking-widest text-teal-400 group-hover:text-white transition-colors drop-shadow-md">
                            Подробнее
                        </span>
                        <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 transition-all duration-300 shadow-[0_0_15px_rgba(20,184,166,0.4)] group-hover:scale-110 group-hover:bg-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                            <ArrowUpRight size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}