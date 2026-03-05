"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Camera, ChevronRight } from "lucide-react"; // 🔥 Добавили ChevronRight
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
    src: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584255/%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_viber_2023-09-23_21-20-27-585_cqucfh.jpg",
    alt: "Командный дух",
    focus: "object-center",
  },
];

export default function Gallery() {
  return (
    <section className="py-12 md:py-20 bg-[#020617] relative overflow-hidden font-sans border-t border-white/5">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />

      {/* Убрали лишние классы из контейнера, оставив строгую структуру */}
      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* 🔥 1 и 2. HEADER: Убрали центрирование (text-center, mx-auto) и уменьшили отступ снизу (mb-8) */}
        <div className="max-w-3xl mb-8 md:mb-12 text-left">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
                    <Camera size={14} className="text-teal-400" />
                    <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">Фотоотчет</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                    Живые <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Эмоции</span>
                </h2>
                {/* 🔥 Выровняли текст параграфа */}
                <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl leading-relaxed">
                    Лучше один раз увидеть, чем сто раз прочитать. Наши походы — это тысячи счастливых улыбок и гигабайты контента.
                </p>
            </motion.div>
        </div>

        {/* 🔥 3. GALLERY GRID + ПОДСКАЗКА: Обернули в relative */}
        <div className="relative">
            {/* Чуть увеличили pb-10 на мобилке, чтобы стрелке было где дышать */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-2 md:gap-6 md:mx-0 md:px-0 md:auto-rows-[500px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
    className={cn("object-cover transition-transform duration-1000 ...", img.focus)}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
                        
                        {/* Кинематографичный градиент */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-500" />
                        
                        {/* Цветной оверлей при наведении */}
                        <div className="absolute inset-0 bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay pointer-events-none" />
                    </motion.div>
                ))}
            </div>

            {/* 🔥 Подсказка "Мотай" */}
            <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
                <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                <ChevronRight size={14} />
            </div>
        </div>

      </div>
    </section>
  );
}