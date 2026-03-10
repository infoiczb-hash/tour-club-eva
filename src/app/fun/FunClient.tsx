"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { m as motion } from "framer-motion";
import { Gamepad2, Backpack, Compass, ArrowRight, Trophy, Sparkles, Shield, Dumbbell, Activity, BookOpen, Brain, Heart, Search, Users, Ghost } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import type { FunTest } from "@prisma/client";

// Старые квизы
import QuizBackpack from "@/features/fun/components/QuizBackpack"; 
import QuizSurvival from "@/features/fun/components/QuizSurvival";
import QuizTouristType from "@/features/fun/components/QuizTouristType";
import QuizTotem from "@/features/fun/components/QuizTotem";
import { useModalStore } from '@/shared/store/useModalStore';


// НОВЫЕ AI-МОДАЛКИ
import FearDebriefModal from "@/features/fun/components/FearDebrief";
import PhysicalReadinessModal from "@/features/fun/components/PhysicalReadiness";
import BodySignalsModal from "@/features/fun/components/BodySignals";
import TourDebriefModal from "@/features/fun/components/TourDebrief";
import PsychProfile from "@/features/fun/components/PsychProfile"; // Если есть

// 1. РЕЕСТР МОДАЛОК (Связываем slug из базы с компонентом)
const MODAL_REGISTRY: Record<string, React.FC<any>> = {
  'fears': FearDebriefModal,
  'physical': PhysicalReadinessModal,
  'signals': BodySignalsModal,
  'debrief': TourDebriefModal,
  'backpack': QuizBackpack,
  'survival': QuizSurvival,
  'totem': QuizTotem,
  'tourist-type': QuizTouristType,
  'psych-profile': PsychProfile,
};

// 2. РЕЕСТР КАТЕГОРИЙ (Для красивых заголовков разделов)
const CATEGORY_UI_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  "Психологические тесты": { label: "Психологические тесты", icon: <Brain size={24} />, color: "purple" },
  "Поддержка в туре": { label: "Поддержка в туре", icon: <Heart size={24} />, color: "rose" },
  "Подбор тура": { label: "Подбор тура", icon: <Search size={24} />, color: "blue" },
  "Какой ты турист?": { label: "Какой ты турист?", icon: <Users size={24} />, color: "emerald" },
  "Юмористические": { label: "Юмористические", icon: <Ghost size={24} />, color: "amber" },
  "Другое": { label: "Интерактивы", icon: <Gamepad2 size={24} />, color: "teal" }
};

// 3. РЕЕСТР ВИЗУАЛА КАРТОЧЕК (Цвета и иконки по slug)
const VISUAL_REGISTRY: Record<string, { color: string; icon: React.ReactNode; badge?: string }> = {
  'fears': { color: "blue", icon: <Shield size={24} strokeWidth={2.5} />, badge: "AI Powered" },
  'physical': { color: "emerald", icon: <Dumbbell size={24} strokeWidth={2.5} />, badge: "AI Powered" },
  'signals': { color: "rose", icon: <Activity size={24} strokeWidth={2.5} />, badge: "AI Powered" },
  'debrief': { color: "purple", icon: <BookOpen size={24} strokeWidth={2.5} />, badge: "AI Powered" },
  'tourist-type': { color: "amber", icon: <Compass size={24} strokeWidth={2.5} /> },
  'backpack': { color: "orange", icon: <Backpack size={24} strokeWidth={2.5} /> },
  'default': { color: "teal", icon: <Sparkles size={24} strokeWidth={2.5} /> }
};

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function FunClient({ activeTests }: { activeTests: FunTest[] }) {
  // Оставляем только управление самим квизом
  const [activeQuizSlug, setActiveQuizSlug] = useState<string | null>(null);
  
  
  const searchParams = useSearchParams();
  
  // ✅ Достаем экшен из стора
  const openContactModal = useModalStore((state) => state.openContactModal);

  useEffect(() => {
    const quizParam = searchParams.get('quiz');
    if (quizParam) setActiveQuizSlug(quizParam);
  }, [searchParams]);

  const handleOldQuizResult = (resultText: string) => {
    setActiveQuizSlug(null); // Плавно закрываем окно квиза
    
    // ✅ Ждем 400мс (пока пройдет анимация закрытия квиза) 
    // и открываем глобальную модалку, сразу передавая ей результат!
    setTimeout(() => {
      openContactModal(resultText, 'TOUR');
    }, 400);
  };

  // 🔥 МАГИЯ: Группируем тесты из БД по категориям
  const groupedContent = useMemo(() => {
    const groups: Record<string, FunTest[]> = {};
    activeTests.forEach(test => {
      const cat = test.category || "Другое";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(test);
    });
    return groups;
  }, [activeTests]);

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* ФОН */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/10 md:blur-[150px] rounded-full opacity-40 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-teal-900/10 md:blur-[150px] rounded-full opacity-30" />
      </div>

      {/* ШАПКА */}
      <section className="relative pt-32 pb-12 px-4 container mx-auto text-center z-10">
        
        {/* 1. Бейдж: появляется сразу (без задержки) */}
        <div 
          className="animate-fade-in-up opacity-0 inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md"
        >
           <Sparkles size={16} className="text-teal-400" />
           <span className="text-xs font-black uppercase tracking-widest text-teal-300">Психология & Игры</span>
        </div>

        {/* 2. Заголовок (LCP): увеличивается с задержкой 100мс */}
        <h1 
          className="animate-hero-title opacity-0 [animation-delay:100ms] text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.9]"
        >
           Твои <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400">Тесты и квизы</span>
        </h1>

        {/* 3. Описание: плавно выезжает с задержкой 200мс */}
        <p 
          className="animate-fade-in-up opacity-0 [animation-delay:200ms] text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium"
        >
           Узнай какой ты турист, проработай страхи, кто ты в туристисеской группе и подбери идеальное приключение. Осторожно: вызывает желание уйти в поход!
        </p>
        
      </section>
      {/* --- ДИНАМИЧЕСКИЕ РАЗДЕЛЫ --- */}
      <div className="container mx-auto px-4 pb-24 relative z-10 space-y-16">
         {/* ✅ ДОБАВИЛИ categoryIndex */}
         {Object.entries(groupedContent).map(([categoryName, tests], categoryIndex) => {
            const config = CATEGORY_UI_CONFIG[categoryName] || { label: categoryName, icon: <Gamepad2 />, color: "teal" };
            
            return (
              <section key={categoryName} className="space-y-8">
                {/* КРАСИВЫЙ ЗАГОЛОВОК КАТЕГОРИИ */}
                <div className="flex items-center gap-4 max-w-6xl mx-auto">
                   <div className={clsx("p-3 rounded-2xl bg-white/5 border border-white/10", `text-${config.color}-400`)}>
                      {config.icon}
                   </div>
                   <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">
                      {config.label}
                   </h2>
                   <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                </div>

                {/* СЕТКА КАРТОЧЕК */}
              <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {/* ✅ ДОБАВИЛИ index */}
                    {tests.map((test, index) => {
                       const visual = VISUAL_REGISTRY[test.slug] || VISUAL_REGISTRY['default'];
                       return (
                         <QuizCard 
                            key={test.id}
                            onClick={() => setActiveQuizSlug(test.slug)}
                            image={test.image || ""}
                            color={visual.color}
                            icon={visual.icon}
                            title={test.title}
                            desc={test.description}
                            category={test.category}
                            // ✅ ПЕРЕДАЕМ ПРИОРИТЕТ ТОЛЬКО ПЕРВОЙ КАРТОЧКЕ ПЕРВОЙ КАТЕГОРИИ
                            priority={categoryIndex === 0 && index === 0} 
                         />
                       );
                    })}
                </motion.div>
              </section>
            );
         })}

         {/* ФИНАЛЬНЫЙ БАННЕР CTA */}
         <motion.div variants={itemVariants} className="max-w-6xl mx-auto bg-gradient-to-r from-teal-900/40 to-slate-900 border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 md:blur-[100px] rounded-full pointer-events-none group-hover:bg-teal-500/20 transition-colors duration-500" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
               <div>
                  <h3 className="text-3xl font-black text-white uppercase mb-2 flex flex-col md:flex-row items-center gap-3">
                     <span className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center"><Trophy size={20} /></span>
                     <span>Готов к практике?</span>
                  </h3>
                  <p className="text-slate-400 max-w-lg text-lg">Теория — это отлично. Но настоящие ответы ждут тебя на маршруте.</p>
               </div>
               <Link href="/tour" className="px-8 py-4 bg-teal-500 text-slate-950 font-black uppercase tracking-wider rounded-2xl hover:bg-teal-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] whitespace-nowrap">
                  Смотреть все туры
               </Link>
            </div>
         </motion.div>
      </div>

      {/* --- ДИНАМИЧЕСКИЙ РЕНДЕР МОДАЛОК --- */}
     {Object.entries(MODAL_REGISTRY).map(([slug, ModalComponent]) => {
        if (!ModalComponent) return null;
        
        const isActive = activeQuizSlug === slug;

        return (
          <ModalComponent 
            key={slug} 
            isOpen={isActive} // 👈 Команда для новых AI-тестов
            open={isActive}   // 👈 Команда для старых тестов (Рюкзак, Выживание и т.д.)
            // Для старых тестов прокидываем onComplete, новые игнорируют
            onComplete={['backpack', 'survival', 'tourist-type', 'totem'].includes(slug) ? handleOldQuizResult : undefined}
            onClose={() => setActiveQuizSlug(null)} 
          />
        );
      })}

     </main>
  );
}

// --- КОМПОНЕНТ КАРТОЧКИ ---
function QuizCard({ onClick, image, color, icon, badge, title, desc, category, priority }: any) {
        const colors: Record<string, string> = {
        orange: "bg-orange-500 shadow-orange-500/20 text-orange-400 group-hover:border-orange-500/50",
        blue: "bg-blue-500 shadow-blue-500/20 text-blue-400 group-hover:border-blue-500/50",
        emerald: "bg-emerald-500 shadow-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/50",
        purple: "bg-purple-600 shadow-purple-500/30 text-purple-400 group-hover:border-purple-500/50",
        amber: "bg-amber-500 shadow-amber-500/20 text-amber-400 group-hover:border-amber-500/50",
        rose: "bg-rose-500 shadow-rose-500/20 text-rose-400 group-hover:border-rose-500/50",
        teal: "bg-teal-500 shadow-teal-500/20 text-teal-400 group-hover:border-teal-500/50",
    };

    const activeColor = colors[color] || colors.teal;

    return (
       <motion.div variants={itemVariants} whileHover={{ y: -8 }} onClick={onClick} className="group relative h-[380px] bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer transition-all shadow-2xl">
           {/* ✅ 2. Передали priority={priority} в компонент Image */}
           {image && <Image src={image} alt={title} fill priority={priority} className="object-cover opacity-50 grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-transform duration-700" />}
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
           
           {badge && (
              <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1.5 shadow-lg z-20">
                 <Sparkles size={12} className={activeColor.split(" ")[2]} />
                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">{badge}</span>
              </div>
           )}
           
           <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
              <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg", activeColor.split(" ").slice(0, 2).join(" "))}>
                 {icon}
              </div>
              <h3 className="text-3xl font-black text-white uppercase mb-3 leading-[0.95] drop-shadow-md" dangerouslySetInnerHTML={{ __html: title.replace('\n', '<br/>') }} />
              <p className="text-sm text-slate-300 font-medium line-clamp-2 mb-6 leading-relaxed drop-shadow-md">{desc}</p>
              
              <div className={clsx("flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all group-hover:gap-4", activeColor.split(" ")[2])}>
                 Начать <ArrowRight size={14} strokeWidth={3} />
              </div>
           </div>
        </motion.div>
    )
}