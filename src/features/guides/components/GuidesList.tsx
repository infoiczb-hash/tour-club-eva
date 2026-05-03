"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Instagram, Send, X, ArrowRight, ShieldCheck, 
  MapPin, User, ChevronRight, Zap, Flame, Sparkles, 
  Utensils, Activity, Heart, Compass 
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useModalStore } from '@/shared/store/useModalStore';	
import { useInView } from '@/hooks/useInView';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ХУК ДЛЯ НАБЛЮДЕНИЯ ЗА СКРОЛЛОМ (замена whileInView)

// --- СЛОВАРЬ ИКОНОК ДЛЯ RPG-СТАТОВ ---
const ICON_MAP: Record<string, { icon: React.ElementType, color: string }> = {
  Zap: { icon: Zap, color: "text-amber-400" },
  Utensils: { icon: Utensils, color: "text-rose-400" },
  Sparkles: { icon: Sparkles, color: "text-purple-400" },
  Flame: { icon: Flame, color: "text-teal-400" },
  Activity: { icon: Activity, color: "text-sky-400" },
  Heart: { icon: Heart, color: "text-red-500" },
  Compass: { icon: Compass, color: "text-emerald-400" },
};

// --- ТИПЫ ИЗ НОВОЙ СХЕМЫ PRISMA ---
interface Guide {
  id: string;
  slug: string;
  name: string;
  role: string;
  image: string | null;       
  actionImage: string | null; 
  bio: string | null;
  fullBio: string | null;
  superpower: string | null;
  experience: string | null;
  tags: string[];
  achievements: string[];
  quotes: string[];
  stats: any; // JSON из базы
  instagram: string | null;
  telegram: string | null;
  contact: string | null;
  order: number;
  isActive: boolean;
}

// --- КОМПОНЕНТ ШКАЛЫ НАВЫКА (RPG) ---
const SkillBar = ({ label, value, icon: Icon, colorClass }: any) => {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => setWidth(value), 100);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="mb-2">
           <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-300">
                 <Icon size={14} className={colorClass} />
                 <span>{label}</span>
              </div>
              <span className="text-xs font-mono font-bold text-white">{value}%</span>
           </div>
           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                 style={{ width: `${width}%` }} 
                 className={cn("h-full rounded-full shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out", colorClass.replace('text-', 'bg-'))}
              />
           </div>
        </div>
    );
};

export default function GuidesList({ guides = [] }: { guides: Guide[] }) {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null); 
  const openContactModal = useModalStore((state) => state.openContactModal);
  const headerView = useInView({ threshold: 0.1, rootMargin: '-50px' });
  const ctaView = useInView({ threshold: 0.1, rootMargin: '-50px' });

  // Сортируем гидов по полю order (чтобы основатели были первыми)
  const displayGuides = Array.isArray(guides) 
    ? [...guides].sort((a, b) => (a.order || 0) - (b.order || 0)) 
    : [];

  return (
 <section className="py-12 md:py-24 bg-slate-950 text-white relative overflow-hidden" id="team">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-teal-900/5 md:blur-[150px] rounded-full" />
      </div>

      <div className="container relative z-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-8">
            <div className="max-w-2xl">
                <div 
                    ref={headerView.ref}
                    className={cn(
                        "transition-all duration-700 ease-out",
                        headerView.inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"
                    )}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-6">
                        <ShieldCheck size={14} className="text-teal-400" />
                        <span className="text-[16px] font-bold uppercase tracking-widest text-teal-400">Наша команда</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-6xl uppercase tracking-tighter leading-none mb-3 md:mb-4">
                        <span className="font-light text-slate-300 block md:inline">Команда </span>
                        <span className="font-black text-white">Клуба</span>
                        <span className="text-teal-500">.</span>
                    </h2>
                    
                    <p className="text-slate-300 text-sm md:text-base font-medium max-w-md leading-relaxed border-l-2 border-white/10 pl-4">
                        Профессионалы, с которыми безопасно и интересно в любой точке мира.
                        Знают каждый камень на маршруте.
                    </p>
                </div>
            </div>
        </div>

      {/* --- GRID / SCROLL --- */} 
      <div 
        tabIndex={0}
        role="region"
        aria-label="Список команды гидов"
        className="
          flex overflow-x-auto snap-x snap-mandatory hide-scrollbar 
          gap-4 -mx-4 px-4 pb-8 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded-2xl
          md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:mx-0 md:px-0 md:pb-0
        "
      >
            {displayGuides.map((guide, idx) => (
                <GuideCard 
                    key={guide.id} 
                    guide={guide} 
                    index={idx} 
                    onClick={() => setSelectedGuide(guide)} 
                />
            ))}

            {/* JOIN TEAM CARD (Recruiting) */}
            <div
                ref={ctaView.ref}
                onClick={() => openContactModal(undefined, 'HR')}
                style={{ transitionDelay: '200ms' }}
                className={cn(
                    "relative group flex-shrink-0 cursor-pointer snap-center",
                    "w-[85vw] sm:w-[300px] aspect-[3/4] md:w-auto md:aspect-auto md:h-[450px]",
                    "rounded-[2rem] border-2 border-dashed border-white/10 hover:border-teal-500/50",
                    "bg-white/[0.02] hover:bg-teal-900/10 transition-all duration-700 ease-out",
                    "flex flex-col items-center justify-center text-center p-6",
                    "md:mt-0 lg:mt-8",
                    ctaView.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                )}
            >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap size={28} className="text-slate-300 group-hover:text-teal-400 transition-colors" />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase text-white mb-3">Ты?</h3>
                <p className="text-xs text-slate-300 font-medium mb-8 max-w-[220px] leading-relaxed">
                    Хочешь водить группы или стать частью команды? Нам нужны гиды, ассистенты, повара и просто хорошие люди.
                </p>
                <span className="px-5 py-2 rounded-full border border-teal-500/30 text-[12px] font-bold uppercase tracking-widest text-teal-400 flex items-center gap-2 group-hover:bg-teal-500 group-hover:text-slate-900 transition-all">
                    ПОДАТЬ ЗАЯВКУ <ArrowRight size={14} />
                </span>
            </div>
        </div>

      </div>

      {/* --- HERO MODAL --- */}
      {selectedGuide && (
        <GuideHeroModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
      )}
         
    </section>
  );
}

// --- GUIDE CARD ---
function GuideCard({ guide, index, onClick }: { guide: Guide, index: number, onClick: () => void }) {
    const rhythmClass = index % 2 !== 0 ? 'lg:mt-12' : '';
    const { ref, inView } = useInView({ threshold: 0.1, rootMargin: '-50px' });

    return (
        <div
            ref={ref}
            className={cn(
                "group relative flex-shrink-0 cursor-pointer snap-center",
                "w-[85vw] sm:w-[300px] aspect-[3/4] md:w-auto md:aspect-auto md:h-[450px]",
                "rounded-[2rem] overflow-hidden bg-slate-900 border border-white/5",
                rhythmClass,
                "transition-all duration-700 ease-out",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
            style={{ transitionDelay: `${index * 100}ms` }}
            onClick={onClick}
        >
            {guide.image ? (
                <Image
                    src={guide.image}
                    alt={guide.name}
                    fill
                    className="object-cover transition-all duration-700 md:grayscale md:group-hover:grayscale-0 md:scale-100 md:group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 25vw"
                />
            ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <User size={64} className="text-slate-700" />
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 md:opacity-60 md:group-hover:opacity-80 transition-opacity" />

            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                <div className="transform translate-y-2 md:translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="inline-block px-2 py-0.5 rounded bg-teal-500 text-slate-900 text-[12px] font-black uppercase tracking-widest mb-3 shadow-lg">
                        {guide.role}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-white leading-none uppercase tracking-tight mb-2">
                        {guide.name}
                    </h3>
                    
                    {/* Короткое био (превью) на десктопе при наведении */}
                    {guide.bio && (
                        <p className="text-xs text-slate-300 font-medium line-clamp-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
                            {guide.bio}
                        </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-teal-400 text-[12px] font-bold uppercase tracking-widest opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-4">
                        <span>Смотреть профиль</span>
                        <ChevronRight size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- HERO MODAL (ОБНОВЛЕННЫЙ С ДАННЫМИ ИЗ БД) ---
function GuideHeroModal({ guide, onClose }: { guide: Guide, onClose: () => void }) {
    
    // Парсим статы из БД
    let parsedStats: any[] = [];
    if (guide.stats) {
        try {
            parsedStats = typeof guide.stats === 'string' ? JSON.parse(guide.stats) : guide.stats;
        } catch (e) {
            console.error("Ошибка парсинга статов", e);
        }
    }

    // Блокируем скролл на body при открытии модалки
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="relative w-full h-full md:max-w-4xl lg:max-w-5xl md:h-auto md:max-h-[90vh] bg-slate-950 md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} aria-label="Закрыть" className="absolute top-6 right-6 z-50 p-3 bg-black/50 hover:bg-white text-white hover:text-black rounded-full transition-all border border-white/10">
                    <X size={24} />
                </button>

                {/* LEFT: PHOTO (Приоритет у широкого Action Image) */}
                <div className="w-full md:w-5/12 h-[40vh] md:h-auto relative">
                    {guide.actionImage || guide.image ? (
                       <Image 
                          src={guide.actionImage || guide.image || ''} 
                          alt={guide.name} 
                          fill 
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          quality={85}
                       />
                    ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center"><User size={64} className="text-slate-700" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent md:bg-gradient-to-r md:from-slate-950/90 md:to-transparent" />
                    
                    <div className="absolute bottom-4 left-4 right-4 md:hidden">
                        <h2 className="text-4xl font-black text-white leading-[0.9] drop-shadow-lg">{guide.name}</h2>
                    </div>
                </div>

                {/* RIGHT: INFO */}
                <div className="w-full md:w-7/12 p-6 md:p-10 flex flex-col h-[60vh] md:h-auto bg-slate-950 relative">
                    
                    <div className="hidden md:block mb-8 shrink-0">
                         <div className="text-[12px] font-mono text-teal-500 uppercase tracking-widest mb-2 opacity-60">
                             {guide.experience ? `Опыт: ${guide.experience}` : 'Профиль инструктора'}
                         </div>
                         <h2 className="text-5xl lg:text-6xl font-black text-white leading-[0.85] tracking-tight">{guide.name}</h2>
                    </div>

                    {/* ✅ ИСПРАВЛЕНИЕ: Убрали pb-24/32, так как футер теперь не sticky */}
                    <div className="flex-1 overflow-y-auto pr-4 -mr-2 scrollbar-thin scrollbar-thumb-slate-800 pb-4">
                        
                        {/* Суперсила и Теги */}
                        <div className="flex flex-wrap gap-2 mb-8">
                             <span className="px-3 py-1 bg-teal-500 text-slate-950 text-[12px] font-black uppercase rounded shadow-lg">{guide.role}</span>
                             {guide.superpower && (
                                <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 text-[12px] font-bold uppercase rounded flex items-center gap-1 shadow-sm">
                                    <Sparkles size={12} className="text-amber-400"/> {guide.superpower}
                                </span>
                             )}
                             {guide.tags && guide.tags.map((tag, idx) => (
                                 <span key={idx} className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 text-[12px] font-bold uppercase tracking-wider rounded">
                                     {tag}
                                 </span>
                             ))}
                        </div>

                        {/* RPG СТАТИСТИКА */}
                        {parsedStats.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-10 p-6 bg-white/[0.03] rounded-3xl border border-white/5 shadow-inner">
                                {parsedStats.map((stat, i) => {
                                    const mapping = ICON_MAP[stat.icon] || ICON_MAP['Zap'];
                                    return (
                                        <SkillBar 
                                            key={i} 
                                            label={stat.label} 
                                            value={stat.value} 
                                            icon={mapping.icon} 
                                            colorClass={mapping.color} 
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* БИОГРАФИЯ */}
                        <div className="mb-8">
                            <h3 className="text-[12px] font-bold text-slate-300 uppercase tracking-widest mb-3">Досье</h3>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                                {guide.fullBio || guide.bio || "Опытный путешественник, который ценит безопасность и хорошую компанию."}
                            </p>
                        </div>

                        {/* ЦИТАТА */}
                        {guide.quotes && guide.quotes.length > 0 && (
                            <div className="mb-8 border-l-2 border-teal-500 pl-4 py-1">
                                <h4 className="text-[12px] font-bold text-slate-300 uppercase tracking-widest mb-3">Цитаты</h4> 
                                <p className="text-lg md:text-xl font-medium text-white italic leading-snug">
                                    «{guide.quotes[0]}»
                                </p>
                            </div>
                        )}

                        {/* СОЦСЕТИ */}
                        <div className="flex gap-3 mb-8">
                            {guide.instagram && <SocialBtn href={guide.instagram} icon={Instagram} />}
                            {guide.telegram && <SocialBtn href={guide.telegram} icon={Send} />}
                        </div>

                        {/* ✅ ИСПРАВЛЕНИЕ: Кнопка перенесена внутрь скроллируемого блока */}
                        <div className="pt-6 border-t border-white/10">
                            <Link 
                                href={`/tour`} // В будущем можно сделать: href={`/tour?guide=${guide.slug}`}
                                className="w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] active:scale-[0.98]"
                            >
                                <MapPin size={18} strokeWidth={2.5} />
                                <span>ТУРЫ СО МНОЙ</span>
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function SocialBtn({ href, icon: Icon }: any) {
   return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all hover:text-white hover:border-white/30">
         <Icon size={18} />
      </a>
   )
}