'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function HikesStory() {
  return (
    // Уплотнили внешние отступы для бесшовного скролла
    <section className="py-8 md:py-16 bg-stone-950 text-stone-100 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
            
            {/* ТЕКСТОВАЯ ЧАСТЬ (Эмоции + Факты) */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex flex-col text-left"
            >
                {/* 1. Эмоциональный хук */}
                <div className="text-[12px] font-bold tracking-[0.2em] text-teal-500 uppercase mb-4 md:mb-6">
                    Из дневника гида
                </div>

                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter mb-6">
                    "Там, где не ловит связь, <br className="hidden md:block"/>
                    появляется <span className="text-teal-500">коннект с собой</span>"
                </h2>

                <p className="text-[14px] md:text-lg font-medium leading-relaxed text-stone-400 mb-8 md:mb-10 max-w-lg">
                    Горячий чай, звенящая тишина и осознание того, что все городские дедлайны остались где-то далеко внизу.
                </p>

                <div className="w-full h-px bg-gradient-to-r from-stone-800 to-transparent mb-8 md:mb-10" />

                {/* 2. Рациональная часть (Список ценностей из HikesMeaning) */}
                <ul className="space-y-4 mb-8 md:mb-10">
                    <li className="flex items-start gap-3 group">
                        <Check className="w-5 h-5 text-teal-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                        <span className="text-[14px] md:text-base font-medium text-stone-300">
                            Масштаб гор, захватывающий дух
                        </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                        <Check className="w-5 h-5 text-teal-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                        <span className="text-[14px] md:text-base font-medium text-stone-300">
                            Погружение в другую культуру и быт
                        </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                        <Check className="w-5 h-5 text-teal-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                        <span className="text-[14px] md:text-base font-medium text-stone-300">
                            Настоящий детокс: полное отключение от забот
                        </span>
                    </li>
                </ul>

                {/* 3. Кластер стильных тегов */}
                <div className="flex flex-wrap gap-2 md:gap-3">
                    {['Другой климат', 'Новые знакомства', 'Ментальная перезагрузка'].map((item, i) => (
                        <div 
                            key={i} 
                            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-stone-900/80 backdrop-blur-sm rounded-full border border-stone-800 hover:border-teal-500/30 transition-colors"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                            <span className="text-stone-400 font-bold text-[11px] md:text-xs uppercase tracking-wider">
                                {item}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ВИЗУАЛЬНАЯ ЧАСТЬ (Атмосферное фото) */}
            <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative aspect-square md:aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl group border border-white/5"
            >
                <Image 
                    src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838659/4_tvn5t8.jpg" 
                    alt="Атмосфера экспедиций" 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                />
                
                {/* Легкое затемнение поверх фото для премиального вида */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent pointer-events-none transition-opacity duration-500 group-hover:opacity-50" />
            </motion.div>

        </div>
      </div>
    </section>
  );
}