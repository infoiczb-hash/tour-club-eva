'use client';

import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function HikesStory() {
  return (
    <section className="py-10 md:py-14  bg-stone-950 text-stone-100 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4">
        
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            
            {/* Текстовая часть */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
            >
                <div className="text-sm font-bold tracking-[0.2em] text-teal-500 uppercase">
                    Из дневника гида
                </div>

                <div className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter">
                    "Там, где не ловит связь, <br />
                    появляется <span className="text-teal-500">коннект с собой</span>"
                </div>

                <div className="text-lg md:text-xl font-medium leading-relaxed space-y-6 text-stone-400">
                <p>Горячий чай, звенящая тишина и осознание того, что все городские дедлайны остались где-то далеко внизу.</p>
                </div>

                <div className="pt-6 border-t border-stone-800">
                    <p className="text-lg italic text-stone-500 font-serif">
                    «Это не испытание на прочность. Это возвращение к заводским настройкам.»
                    </p>
                </div>
            </motion.div>

            {/* Реальное атмосферное фото */}
            <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                // Оставили пропорции и скругления, добавили тень. Убрали flex и пунктир.
                className="relative aspect-square md:aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl group"
            >
                <Image 
                    src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838659/4_tvn5t8.jpg" 
                    alt="Атмосфера локальных туров" 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                    sizes="(max-width: 768px) 100vw, 50vw"
                />
                
                {/* Легкое затемнение поверх фото для премиального вида (по желанию) */}
                <div className="absolute inset-0 bg-stone-950/10 pointer-events-none transition-colors duration-500 group-hover:bg-transparent" />
            </motion.div>

        </div>
      </div>
    </section>
  );
}