'use client';

import { motion } from 'framer-motion';
import { Flame, Compass } from 'lucide-react';
import Image from 'next/image';

export default function KidsHero({ onScrollDown }: { onScrollDown?: () => void }) {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pb-12">
      
      {/* ФОН: Темный и атмосферный */}
      <div className="absolute inset-0 z-0">
        <Image 
          // Замените на вашу реальную фотографию детей у костра, если есть
          src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771662349/kids-bg_don8xd.webp"
          alt="Дети у костра"
          fill
          className="object-cover opacity-40 md:opacity-50"
          priority
        />
        {/* Градиент для читаемости текста */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center mt-20 md:mt-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Бейдж */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md rounded-full mb-8">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold tracking-widest text-amber-400 uppercase">
              Детское направление
            </span>
          </div>

          {/* Заголовок */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tighter">
            ВМЕСТО ЭКРАНА <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              КОСТЁР
            </span>
          </h1>

          {/* Описание */}
          <p className="text-base md:text-xl text-slate-300 mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
            Мы возвращаем детям детство. Настоящие друзья и приключения, которыми гордишься.
          </p>

          {/* Кнопка плавного скролла (как в SUP) */}
          <button 
            onClick={onScrollDown}
            className="group px-8 py-4 bg-amber-500 text-slate-950 font-black uppercase tracking-wider text-sm rounded-2xl hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(245,158,11,0.3)] flex items-center gap-3 mx-auto"
          >
            <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
            <span>Выбрать формат</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}