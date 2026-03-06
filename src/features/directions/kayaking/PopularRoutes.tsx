"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { 
  Navigation, Clock, X, Users, Wind, MapPin, Map, 
  ChevronLeft, ChevronRight, Ruler, Flag, Route as RouteIcon, 
  Sparkles, Timer, Compass, CalendarDays, Flame, Moon, Tent,
  ArrowUpRight
} from "lucide-react";
import { routesData, RouteData } from "@/data/routes";

function useInView(options = { threshold: 0.1, rootMargin: '-30px' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      options
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

const otherFormats = [
  { title: "Прогулки на 2-3 часа", desc: "В районе Тирасполя", icon: Timer },
  { title: "Без инструктора", desc: "Для проверенных групп", icon: Compass },
  { title: "Сплавы на 2 дня", desc: "С палатками/домиками", icon: Tent },
  { title: "На 3 и более дней", desc: "Длинные экспедиции", icon: CalendarDays },
  { title: "Сплав + Пикник", desc: "Вкусный отдых на природе", icon: Flame },
  { title: "С размещением на ночлег", desc: "Комфорт вместо палаток", icon: Moon },
];

export default function PopularRoutes() {
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const formatsView = useInView();

  useEffect(() => {
    if (selectedRoute) setCurrentImgIdx(0);
  }, [selectedRoute]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedRoute) setCurrentImgIdx((prev) => (prev + 1) % selectedRoute.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedRoute) setCurrentImgIdx((prev) => (prev - 1 + selectedRoute.images.length) % selectedRoute.images.length);
  };

  return (
    <section className="py-10 md:py-20 bg-[#020617] relative overflow-hidden text-slate-200">
      <div className="container mx-auto px-4 relative z-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4">
              <Map size={14} className="text-teal-400" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">Локации</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              Популярные <span className="text-teal-500">Маршруты</span>
            </h2>
          </div>
        </div>

        {/* CARDS — whileHover оставляем, это hover UI а не scroll */}
        <div className="relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-5 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {routesData.map((route) => (
              <motion.div
                key={route.id}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedRoute(route)}
                className="group relative cursor-pointer flex-shrink-0 snap-center w-[85vw] md:w-auto h-[400px] md:h-[450px] bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-teal-500/50 transition-all duration-500 shadow-xl"
              >
                <div className="absolute top-4 right-4 z-20 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white shadow-xl">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Подробнее</span>
                    <ArrowUpRight size={14} className="text-teal-400" />
                  </div>
                </div>
                <Image src={route.images[0]} alt={route.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110 md:grayscale-[30%] group-hover:grayscale-0" sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                  <div className="flex gap-2 mb-4 opacity-100 md:opacity-0 md:-translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <span className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                      <Clock size={12} className="text-teal-400" /> {route.details.duration}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                      <Navigation size={12} className="text-teal-400" /> {route.details.level}
                    </span>
                  </div>
                  <h3 className="font-black text-2xl md:text-3xl text-white uppercase leading-[1.1] mb-2 group-hover:text-teal-400 transition-colors drop-shadow-lg">{route.title}</h3>
                  <p className="text-xs md:text-sm text-slate-300 font-medium line-clamp-2 drop-shadow-md">{route.path}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 animate-pulse pointer-events-none">
            <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
            <ChevronRight size={14} className="text-teal-400" />
          </div>
        </div>

        {/* OTHER FORMATS */}
        <div
          ref={formatsView.ref}
          style={{ opacity: formatsView.inView ? 1 : 0, transform: formatsView.inView ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
          className="mt-12 md:mt-14 border-t border-white/10 pt-10"
        >
          <div className="mb-6 md:mb-8 text-left">
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
              Другие <span className="text-amber-500">Форматы</span>
            </h3>
            <p className="text-slate-400 text-sm md:text-base mt-2 font-medium">Соберем маршрут под вашу компанию.</p>
          </div>
          <div className="relative">
            <div className="grid grid-rows-2 grid-flow-col auto-cols-[80vw] md:auto-cols-auto md:grid-rows-none md:grid-cols-3 gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-10 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {otherFormats.map((format, idx) => {
                const Icon = format.icon;
                return (
                  <div key={idx} className="snap-center bg-slate-900/40 border border-white/5 rounded-[1.5rem] p-4 md:p-5 flex items-center gap-4 hover:border-amber-500/30 hover:bg-slate-900/60 transition-all group h-full">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all">
                      <Icon size={22} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm md:text-base leading-tight mb-1 group-hover:text-amber-400 transition-colors">{format.title}</h4>
                      <p className="text-xs text-slate-400 font-medium line-clamp-1">{format.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="md:hidden absolute bottom-0 right-4 flex items-center gap-1 animate-pulse pointer-events-none">
              <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
              <ChevronRight size={14} className="text-teal-400" />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL — layoutId и AnimatePresence оставляем, это UI */}
      <AnimatePresence>
        {selectedRoute && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              layoutId={selectedRoute.id}
              className="relative w-full h-full md:max-w-5xl md:h-auto md:max-h-[90vh] bg-slate-900 md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row"
            >
              <button aria-label="Закрыть" onClick={() => setSelectedRoute(null)} className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-3 bg-black/50 hover:bg-white text-white hover:text-black rounded-full transition-all border border-white/10 shadow-lg">
                <X size={20} />
              </button>

              {/* Карусель */}
              <div className="w-full md:w-5/12 h-[35vh] md:h-auto relative group">
                <AnimatePresence mode="wait">
                  <motion.div key={currentImgIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                    <Image src={selectedRoute.images[currentImgIdx]} alt={`${selectedRoute.title} - фото ${currentImgIdx + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 60vw" />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r md:from-slate-900 md:to-transparent" />
                {selectedRoute.images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-10 md:h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-teal-500 hover:text-black transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 z-20">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-10 md:h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-teal-500 hover:text-black transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 z-20">
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                      {selectedRoute.images.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImgIdx ? 'w-4 bg-teal-400' : 'w-1.5 bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Детали */}
              <div className="w-full md:w-7/12 flex flex-col h-[65vh] md:h-auto overflow-y-auto bg-slate-900 [&::-webkit-scrollbar]:hidden">
                <div className="p-6 md:p-10 flex-1">
                  <div className="text-[10px] font-mono text-teal-500 uppercase tracking-widest mb-2 opacity-60">Паспорт маршрута</div>
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase mb-4 leading-tight">{selectedRoute.title}</h3>
                  <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">{selectedRoute.desc}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 p-5 md:p-6 rounded-3xl bg-white/5 border border-white/5">
                    <PassportItem icon={Navigation} label="Сложность" value={selectedRoute.details.level} />
                    <PassportItem icon={Ruler} label="Километраж" value={selectedRoute.details.distance} />
                    <PassportItem icon={Clock} label="Длительность" value={selectedRoute.details.duration} />
                    <PassportItem icon={Users} label="Для кого" value={selectedRoute.details.forWhom} />
                    <PassportItem icon={MapPin} label="Старт" value={selectedRoute.details.start} />
                    <PassportItem icon={Flag} label="Финиш" value={selectedRoute.details.finish} />
                    <PassportItem icon={Wind} label="Атмосфера" value={selectedRoute.details.atmosphere} />
                    <div className="col-span-2 pt-4 mt-2 border-t border-white/10">
                      <PassportItem icon={RouteIcon} label="Нить маршрута" value={selectedRoute.details.pathPoints} />
                    </div>
                    <div className="col-span-2">
                      <PassportItem icon={Sparkles} label="Доп. Опции" value={selectedRoute.details.options} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

function PassportItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-10 h-10 mt-0.5 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 text-teal-400">
        <Icon size={14} strokeWidth={2.5} />
      </div>
      <div>
        <span className="block text-[12px] uppercase text-slate-500 font-bold tracking-widest mb-0.5">{label}</span>
        <span className="text-xs text-white font-bold leading-snug block">{value}</span>
      </div>
    </div>
  );
}