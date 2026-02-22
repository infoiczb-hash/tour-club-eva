"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Camera } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- ДАННЫЕ ---
const galleryImages = [
  {
    id: 1,
    src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584114/196866761_4343080962371184_6042688601785630843_n_w7jdqu.jpg",
    alt: "Счастливая группа на воде",
    focus: "object-center", 
  },
  {
    id: 2,
    src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584132/104_vapoxq.jpg",
    alt: "Эмоции на байдарке",
    focus: "object-top", // Фокус на лицах
  },
  {
    id: 3,
    src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584228/%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_viber_2025-06-21_11-50-14-080_a7uba5.jpg",
    alt: "Привал на диком пляже",
    focus: "object-center",
  },
  {
    id: 4,
    // Ваша новая фотография
    src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584255/%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_viber_2023-09-23_21-20-27-585_cqucfh.jpg",
    alt: "Командный дух",
    focus: "object-center",
  },
];

export default function Gallery() {
  return (
    <section className="py-12 md:py-20 bg-[#020617] relative overflow-hidden font-sans border-t border-white/5">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-900/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* HEADER */}
        <div className="max-w-3xl mb-12 md:mb-16 text-center md:text-left mx-auto md:mx-0">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
                    <Camera size={14} className="text-teal-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Фотоотчет</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                    Живые <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Эмоции</span>
                </h2>
                <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl leading-relaxed md:mx-0 mx-auto">
                    Лучше один раз увидеть, чем сто раз прочитать. Наши походы — это тысячи счастливых улыбок и гигабайты контента.
                </p>
            </motion.div>
        </div>

        {/* GALLERY GRID */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-4 px-4 md:grid md:grid-cols-2 md:gap-6 md:mx-0 md:px-0 md:auto-rows-[500px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {galleryImages.map((img, idx) => (
                <motion.div
                    key={img.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="group relative flex-shrink-0 snap-center h-[400px] md:h-full w-[85vw] md:w-auto rounded-[2.5rem] overflow-hidden border border-white/5 bg-slate-900 transition-all duration-500 hover:border-teal-500/30 hover:shadow-2xl shadow-teal-500/5"
                >
                    <Image 
                        src={img.src} 
                        alt={img.alt} 
                        fill 
                        className={cn(
                            "object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0",
                            img.focus
                        )}
                        sizes="(max-width: 768px) 85vw, 50vw"
                    />
                    
                    {/* Кинематографичный градиент */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-500" />
                    
                    {/* Цветной оверлей при наведении */}
                    <div className="absolute inset-0 bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay pointer-events-none" />
                </motion.div>
            ))}
        </div>

      </div>
    </section>
  );
}