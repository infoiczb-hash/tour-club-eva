"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Gamepad2, Backpack, Flame, Compass, ArrowRight, Trophy, Moon, Sparkles, Shield, Dumbbell, Activity, BookOpen } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

// Старые квизы
import QuizBackpack from "@/features/fun/components/QuizBackpack"; 
import QuizSurvival from "@/features/fun/components/QuizSurvival";
import QuizTouristType from "@/features/fun/components/QuizTouristType";
import QuizTotem from "@/features/fun/components/QuizTotem";
import ContactHubModal from "@/components/modals/ContactHubModal";

// НОВЫЕ AI-МОДАЛКИ
import FearDebriefModal from "@/features/fun/components/FearDebrief";
import PhysicalReadinessModal from "@/features/fun/components/PhysicalReadiness";
import BodySignalsModal from "@/features/fun/components/BodySignals";
import TourDebriefModal from "@/features/fun/components/TourDebrief";

type QuizType = 'backpack' | 'survival' | 'tourist-type' | 'totem' | 'fears' | 'physical' | 'signals' | 'debrief' | null;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

function FunSectorContent() {
  const [activeQuiz, setActiveQuiz] = useState<QuizType>(null);
  
  // Для старых тестов (вызов контакт-центра)
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [hubContext, setHubContext] = useState<string | undefined>(undefined);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const quizParam = searchParams.get('quiz');
    if (quizParam) {
      setActiveQuiz(quizParam as QuizType);
    }
  }, [searchParams]);

  // Обработчик для старых квизов
  const handleOldQuizResult = (resultText: string) => {
    setActiveQuiz(null);
    setHubContext(resultText);
    setTimeout(() => setIsHubOpen(true), 400);
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* BACKGROUND AMBIENCE */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/10 blur-[150px] rounded-full opacity-40 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-teal-900/10 blur-[150px] rounded-full opacity-30" />
      </div>

      {/* 1. HERO HEADER */}
      <section className="relative pt-32 pb-16 px-4 container mx-auto text-center z-10">
        <motion.div 
           initial={{ opacity: 0, y: 20 }} 
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md"
        >
           <Sparkles size={16} className="text-teal-400" />
           <span className="text-xs font-black uppercase tracking-widest text-teal-300">Психология & Игры</span>
        </motion.div>
        
        <motion.h1 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.9]"
        >
           Твой <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400">Фан-Сектор</span>
        </motion.h1>
        <motion.p 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium"
        >
           Узнай себя, проработай страхи с AI-психологом и подбери идеальное приключение. Осторожно: вызывает непреодолимое желание уйти в поход!
        </motion.p>
      </section>

      {/* 2. BENTO GRID (MENU) */}
      <section className="container mx-auto px-4 pb-24 relative z-10">
         <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
         >
            {/* --- НОВЫЕ AI-ТЕСТЫ --- */}
            <QuizCard 
               onClick={() => setActiveQuiz('fears')}
               image="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675801/fun4_ppqvoy.webp"
               color="blue"
               icon={<Shield size={24} strokeWidth={2.5}/>}
               title={<>Разбор <br/>страхов</>}
               desc="AI-психолог проанализирует, что тебя останавливает, и подберет безопасный старт."
               cta="Начать разбор"
               badge="AI Powered"
            />

            <QuizCard 
               onClick={() => setActiveQuiz('physical')}
               image="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674641/hiking_modikx.webp"
               color="emerald"
               icon={<Dumbbell size={24} strokeWidth={2.5}/>}
               title={<>Готов ли я <br/>физически?</>}
               desc="Оцени свою форму и получи тур, в котором тебе будет комфортно."
               cta="Оценить форму"
               badge="AI Powered"
            />

            <QuizCard 
               onClick={() => setActiveQuiz('signals')}
               image="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584228/%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_viber_2025-06-21_11-50-14-080_a7uba5.jpg"
               color="rose"
               icon={<Activity size={24} strokeWidth={2.5}/>}
               title={<>Симптомы <br/>в туре</>}
               desc="Что говорит твое тело? Узнай, почему болят колени или нет аппетита."
               cta="Узнать диагноз"
               badge="AI Powered"
            />

            <QuizCard 
               onClick={() => setActiveQuiz('debrief')}
               image="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669025/2_e0imrh.jpg"
               color="purple"
               icon={<BookOpen size={24} strokeWidth={2.5}/>}
               title={<>Рефлексия <br/>опыта</>}
               desc="Вернулся из похода? AI-психолог поможет зафиксировать инсайты и выбрать следующий шаг."
               cta="Написать дневник"
               badge="AI Powered"
            />

            {/* --- СТАРЫЕ КВИЗЫ --- */}
            <QuizCard 
               onClick={() => setActiveQuiz('tourist-type')}
               image="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675803/fun2_c27m1l.webp"
               color="amber"
               icon={<Compass size={24} strokeWidth={2.5}/>}
               title={<>Кто ты <br/>в горах?</>}
               desc="Узнай свой стиль путешествий и идеальный маршрут."
               cta="Пройти квиз"
            />

            <QuizCard 
               onClick={() => setActiveQuiz('backpack')}
               image="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675806/fun3_quee6m.webp"
               color="orange"
               icon={<Backpack size={24} strokeWidth={2.5}/>}
               title={<>Собери <br/>рюкзак</>}
               desc="Игра: выбери только нужное. Утюг или горелка?"
               cta="Играть"
            />

            {/* CTA BANNER */}
            <motion.div 
               variants={itemVariants}
               className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-teal-900/40 to-slate-900 border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-teal-500/20 transition-colors duration-500" />
               
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                  <div>
                     <h3 className="text-3xl font-black text-white uppercase mb-2 flex flex-col md:flex-row items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center"><Trophy size={20} /></span>
                        <span>Готов к практике?</span>
                     </h3>
                     <p className="text-slate-400 max-w-lg text-lg">
                        Теория и психология — это отлично. Но настоящие ответы ждут тебя на маршруте.
                     </p>
                  </div>
                  <Link 
                     href="/tour" 
                     className="px-8 py-4 bg-teal-500 text-slate-950 font-black uppercase tracking-wider rounded-2xl hover:bg-teal-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] whitespace-nowrap"
                  >
                     Смотреть все туры
                  </Link>
               </div>
            </motion.div>

         </motion.div>
      </section>

      {/* --- MODALS (Старые) --- */}
      <QuizSurvival open={activeQuiz === 'survival'} onClose={() => setActiveQuiz(null)} onComplete={handleOldQuizResult} />
      <QuizBackpack open={activeQuiz === 'backpack'} onClose={() => setActiveQuiz(null)} onComplete={handleOldQuizResult} />
      <QuizTouristType open={activeQuiz === 'tourist-type'} onClose={() => setActiveQuiz(null)} onComplete={handleOldQuizResult} />
      <QuizTotem open={activeQuiz === 'totem'} onClose={() => setActiveQuiz(null)} onComplete={handleOldQuizResult} />

      {/* --- MODALS (Новые AI) --- */}
      <FearDebriefModal isOpen={activeQuiz === 'fears'} onClose={() => setActiveQuiz(null)} />
      <PhysicalReadinessModal isOpen={activeQuiz === 'physical'} onClose={() => setActiveQuiz(null)} />
      <BodySignalsModal isOpen={activeQuiz === 'signals'} onClose={() => setActiveQuiz(null)} />
      <TourDebriefModal isOpen={activeQuiz === 'debrief'} onClose={() => setActiveQuiz(null)} />

      <ContactHubModal 
        isOpen={isHubOpen} 
        onClose={() => setIsHubOpen(false)} 
        initialTab="TOUR"
        tourContext={hubContext}
      />
    </main>
  );
}

export default function FunSectorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center" />}>
      <FunSectorContent />
    </Suspense>
  );
}

// --- SUB COMPONENT: CARD ---
function QuizCard({ onClick, image, color, icon, title, desc, cta, badge }: any) {
    const colors: Record<string, string> = {
        orange: "bg-orange-500 shadow-orange-500/20 text-orange-400 group-hover:border-orange-500/50",
        blue: "bg-blue-500 shadow-blue-500/20 text-blue-400 group-hover:border-blue-500/50",
        emerald: "bg-emerald-500 shadow-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/50",
        purple: "bg-purple-600 shadow-purple-500/30 text-purple-400 group-hover:border-purple-500/50",
        amber: "bg-amber-500 shadow-amber-500/20 text-amber-400 group-hover:border-amber-500/50",
        rose: "bg-rose-500 shadow-rose-500/20 text-rose-400 group-hover:border-rose-500/50",
    };

    return (
        <motion.div 
           variants={itemVariants}
           whileHover={{ y: -8 }}
           onClick={onClick}
           className={clsx(
               "group relative h-[380px] bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer transition-all shadow-2xl",
               colors[color].split(" ").pop() // Border hover color
           )}
        >
           <Image 
              src={image} 
              alt="Quiz bg" 
              fill 
              className="object-cover opacity-50 grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-transform duration-700" 
              sizes="(max-width: 768px) 100vw, 33vw"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
           
           {/* AI Badge */}
           {badge && (
              <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1.5 shadow-lg">
                 <Sparkles size={12} className={colors[color].split(" ")[2]} />
                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">{badge}</span>
              </div>
           )}
           
           <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg", colors[color].split(" ").slice(0, 2).join(" "))}>
                 {icon}
              </div>
              <h3 className="text-3xl font-black text-white uppercase mb-3 leading-[0.95] drop-shadow-md">{title}</h3>
              <p className="text-sm text-slate-300 font-medium line-clamp-2 mb-6 leading-relaxed drop-shadow-md">{desc}</p>
              
              <div className={clsx("flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all group-hover:gap-4", colors[color].split(" ")[2])}>
                 {cta} <ArrowRight size={14} strokeWidth={3} />
              </div>
           </div>
        </motion.div>
    )
}