"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Gamepad2, Backpack, Flame, Compass, ArrowRight, Trophy, Moon, Sparkles } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

// Компоненты
import QuizBackpack from "@/features/fun/components/QuizBackpack"; 
import QuizSurvival from "@/features/fun/components/QuizSurvival";
import QuizTouristType from "@/features/fun/components/QuizTouristType";
import QuizTotem from "@/features/fun/components/QuizTotem";
import ContactHubModal from "@/components/modals/ContactHubModal";

type QuizType = 'backpack' | 'survival' | 'tourist-type' | 'totem' | null;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

// Внутренний компонент с логикой (чтобы работал useSearchParams)
function FunSectorContent() {
  const [activeQuiz, setActiveQuiz] = useState<QuizType>(null);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [hubContext, setHubContext] = useState<string | undefined>(undefined);
  
  const searchParams = useSearchParams();

  // Ловим параметр ?quiz=... при загрузке страницы
  useEffect(() => {
    const quizParam = searchParams.get('quiz');
    if (
      quizParam === 'survival' || 
      quizParam === 'backpack' || 
      quizParam === 'tourist-type' || 
      quizParam === 'totem'
    ) {
      setActiveQuiz(quizParam as QuizType);
    }
  }, [searchParams]);

  const handleQuizResult = (resultText: string) => {
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
           <Gamepad2 size={16} className="text-indigo-400" />
           <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Play & Explore</span>
        </motion.div>
        
        <motion.h1 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.9]"
        >
           Твой <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-400">Фан-Сектор</span>
        </motion.h1>
        <motion.p 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium"
        >
           Узнай себя, проверь навыки и подбери идеальное приключение через игру. <br className="hidden md:block"/> Осторожно: вызывает неконтролируемое желание уйти в поход!
        </motion.p>
      </section>

      {/* 2. BENTO GRID (MENU) */}
      <section className="container mx-auto px-4 pb-24 relative z-10">
         <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto"
         >
            
            <QuizCard 
               onClick={() => setActiveQuiz('survival')}
               image="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675801/fun1_bo3tsi.webp"
               color="orange"
               icon={<Flame size={24} strokeWidth={2.5}/>}
               title={<>Выживешь <br/>в походе?</>}
               desc="Проверь инстинкты. Тест на реальных ситуациях: дождь, медведи и гречка."
               cta="Начать тест"
            />

            <QuizCard 
               onClick={() => setActiveQuiz('backpack')}
               image="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675806/fun3_quee6m.webp"
               color="blue"
               icon={<Backpack size={24} strokeWidth={2.5}/>}
               title={<>Собери <br/>рюкзак</>}
               desc="Мини-игра: выбери только нужное. Утюг или горелка? Фен или аптечка?"
               cta="Играть"
            />

            <QuizCard 
               onClick={() => setActiveQuiz('tourist-type')}
               image= "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675803/fun2_c27m1l.webp"
               color="emerald"
               icon={<Compass size={24} strokeWidth={2.5}/>}
               title={<>Кто ты <br/>в горах?</>}
               desc="Психологический тест. Узнай свой стиль путешествий и идеальный маршрут."
               cta="Узнать себя"
            />

            <QuizCard 
               onClick={() => setActiveQuiz('totem')}
               image="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771675801/fun4_ppqvoy.webp"
               color="purple"
               icon={<Moon size={24} strokeWidth={2.5}/>}
               title={<>Твой Тотем <br/>в горах</>}
               desc="Мистический тест на ассоциации. Узнай своё животное силы: Волк, Медведь или Орел?"
               cta="Призвать духа"
               extra={<div className="absolute top-10 right-10 text-purple-400 opacity-50 animate-pulse"><Sparkles size={32}/></div>}
            />

            <motion.div 
               variants={itemVariants}
               className="md:col-span-2 bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-500" />
               
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                  <div>
                     <h3 className="text-3xl font-black text-white uppercase mb-2 flex flex-col md:flex-row items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center"><Trophy size={20} /></span>
                        <span>Пройди все квизы</span>
                     </h3>
                     <p className="text-slate-400 max-w-lg text-lg">
                        Это поможет нам лучше понять твои предпочтения и предложить тур, который станет легендой.
                     </p>
                  </div>
                  <Link 
                     href="/tour" 
                     className="px-8 py-4 bg-white text-slate-950 font-black uppercase tracking-wider rounded-2xl hover:bg-indigo-50 hover:scale-105 transition-all shadow-xl whitespace-nowrap"
                  >
                     Смотреть все туры
                  </Link>
               </div>
            </motion.div>

         </motion.div>
      </section>

      {/* --- MODALS --- */}
      <QuizSurvival open={activeQuiz === 'survival'} onClose={() => setActiveQuiz(null)} onComplete={handleQuizResult} />
      <QuizBackpack open={activeQuiz === 'backpack'} onClose={() => setActiveQuiz(null)} onComplete={handleQuizResult} />
      <QuizTouristType open={activeQuiz === 'tourist-type'} onClose={() => setActiveQuiz(null)} onComplete={handleQuizResult} />
      <QuizTotem open={activeQuiz === 'totem'} onClose={() => setActiveQuiz(null)} onComplete={handleQuizResult} />

      <ContactHubModal 
        isOpen={isHubOpen} 
        onClose={() => setIsHubOpen(false)} 
        initialTab="TOUR"
        tourContext={hubContext}
      />
    </main>
  );
}

// ГЛАВНЫЙ ЭКСПОРТ (Оборачиваем в Suspense для Next.js App Router)
export default function FunSectorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center" />}>
      <FunSectorContent />
    </Suspense>
  );
}

// --- SUB COMPONENT: CARD ---
function QuizCard({ onClick, image, color, icon, title, desc, cta, extra }: any) {
    const colors: any = {
        orange: "bg-orange-500 shadow-orange-500/20 text-orange-400 group-hover:border-orange-500/50",
        blue: "bg-blue-500 shadow-blue-500/20 text-blue-400 group-hover:border-blue-500/50",
        emerald: "bg-emerald-500 shadow-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/50",
        purple: "bg-purple-600 shadow-purple-500/30 text-purple-400 group-hover:border-purple-500/50",
    };

    return (
        <motion.div 
           variants={itemVariants}
           whileHover={{ y: -8 }}
           onClick={onClick}
           className={clsx(
               "group relative h-[420px] bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer transition-all shadow-2xl",
               colors[color].split(" ").pop() // Border hover color
           )}
        >
           <Image 
              src={image} 
              alt="Quiz bg" 
              fill 
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
           {extra}
           
           <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg", colors[color].split(" ").slice(0, 2).join(" "))}>
                 {icon}
              </div>
              <h3 className="text-3xl font-black text-white uppercase mb-3 leading-[0.9]">{title}</h3>
              <p className="text-sm text-slate-300 font-medium line-clamp-2 mb-6 leading-relaxed">{desc}</p>
              
              <div className={clsx("flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all group-hover:gap-4", colors[color].split(" ")[2])}>
                 {cta} <ArrowRight size={14} strokeWidth={3} />
              </div>
           </div>
        </motion.div>
    )
}