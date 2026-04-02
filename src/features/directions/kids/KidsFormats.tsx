'use client';

import Image from 'next/image';
import { Waves, Users, TreePine, Backpack, ArrowRight} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";
// ✅ ДОБАВЛЕНО: Глобальный оптимизированный хук
import { useInView } from '@/hooks/useInView';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Обновленный FadeBlock с использованием глобального хука
function FadeBlock({ children, delay = 0, startX = 0, startY = 20, className = '' }: any) {
  const { ref, inView } = useInView({ threshold: 0.1, rootMargin: '-30px' });
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate(0, 0)' : `translate(${startX}px, ${startY}px)`,
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
      }}
    >
      {children}
    </div>
  );
}

const FORMATS = [
    {
        title: "Один день в лесу",
        tags: ["4-5 часов", "8+ лет", "Без ночевки"],
        desc: "Верёвочное ралли, командные игры и обед/чай на костре. Идеально для застенчивых детей и безопасной адаптации к природе.",
        // FIX: Убрали ручные трансформации из URL — loader сам добавит нужный width
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665911/1_suclsq.jpg",
        accent: "text-emerald-400 border-emerald-500/30 bg-slate-950/90"
    },
    {
        title: "Кругосветка. Путь героев",
        tags: ["2-3 дня", "10-13/14-18 лет", "База отдыха"],
        desc: "Сплав на байдарках, пешие маршруты и вечерние разговоры. Тур, после которого подростки возвращаются более взрослыми и уверенными.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665937/4_eicktg.jpg",
        accent: "text-blue-400 border-blue-500/30 bg-slate-950/90"
    },
    {
        title: "Точка роста",
        tags: ["3 дня", "6-9/10-16 лет", "Дневной формат"],
        desc: "Каждый день — новая локация: от штолен до SUP-досок. Максимум впечатлений и развития самостоятельности без отрыва от дома на ночь.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665925/3_evqllj.jpg",
        accent: "text-amber-400 border-amber-500/30 bg-slate-950/90"
    },
    {
        title: "Секреты долины Тамашлык",
        tags: ["2-3 дня", "10-15 лет", "Палатки"],
        desc: "Уютный лесной лагерь. Ребенок учится заботиться о себе и окружающих, спит в палатке и находит настоящих друзей.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665919/2_hjcjd8.jpg",
        accent: "text-orange-400 border-orange-500/30 bg-slate-950/90"
    },
    {
        title: "Комбо JUNIOR",
        tags: ["2/3 дня", "9-14 лет", "С ночевкой"],
        desc: "Строенцы и Рашков. Походы по ущельям, загадки природы и пикники с невероятными панорамными видами.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771666029/5_nmcfpa.jpg",
        accent: "text-teal-400 border-teal-500/30 bg-slate-950/90"
    }
];

const OTHER_FORMATS = [
    { title: "Сплавы на байдарках для старшеклассников", desc: "Доступны форматы как с родителями, так и полностью самостоятельные группы.", icon: Waves },
    { title: 'Сплавы "Отцы и дети"', desc: "Специальный формат для укрепления связи и совместного преодоления маршрута.", icon: Users },
    { title: "Прогулки по Кицканскому лесу с костром", desc: "Короткие атмосферные выходы на природу на несколько часов.", icon: TreePine },
    { title: "Выезд со школьниками в приключенческом формате", desc: "Идеальная альтернатива скучным классным часам. Командообразование для всего класса.", icon: Backpack }
];

export default function KidsFormats() {
    return (
        <section className="py-8 md:py-16 bg-[#020617] relative overflow-hidden border-t border-white/5">
            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                <FadeBlock startX={-20} startY={0} className="text-left mb-8 md:mb-12 max-w-3xl">
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 uppercase tracking-tighter">
                        Наши <span className="text-amber-500">Форматы</span>
                    </h2>
                    <p className="text-slate-300 text-[14px] md:text-base font-medium leading-relaxed">
                        Мы не просто продаем туры, мы создаем опыт. Выберите формат, который идеально подойдет вашему ребенку по возрасту и уровню подготовки.
                    </p>
                </FadeBlock>

                <div className="relative mb-12 md:mb-20">
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                       {FORMATS.map((format, idx) => (
                          <FadeBlock 
                              key={idx}
                              delay={idx * 0.1}
                              startY={20}
                              className="shrink-0 snap-center w-[85vw] md:w-auto h-full group bg-slate-900/60 backdrop-blur-md rounded-[2rem] overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-500 flex flex-col shadow-xl"
                          >
                              <div className="relative h-56 md:h-64 overflow-hidden isolate shrink-0">
                                  <Image 
                                      src={format.img} 
                                      alt={format.title} 
                                      fill 
                                      className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                                      // FIX: Точные sizes для карточек форматов
                                      sizes="(max-width: 768px) 85vw, (max-width: 1024px) 50vw, 33vw"
                                      // FIX: lazy — карточки ниже hero, не конкурируют с LCP
                                      loading="lazy"
                                      // FIX: quality 55 — с градиентным оверлеем артефакты не видны
                                      quality={55}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                                  
                                  <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
                                      {format.tags.map(tag => (
                                          <span key={tag} className={cn("px-3 py-1.5 text-[12px] font-bold uppercase rounded-xl border shadow-lg tracking-wide", format.accent)}>
                                              {tag}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                              
                              <div className="p-6 md:p-8 flex flex-col grow h-full relative z-10 bg-slate-900">
                                  <h3 className="text-xl md:text-2xl font-black text-white mb-3 tracking-tight group-hover:text-amber-400 transition-colors leading-tight">
                                      {format.title}
                                  </h3>
                                  <p className="text-[14px] md:text-base text-slate-300 leading-relaxed font-medium">
                                      {format.desc}
                                  </p>
                              </div>
                          </FadeBlock>
                      ))}
                    </div>

                    <div className="flex md:hidden items-center gap-2 mb-4 text-slate-300 pl-1">
                                  <ArrowRight size={16} className="text-teal-500 animate-pulse" />
                                  <span className="text-[11px] font-bold uppercase tracking-widest">Листайте вбок</span>
                              </div>
                </div>

                <FadeBlock startY={30} className="pt-8 border-t border-white/5">
                    <div className="text-left mb-6 md:mb-10 max-w-3xl">
                        <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-3">
                            Другие <span className="text-slate-300">Форматы</span>
                        </h3>
                        <p className="text-slate-300 font-medium text-[14px] md:text-base">
                            Мы также организуем индивидуальные и групповые туры под ваш запрос.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="grid grid-rows-2 md:grid-rows-none grid-flow-col md:grid-flow-row auto-cols-[85vw] md:auto-cols-auto md:grid-cols-2 gap-3 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-10 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {OTHER_FORMATS.map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                    <div 
                                        key={idx}
                                        className="snap-center flex items-center gap-4 p-5 rounded-[1.5rem] bg-slate-900/40 border border-white/5 hover:border-amber-500/20 hover:bg-slate-900 transition-all group h-full"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-amber-500/30 transition-colors shadow-lg">
                                            <Icon size={22} strokeWidth={1.5} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-[15px] md:text-base leading-tight mb-1 group-hover:text-amber-100 transition-colors">
                                                {item.title}
                                            </h4>
                                            <p className="text-[14px] text-slate-300 font-medium leading-snug line-clamp-2">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
   <div className="flex md:hidden items-center gap-2 mb-4 text-slate-300 pl-1">
                                  <ArrowRight size={16} className="text-teal-500 animate-pulse" />
                                  <span className="text-[11px] font-bold uppercase tracking-widest">Листайте вбок</span>
                              </div>
                    </div>
                </FadeBlock>
                
            </div>
        </section>
    );
}