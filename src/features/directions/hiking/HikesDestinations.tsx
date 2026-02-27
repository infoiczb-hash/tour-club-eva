'use client';

import { motion } from 'framer-motion';
import { Tent, Droplets, Mountain, Image as ImageIcon } from 'lucide-react';

const DESTINATIONS = [
  {
    icon: Tent,
    title: 'Романтика Гор',
    subtitle: 'Манящий Чукаш',
    desc: 'Прекрасный треккинг через поляны и леса. Идеально для тех, кто хочет увидеть горы зимой. Это не сложно, как кажется!',
    tags: ['Зимняя сказка', 'Для новичков'],
  },
  {
    icon: Droplets,
    title: 'Энергия воды и скал',
    subtitle: 'Магия Биказского ущелья',
    desc: 'Величественные стены каньона, подвесные мосты и ревущие водопады. Энергия природы, наполняющая силой.',
    tags: ['Без рюкзаков', 'Радиальные выходы'],
  },
  {
    icon: Mountain,
    title: 'Амфитеатр Трансильвании',
    subtitle: 'Пятра Краулуй',
    desc: 'Мы не поднимаемся на хребты — мы смотрим на них. Проживание в уютном доме у подножия гор между живописных деревень.',
    tags: ['Домики в лесу', 'Эстетика'],
  },
];

export default function HikesDestinations() {
  return (
    <section className="py-10 md:py-14 bg-stone-900 border-t border-white/5 relative overflow-hidden">
      
      {/* Мягкое атмосферное свечение на фоне */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
            ВЫБЕРИ СВОЮ <span className="text-teal-500">ИСТОРИЮ</span>
          </h2>
          <p className="text-stone-400 font-medium text-lg max-w-2xl mx-auto">
            У каждого маршрута свой характер. Выбирайте настроение, которое вам сейчас необходимо.
          </p>
        </motion.div>

        {/* Сетка направлений (Тёмные стеклянные карточки) */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {DESTINATIONS.map((dest, i) => {
            const Icon = dest.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-stone-800/40 rounded-[2.5rem] overflow-hidden border border-stone-700 hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)] transition-all duration-300 group flex flex-col backdrop-blur-sm"
              >
                {/* Место под фото (Тёмный Placeholder) */}
                <div className="relative h-56 bg-stone-900/50 flex flex-col items-center justify-center border-b border-stone-700/50 group-hover:bg-stone-800/50 transition-colors">
                  <ImageIcon className="w-10 h-10 text-stone-600 mb-2" />
                  <span className="text-stone-500 text-xs font-bold uppercase tracking-widest">Место для фото</span>
                </div>

                {/* Информация */}
                <div className="p-8 flex flex-col flex-1 relative">
                  {/* Иконка настроения */}
                  <div className="absolute -top-6 right-8 w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform">
                    <Icon size={24} />
                  </div>

                  <div className="text-teal-400 font-bold text-xs tracking-widest uppercase mb-2">
                    {dest.title}
                  </div>
                  <h3 className="text-2xl font-black text-stone-100 uppercase tracking-tight mb-4">
                    {dest.subtitle}
                  </h3>
                  
                  <p className="text-stone-400 font-medium leading-relaxed mb-6 flex-1 text-sm">
                    {dest.desc}
                  </p>

                  <div className="pt-4 border-t border-stone-700/50 flex flex-wrap gap-2">
                    {dest.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-stone-800 text-stone-300 text-xs font-bold uppercase tracking-wider rounded-lg border border-stone-700">
                            {tag}
                        </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  );
}