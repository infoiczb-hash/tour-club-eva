'use client';

import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';

export default function HikesStory() {
  return (
    <section className="py-12 md:py-20 bg-stone-950 text-stone-100 relative overflow-hidden border-t border-white/5">
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
                    <p>Вчера мы стояли над облаками в горах.</p>
                    <p>Горячий чай, звенящая тишина и осознание того, что все городские дедлайны остались где-то далеко внизу.</p>
                </div>

                <div className="pt-6 border-t border-stone-800">
                    <p className="text-lg italic text-stone-500 font-serif">
                    «Это не испытание на прочность. Это возвращение к заводским настройкам.»
                    </p>
                </div>
            </motion.div>

            {/* Место под будущее фото (Placeholder) */}
            <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative aspect-square md:aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-stone-900/50 flex flex-col items-center justify-center border border-dashed border-stone-800 backdrop-blur-sm"
            >
                <ImageIcon className="w-16 h-16 text-stone-700 mb-4" />
                <span className="text-stone-500 font-medium text-sm tracking-wider uppercase text-center px-4">
                    Место для атмосферного фото
                </span>
                <span className="text-stone-600 text-xs mt-2 text-center px-4">
                    (Кружка чая на фоне гор или туманный лес)
                </span>
            </motion.div>

        </div>
      </div>
    </section>
  );
}