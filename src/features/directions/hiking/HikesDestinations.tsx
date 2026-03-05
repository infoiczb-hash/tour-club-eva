'use client';

import { motion } from 'framer-motion';
import { Tent, Droplets, Mountain, ChevronRight } from 'lucide-react'; // 🔥 Добавили ChevronRight
import Image from 'next/image';

const DESTINATIONS = [
  {
    icon: Tent,
    title: 'Романтика Гор',
    subtitle: 'Манящий Чукаш',
    desc: 'Прекрасный треккинг через поляны и леса. Идеально для тех, кто хочет увидеть горы. Это не сложно, как кажется!',
    tags: ['Горный хребет', 'Красивые перевалы'],
    img: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1772191262/%D1%84%D0%BE%D1%82%D0%BE4_okb8gy.jpg'
  },
  {
    icon: Droplets,
    title: 'Энергия воды и скал',
    subtitle: 'Магия Биказского ущелья',
    desc: 'Величественные стены каньона, подвесные мосты и ревущие водопады. Энергия природы, наполняющая силой.',
    tags: ['Без рюкзаков', 'Радиальные выходы','Походит для новичков' ],
    img: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838689/8_yojjcr.jpg'
  },
  {
    icon: Mountain,
    title: 'Амфитеатр Трансильвании',
    subtitle: 'Пятра Краулуй',
    desc: 'Мы не поднимаемся на хребты — мы смотрим на них. Проживание в уютном доме у подножия гор между живописных деревень.',
    tags: ['Разные виды', 'Панарамные обзоры'],
    img: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838585/%D0%BE%D1%81%D0%B5%D0%BD%D1%8C8_egg0e6.jpg'
  },
];

export default function HikesDestinations() {
  return (
    <section className="py-8 md:py-16 bg-stone-900 border-t border-white/5 relative overflow-hidden">
      
      {/* Мягкое атмосферное свечение на фоне */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-900/10 md:blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        {/* 🔥 Выровняли заголовок по левому краю в едином стиле */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-left mb-10 md:mb-16 max-w-3xl"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4">
            ВЫБЕРИ СВОЮ <br className="hidden md:block"/><span className="text-teal-500">ИСТОРИЮ</span>
          </h2>
          <p className="text-[14px] md:text-lg text-stone-400 font-medium max-w-2xl leading-relaxed">
            У каждого маршрута свой характер. Выбирайте настроение, которое вам сейчас необходимо. У нас около 12 маршрутов в горы.
          </p>
        </motion.div>

        {/* 🔥 Обертка для мобильного свайпа */}
        <div className="relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-6 lg:gap-8 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {DESTINATIONS.map((dest, i) => {
              const Icon = dest.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  // 🔥 Добавили shrink-0, snap-center и w-[85vw] для мобилки
                  className="shrink-0 snap-center w-[85vw] md:w-auto bg-stone-800/40 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-stone-700 hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)] transition-all duration-300 group flex flex-col backdrop-blur-sm"
                >
                  {/* Фотография маршрута */}
                  <div className="relative h-56 md:h-64 w-full overflow-hidden border-b border-stone-700/50 shrink-0">
                    <Image 
                      src={dest.img} 
                      alt={dest.subtitle} 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-800/90 via-transparent to-transparent opacity-100" />
                  </div>

                  {/* Информация */}
                  <div className="p-6 md:p-8 flex flex-col flex-1 relative bg-stone-800/20">
                    {/* Иконка настроения */}
                    <div className="absolute -top-6 right-6 w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform">
                      <Icon size={24} strokeWidth={1.5} />
                    </div>

                    <div className="text-teal-400 font-bold text-[10px] md:text-xs tracking-widest uppercase mb-2">
                      {dest.title}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-stone-100 uppercase tracking-tight mb-3">
                      {dest.subtitle}
                    </h3>
                    
                    <p className="text-[14px] text-stone-400 font-medium leading-relaxed mb-6 flex-1">
                      {dest.desc}
                    </p>

                    <div className="pt-4 border-t border-stone-700/50 flex flex-wrap gap-2">
                      {dest.tags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-stone-900/50 text-stone-300 text-[11px] md:text-xs font-bold uppercase tracking-wider rounded-lg border border-stone-700">
                              {tag}
                          </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* 🔥 Подсказка "Мотай" */}
          <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
              <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
              <ChevronRight size={14} />
          </div>
        </div>

      </div>
    </section>
  );
}