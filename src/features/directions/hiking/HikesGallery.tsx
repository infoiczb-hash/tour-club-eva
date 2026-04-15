'use client';

import React from 'react';
import { Camera, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";
import { useInView } from '@/hooks/useInView';
import SwipeHint from '@/shared/ui/SwipeHint';    

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const GALLERY_ITEMS = [
    {
        id: 1,
        title: "Масштаб",
        subtitle: "Среди величественных вершин",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838444/photo_5294161935740294707_w_osfd8l.jpg",
        className: "md:col-span-2 md:row-span-2 h-[400px] md:h-full", 
    },
    {
        id: 2,
        title: "Атмосфера",
        subtitle: "Туманные рассветы",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838472/8_mb7oso.jpg",
        className: "md:col-span-2 md:row-span-1 h-[400px] md:h-auto", 
    },
    {
        id: 3,
        title: "Моменты",
        subtitle: "Красота в деталях",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838488/%D0%BE%D1%81%D0%B5%D0%BD%D1%8C8_m6f3ja.jpg",
        className: "md:col-span-1 md:row-span-1 h-[400px] md:h-auto", 
    },
    {
        id: 4,
        title: "Привал",
        subtitle: "Отдых на тропе",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838501/1%D0%BE%D1%81%D0%B5%D0%BD%D1%8C_helnpn.jpg",
        className: "md:col-span-1 md:row-span-1 h-[400px] md:h-auto", 
    },
    {
        id: 5,
        title: "Путь",
        subtitle: "Дорога к облакам",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838649/3_x7hpes.jpg",
        className: "md:col-span-2 md:row-span-1 h-[400px] md:h-auto", 
    },
    {
        id: 6,
        title: "Свобода",
        subtitle: "Весь мир на ладони",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838760/8_e69ysh.jpg",
        className: "md:col-span-1 md:row-span-1 h-[400px] md:h-auto", 
    },
    {
        id: 7,
        title: "Команда",
        subtitle: "Вместе теплее",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838702/photo_5449540439326709334_y_rksj5c.jpg",
        className: "md:col-span-1 md:row-span-1 h-[400px] md:h-auto", 
    }
];

export default function HikesGallery() {
    const headerView = useInView({ threshold: 0.1, rootMargin: '-50px' });
    const galleryView = useInView({ threshold: 0.1, rootMargin: '-50px' });

    return (
        <section className="py-8 md:py-16 bg-stone-950 border-t border-white/5 relative overflow-hidden">
            
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none opacity-50" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                <div 
                    ref={headerView.ref}
                    style={{ opacity: headerView.inView ? 1 : 0, transform: headerView.inView ? 'translateX(0)' : 'translateX(-20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
                    className="text-left mb-8 md:mb-12 max-w-3xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-full mb-4 md:mb-6 backdrop-blur-md">
                        <Camera className="w-4 h-4 text-stone-400" />
                        <span className="text-[12px] md:text-[14px] font-bold tracking-widest text-stone-300 uppercase">
                            Фотоархив
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                        ЭМОЦИИ БЕЗ <span className="text-teal-500">ФИЛЬТРОВ</span>
                    </h2>
                    <p className="text-[14px] md:text-base text-stone-400 font-medium leading-relaxed">
                        В каждой тропе есть история. Никаких постановочных кадров — только настоящие моменты, прожитые в горах.
                    </p>
                </div>

                <div className="relative" ref={galleryView.ref}>
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-4 md:auto-rows-[250px] md:gap-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {GALLERY_ITEMS.map((item, i) => (
                            <div
                                key={item.id}
                                style={{ opacity: galleryView.inView ? 1 : 0, transform: galleryView.inView ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s` }}
                                className={cn(
                                    "relative shrink-0 snap-center w-[85vw] md:w-auto rounded-[2rem] overflow-hidden group isolate border border-white/10 bg-stone-900 shadow-xl cursor-pointer",
                                    item.className
                                )}
                            >
                                <Image 
                                    src={item.img} 
                                    alt={item.subtitle} 
                                    fill 
                                    className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                                />
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent pointer-events-none transition-opacity duration-500 group-hover:opacity-50" />

                                <div className="absolute bottom-0 left-0 w-full p-6 z-10">
                                    <div className="text-teal-400 font-bold uppercase tracking-widest text-[12px] md:text-xs mb-1.5">
                                        {item.title}
                                    </div>
                                    <div className="text-white font-bold text-lg md:text-xl leading-tight drop-shadow-md">
                                        {item.subtitle}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                      <SwipeHint />
                </div>

            </div>
        </section>
    );
}