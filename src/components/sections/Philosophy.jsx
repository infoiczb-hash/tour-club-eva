import React from 'react';
import { motion } from "framer-motion";
import { 
  Mountain, 
  Waves, 
  Users, 
  Tent, 
  ArrowUpRight, 
  Compass,
  Calendar,
  Zap,
  Star
} from "lucide-react";

// ОБЪЕДИНЕННЫЕ ДАННЫЕ
// Визуал от Bento + Данные от твоего кода
const directions = [
  {
    id: 1,
    type: "video", 
    title: "Горный треккинг",
    desc: "Маршруты выше облаков.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800",
    videoSrc: "https://player.vimeo.com/external/494236962.sd.mp4?s=401c402d24294a614d35222045956277063d8924&profile_id=165&oauth2_token_id=57447761",
    colSpan: "md:col-span-1",
    icon: Mountain,
    // Данные из твоего кода:
    price: "от 15 000₽",
    season: "Май-Сент",
    difficulty: "Любой",
    color: "bg-orange-500"
  },
  {
    id: 2,
    type: "image",
    title: "Водные сплавы",
    desc: "Днестр и дикие реки.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800",
    colSpan: "md:col-span-1",
    icon: Waves,
    price: "от 8 000₽",
    season: "Июнь-Авг",
    difficulty: "Легкий",
    color: "bg-blue-500"
  },
  {
    id: 3,
    type: "image",
    title: "Детская школа",
    desc: "Навыки выживания и дружбы для подростков.",
    image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=800",
    colSpan: "md:col-span-2", 
    icon: Users,
    price: "от 25 000₽",
    season: "Лето",
    difficulty: "Обучение",
    color: "bg-green-500"
  },
  {
    id: 4,
    type: "image",
    title: "Авторские экспедиции",
    desc: "Уникальные маршруты, которых нет на картах.",
    image: "https://images.unsplash.com/photo-1533240332313-0dbdd31c7f4c?auto=format&fit=crop&q=80&w=800",
    colSpan: "md:col-span-2", 
    icon: Compass,
    price: "от 35 000₽",
    season: "Круглый год",
    difficulty: "Сложный",
    color: "bg-purple-500"
  }
];

export default function Philosophy() {
  return (
    <section className="bg-[#0a0f0d] py-24 relative overflow-hidden">
      
      {/* Фоновый шум */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* СЕТКА BENTO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(280px,auto)] mb-12">
          
          {/* 1. БЛОК ФИЛОСОФИИ */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 md:row-span-1 rounded-3xl bg-teal-900/20 border border-teal-500/20 p-8 flex flex-col justify-between overflow-hidden relative group"
          >
             <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-teal-500/20 blur-[60px] rounded-full group-hover:bg-teal-500/30 transition-all" />
             
             <div>
                <div className="inline-flex items-center gap-2 text-teal-400 font-bold uppercase tracking-widest text-xs mb-4">
                   <Tent className="h-4 w-4" />
                   Наша миссия
                </div>
                <h2 className="text-3xl md:text-4xl font-condensed font-bold text-white uppercase leading-tight mb-4">
                   Не просто туризм,<br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                      а образ жизни
                   </span>
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                   Мы верим, что природа лечит. Мы создаем пространство, где незнакомцы становятся друзьями, 
                   а выходные превращаются в маленькую жизнь.
                </p>
             </div>
          </motion.div>

          {/* 2. КАРТОЧКИ НАПРАВЛЕНИЙ */}
          {directions.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`${item.colSpan} relative h-72 md:h-auto rounded-3xl overflow-hidden group cursor-pointer border border-white/5`}
            >
               {/* Медиа (Видео или Фото) */}
               {item.type === 'video' ? (
                 <video src={item.videoSrc} poster={item.image} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-40" />
               ) : (
                 <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40" />
               )}
               
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

               {/* Контент */}
               <div className="absolute bottom-0 left-0 p-6 w-full z-10">
                  <div className="flex justify-between items-end mb-2">
                     <div>
                        {/* Иконка */}
                        <div className="mb-3 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-teal-500 transition-colors border border-white/10">
                           <item.icon className="h-5 w-5" />
                        </div>
                        
                        <h3 className="text-2xl font-condensed font-bold text-white uppercase mb-1">
                           {item.title}
                        </h3>
                        
                        {/* Описание (скрывается при наведении) */}
                        <p className="text-xs text-slate-300 group-hover:hidden transition-all duration-300">
                           {item.desc}
                        </p>
                     </div>
                  </div>

                  {/* ДЕТАЛИ (Появляются при наведении) - ВЗЯТО ИЗ ТВОЕГО КОДА */}
                  <div className="grid grid-cols-2 gap-2 h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-300 overflow-hidden">
                      <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/5">
                          <span className="text-[10px] text-slate-400 uppercase block">Цена</span>
                          <span className="text-sm font-bold text-white">{item.price}</span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/5">
                          <span className="text-[10px] text-slate-400 uppercase block">Сезон</span>
                          <span className="text-sm font-bold text-white">{item.season}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                          <span className="text-xs text-slate-300">{item.difficulty} уровень</span>
                      </div>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>

        {/* CTA БЛОК "2026" - ВЗЯТО ИЗ ТВОЕГО КОДА (Адаптировано) */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="bg-gradient-to-r from-teal-900/40 to-emerald-900/40 rounded-3xl p-1 border border-teal-500/30"
        >
           <div className="bg-[#0f172a]/80 backdrop-blur-sm rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                 <div className="p-3 bg-teal-500/10 rounded-xl">
                    <Zap className="h-6 w-6 text-teal-400" />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold text-white mb-1">Раннее бронирование 2026</h4>
                    <p className="text-slate-400 text-sm max-w-lg">
                       Забронируйте место заранее и получите <span className="text-white font-bold">скидку 10%</span> на любое направление. 
                       Цены могут вырасти к сезону.
                    </p>
                 </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                 <button className="flex-1 md:flex-none px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-teal-900/20">
                    Выбрать тур
                 </button>
                 <button className="flex-1 md:flex-none px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl border border-white/10 transition-all">
                    Консультация
                 </button>
              </div>
           </div>
        </motion.div>

      </div>
    </section>
  );
}
