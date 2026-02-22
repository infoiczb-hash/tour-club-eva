"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Gamepad2, Compass, Flame, Backpack } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// РЕАЛЬНЫЕ ДАННЫЕ + ФОТО ИЗ ПРОЕКТА
const QUIZZES = [
  {
    id: 'tourist-type',
    title: 'Кто ты в горах?',
    description: 'Психологический тест. Узнай свой идеальный маршрут.',
    icon: Compass,
    image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675801/fun1_bo3tsi.webp',
    borderColor: 'group-hover:border-emerald-500/50',
    iconColor: 'text-emerald-400',
    link: '/fun?quiz=tourist-type'
  },
  {
    id: 'survival',
    title: 'Выживешь в походе?',
    description: 'Ситуации: дождь, медведи и гречка.',
    icon: Flame,
    image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675803/fun2_c27m1l.webp',
    borderColor: 'group-hover:border-orange-500/50',
    iconColor: 'text-orange-400',
    link: '/fun?quiz=survival'
  },
  {
    id: 'backpack',
    title: 'Собери рюкзак',
    description: 'Мини-игра: выбери только нужное.',
    icon: Backpack,
    image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675806/fun3_quee6m.webp',
    borderColor: 'group-hover:border-blue-500/50',
    iconColor: 'text-blue-400',
    link: '/fun?quiz=backpack'
  }
];

export default function FunSectorWidget() {
  return (
    <section className="py-12 md:py-20 bg-slate-950 relative overflow-hidden border-t border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        <div className="flex flex-row items-end justify-between gap-4 mb-6 md:mb-10">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-950/30 backdrop-blur-md mb-3 md:mb-4">
                    <Gamepad2 size={14} className="text-violet-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Только фан</span>
                </div>
                <h2 className="text-2xl md:text-4xl uppercase tracking-tighter leading-[0.9] text-white font-black">
                    Фан-Сектор
                </h2>
            </div>

            <Link 
                href="/fun" 
                className="hidden md:flex group items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
                <span>Все игры</span>
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-violet-500 group-hover:border-violet-500 group-hover:text-white transition-all">
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
            </Link>
        </div>

        {/* СЕТКА (Теперь 3 колонки в 1 ряд на десктопе, компактно по высоте) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
            {QUIZZES.map((quiz, idx) => (
                <motion.div 
                    key={quiz.id}
                    initial={{ opacity: 0, y: 15 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }} 
                    transition={{ delay: idx * 0.1 }}
                >
                    <QuizCard quiz={quiz} />
                </motion.div>
            ))}
        </div>

        {/* Кнопка на мобильных (Внизу) */}
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="mt-5 md:hidden">
            <Link 
                href="/fun" 
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white hover:bg-violet-500 hover:border-violet-500 transition-colors active:scale-[0.98]"
            >
                <span>Все игры и квизы</span>
                <ArrowRight size={16} />
            </Link>
        </motion.div>

      </div>
    </section>
  );
}

// ОБНОВЛЕННАЯ КОМПАКТНАЯ КАРТОЧКА С ФОТО
function QuizCard({ quiz }: { quiz: typeof QUIZZES[0] }) {
    const Icon = quiz.icon;
    
    return (
        <Link 
            href={quiz.link} 
            className={cn(
                "group relative flex w-full overflow-hidden border border-white/10 transition-all duration-500 bg-slate-900",
                quiz.borderColor,
                "hover:shadow-2xl md:hover:-translate-y-1",
                // Мобильный: горизонтальная плашка. Десктоп: вертикальная карточка (но невысокая)
                "flex-row lg:flex-col items-center lg:items-start rounded-2xl md:rounded-[2rem]",
                "min-h-[100px] lg:min-h-[200px] p-4 lg:p-6"
            )}
        >
            {/* ФОНОВОЕ ИЗОБРАЖЕНИЕ */}
            <Image
                src={quiz.image}
                alt={quiz.title}
                fill
                className="object-cover opacity-40 grayscale-[50%] group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
            />
            {/* ГРАДИЕНТ ДЛЯ ЧИТАЕМОСТИ ТЕКСТА */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />

            {/* КОНТЕНТ */}
            <div className="relative z-10 flex w-full h-full flex-row lg:flex-col items-center lg:items-start">
                
                {/* Иконка */}
                <div className={cn(
                    "flex items-center justify-center rounded-xl bg-slate-950/50 backdrop-blur-md border border-white/10 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500",
                    "w-12 h-12 mr-4 lg:mr-0 lg:mb-auto"
                )}>
                    <Icon size={22} className={quiz.iconColor} />
                </div>

                {/* Текст */}
                <div className="flex-1 lg:mt-6">
                    <h3 className="font-black text-white uppercase text-sm md:text-lg lg:text-xl leading-tight mb-1 lg:mb-2 drop-shadow-md">
                        {quiz.title}
                    </h3>
                    
                    {/* Описание видно только на десктопе, чтобы экономить место на мобайле */}
                    <p className="hidden lg:block text-slate-300 font-medium text-xs lg:text-sm line-clamp-2 drop-shadow-md">
                        {quiz.description}
                    </p>
                </div>

                {/* Стрелочка на мобильных */}
                <div className="lg:hidden shrink-0 ml-3 text-white/50 group-hover:text-white transition-colors">
                    <ArrowRight size={18} />
                </div>

                {/* Кнопка "Начать" на десктопе */}
                <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors mt-4">
                    <span>Начать тест</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
}