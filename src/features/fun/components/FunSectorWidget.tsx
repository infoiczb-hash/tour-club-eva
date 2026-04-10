"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Gamepad2, Compass, Flame, Backpack, Shield, Dumbbell, Activity, BookOpen, Brain, Sparkles, Trophy } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";
import { FunTest } from '@prisma/client';
import { QUIZ_VISUAL_CONFIG } from './constants';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function useInView(options = { threshold: 0.1, rootMargin: '-30px' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      options
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

const VISUAL_REGISTRY: Record<string, { icon: React.ElementType, iconColor: string, borderColor: string }> = {
  'fears': { icon: Shield, iconColor: "text-blue-400", borderColor: "group-hover:border-blue-500/50" },
  'physical': { icon: Dumbbell, iconColor: "text-emerald-400", borderColor: "group-hover:border-emerald-500/50" },
  'signals': { icon: Activity, iconColor: "text-rose-400", borderColor: "group-hover:border-rose-500/50" },
  'debrief': { icon: BookOpen, iconColor: "text-purple-400", borderColor: "group-hover:border-purple-500/50" },
  'psych-profile': { icon: Brain, iconColor: "text-fuchsia-400", borderColor: "group-hover:border-fuchsia-500/50" },
  'tourist-type': { icon: Compass, iconColor: "text-amber-400", borderColor: "group-hover:border-amber-500/50" },
  'backpack': { icon: Backpack, iconColor: "text-orange-400", borderColor: "group-hover:border-orange-500/50" },
  'survival': { icon: Flame, iconColor: "text-red-400", borderColor: "group-hover:border-red-500/50" },
  'default': { icon: Sparkles, iconColor: "text-teal-400", borderColor: "group-hover:border-teal-500/50" }
};

const FALLBACK_QUIZZES = [
  { id: '1', slug: 'tourist-type', title: 'Кто ты в горах?', description: 'Узнай свой идеальный маршрут.', image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675801/fun1_bo3tsi.webp', category: 'Какой ты турист?' },
  { id: '2', slug: 'survival', title: 'Выживешь в походе?', description: 'Ситуации: дождь, медведи и гречка.', image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675803/fun2_c27m1l.webp', category: 'Юмористические' },
  { id: '3', slug: 'backpack', title: 'Собери рюкзак', description: 'Мини-игра: выбери только нужное.', image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675806/fun3_quee6m.webp', category: 'Игры' }
] as FunTest[];

export default function FunSectorWidget({ activeTests }: { activeTests?: FunTest[] }) {
  const [quizzes, setQuizzes] = useState<FunTest[]>(FALLBACK_QUIZZES);
  const [isLoaded, setIsLoaded] = useState(false);
  const ctaView = useInView();

  useEffect(() => {
    let isMounted = true;

    const fetchAndShuffleQuizzes = async () => {
      try {
        if (!activeTests || activeTests.length === 0) { 
          setIsLoaded(true); 
          return; 
        }

        const shuffled = [...activeTests].sort(() => 0.5 - Math.random());

        if (isMounted) { 
          setQuizzes(shuffled.slice(0, 3)); 
          setIsLoaded(true); 
        }
      } catch (error) { 
        console.error(error);
        setIsLoaded(true); 
      }
    };

    fetchAndShuffleQuizzes();
    
    return () => { isMounted = false; };
  }, [activeTests]);
  
  return (
    <section className="py-12 md:py-20 bg-slate-950 relative overflow-hidden border-t border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-900/10 md:blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="flex flex-row items-end justify-between gap-4 mb-6 md:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-950/30 backdrop-blur-md mb-3 md:mb-4">
              <Gamepad2 size={14} className="text-violet-400" />
              <span className="text-[16px] font-bold uppercase tracking-widest text-violet-400">Психология и игры</span>
            </div>
            <h2 className="text-2xl md:text-4xl uppercase tracking-tighter leading-[0.9] text-white font-black">Тесты и квизы</h2>
          </div>
          <Link href="/fun" className="hidden md:flex group items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">
            <span>Все тесты и квизы</span>
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-violet-500 group-hover:border-violet-500 group-hover:text-white transition-all">
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 min-h-[100px] lg:min-h-[200px]">
            {quizzes.map((quiz, idx) => (
              <div
                key={`${quiz.id}-${isLoaded ? 'loaded' : 'initial'}`}
                className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <QuizCard quiz={quiz} />
              </div>
            ))}
        </div>

        <div
          ref={ctaView.ref}
          style={{ opacity: ctaView.inView ? 1 : 0, transform: ctaView.inView ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s' }}
          className="mt-5 md:hidden"
        >
          <Link href="/fun" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white hover:bg-violet-500 hover:border-violet-500 transition-colors active:scale-[0.98]">
            <span>Все тесты и квизы</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuizCard({ quiz }: { quiz: FunTest }) {
 const visual = QUIZ_VISUAL_CONFIG[quiz.slug] || QUIZ_VISUAL_CONFIG['default'];
  const Icon = visual.icon;

  // ❌ МЫ ПОЛНОСТЬЮ УДАЛИЛИ sanitizeHtml ОТСЮДА

  return (
    <Link href={`/fun?quiz=${quiz.slug}`} className={cn(
      "group relative flex w-full h-full overflow-hidden border border-white/10 transition-all duration-500 bg-slate-900",
      visual.borderColor, "hover:shadow-2xl md:hover:-translate-y-2",
      "flex-row lg:flex-col items-center lg:items-start rounded-2xl md:rounded-[2rem]", "p-4 lg:p-6"
    )}>
      {quiz.image && (
        <Image src={quiz.image} alt="" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover opacity-40 grayscale-[50%] group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
      <div className="relative z-10 flex w-full h-full flex-row lg:flex-col items-center lg:items-start">
        <div className={cn("flex items-center justify-center rounded-xl bg-slate-950/50 backdrop-blur-md border border-white/10 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500", "w-12 h-12 mr-4 lg:mr-0 lg:mb-auto")}>
          <Icon size={22} className={visual.iconColor} />
        </div>
        <div className="flex-1 lg:mt-6 w-full">
          <div className="hidden lg:block text-[9px] font-bold uppercase tracking-widest text-slate-300 mb-2">{quiz.category}</div>
          
          {/* ✅ БЕЗОПАСНЫЙ НАТИВНЫЙ РЕНДЕР БЕЗ SANITIZE-HTML */}
          <h3 className="font-black text-white uppercase text-sm md:text-lg lg:text-xl leading-tight mb-1 lg:mb-2 drop-shadow-md">
            {quiz.title.split('\n').map((line, idx, array) => (
              <React.Fragment key={idx}>
                {line}
                {idx < array.length - 1 && <br />}
              </React.Fragment>
            ))}
          </h3>
          
          <p className="hidden lg:block text-slate-300 font-medium text-xs lg:text-sm line-clamp-2 drop-shadow-md">{quiz.description}</p>
        </div>
        <div className="lg:hidden shrink-0 ml-3 text-white/50 group-hover:text-white transition-colors"><ArrowRight size={18} /></div>
        <div className="hidden lg:flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors mt-4">
          <span>Начать тест</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}