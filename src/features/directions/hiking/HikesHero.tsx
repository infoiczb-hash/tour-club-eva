'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, Compass, Coffee, ShieldCheck } from 'lucide-react';

export default function HikesHero({ onScrollDown }: { onScrollDown?: () => void }) {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-stone-950">
      
      {/* Анимированный фоновый свет (вместо фото) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-800/20 blur-[120px] rounded-full animate-pulse pointer-events-none" />

      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 container mx-auto px-4 text-center mt-12"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block px-5 py-2 mb-8 text-xs md:text-sm font-bold tracking-widest text-teal-200 border border-teal-800/50 rounded-full backdrop-blur-md uppercase bg-teal-950/30"
        >
          Туры по горам Румынии и не только.
        </motion.div>

        {/* Новая мягкая типографика */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="mb-8"
        >
          <div className="text-5xl md:text-7xl lg:text-8xl font-black text-stone-100 leading-tight mb-2 tracking-tight">
            ВДОХНОВЛЯЙСЯ <br className="hidden md:block"/> ГОРАМИ.
          </div>
          <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-teal-500 leading-tight tracking-tight">
            НЕ ПОКОРЯЙ ИХ.
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-lg md:text-xl text-stone-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed"
        >
          Оставь городскую суету позади. Открой для себя настоящую Румынию: неспешный треккинг налегке, горячий чай с видом на долины и люди, с которыми всегда по пути.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex flex-col items-center gap-12"
        >
           {/* Эмоциональные триггеры вместо сухой статистики */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-stone-300">
                <div className="flex items-center gap-3">
                    <Compass className="w-6 h-6 text-teal-500" />
                    <span className="text-sm font-bold uppercase tracking-wider">Связь с природой</span>
                </div>
                <div className="hidden md:block w-px h-6 bg-stone-800" />
                <div className="flex items-center gap-3">
                    <Coffee className="w-6 h-6 text-teal-500" />
                    <span className="text-sm font-bold uppercase tracking-wider">Уютные вечера</span>
                </div>
                <div className="hidden md:block w-px h-6 bg-stone-800" />
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-teal-500" />
                    <span className="text-sm font-bold uppercase tracking-wider">На легке и с рюкзаками</span>
                </div>
            </div>
        </motion.div>
      </motion.div>
    </section>
  );
}