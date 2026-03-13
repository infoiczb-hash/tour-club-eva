// src/features/guides/components/GuidesEditorialList.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Instagram, Send, ArrowRight, Zap, Flame, 
  Sparkles, Utensils, Activity, Heart, Compass, User 
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useModalStore } from '@/shared/store/useModalStore';	

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// СЛОВАРЬ ИКОНОК ДЛЯ НАВЫКОВ
const ICON_MAP: Record<string, { icon: React.ElementType, color: string }> = {
  Zap: { icon: Zap, color: "text-amber-400" },
  Utensils: { icon: Utensils, color: "text-rose-400" },
  Sparkles: { icon: Sparkles, color: "text-purple-400" },
  Flame: { icon: Flame, color: "text-teal-400" },
  Activity: { icon: Activity, color: "text-sky-400" },
  Heart: { icon: Heart, color: "text-red-500" },
  Compass: { icon: Compass, color: "text-emerald-400" },
};

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
  stats: any; 
  instagram: string | null;
  telegram: string | null;
  order: number;
}

// --- КОМПОНЕНТ ШКАЛЫ НАВЫКА ---
const SkillBar = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className="mb-2">
       <div className="flex justify-between items-end mb-2">
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-400">
             <Icon size={14} className={colorClass} />
             <span>{label}</span>
          </div>
          <span className="text-xs font-mono font-bold text-white">{value}%</span>
       </div>
       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
             style={{ width: `${value}%` }} 
             className={cn("h-full rounded-full shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out", colorClass.replace('text-', 'bg-'))}
          />
       </div>
    </div>
);

// --- ГЛАВНЫЙ КОМПОНЕНТ СПИСКА ---
export default function GuidesEditorialList({ guides = [] }: { guides: Guide[] }) {
    const openContactModal = useModalStore((state) => state.openContactModal);
    
    const displayGuides = Array.isArray(guides) 
        ? [...guides].sort((a, b) => (a.order || 0) - (b.order || 0)) 
        : [];

    return (
        <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex flex-col gap-24 md:gap-32 pb-24">
                
                {/* 1. Блоки Гидов */}
                {displayGuides.map((guide, index) => (
                    <EditorialGuideBlock key={guide.id} guide={guide} index={index} />
                ))}

                {/* 2. Блок HR (Призыв в команду) */}
                <div
                    className="relative mt-12 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 md:p-16 text-center overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-500/10 rounded-3xl flex items-center justify-center text-teal-400 mb-8 border border-teal-500/20 shadow-lg">
                            <Zap size={36} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                            Хочешь носить <br className="hidden md:block"/><span className="text-teal-500">такой же бейдж?</span>
                        </h2>
                        <p className="text-slate-400 font-medium text-base md:text-lg max-w-2xl leading-relaxed mb-10">
                            Мы всегда в поиске людей, влюбленных в природу: гидов, фотографов, поваров и организаторов. Если ты готов делиться эмоциями — нам по пути.
                        </p>
                        <button
                            onClick={() => openContactModal(undefined, 'HR')}
                            className="w-full sm:w-auto px-10 py-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_40px_rgba(20,184,166,0.5)] active:scale-95 flex items-center justify-center gap-3"
                        >
                            <span>Подать заявку</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- ОТДЕЛЬНЫЙ БЛОК ГИДА (Z-ПАТТЕРН) ---
function EditorialGuideBlock({ guide, index }: { guide: Guide, index: number }) {
    // Если индекс нечетный — меняем порядок колонок на десктопе
    const isReverse = index % 2 !== 0;

    let parsedStats: any[] = [];
    if (guide.stats) {
        try { parsedStats = typeof guide.stats === 'string' ? JSON.parse(guide.stats) : guide.stats; } 
        catch (e) {}
    }

    return (
        <div
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
            style={{ animationDelay: `${Math.min(index * 150, 600)}ms` }}
        >
            {/* КОЛОНКА 1: ФОТО */}
            <div className={cn(
                "lg:col-span-5 relative w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 bg-slate-900 group",
                isReverse ? "lg:order-2" : "lg:order-1"
            )}>
                {guide.actionImage || guide.image ? (
                    <Image
                        src={guide.actionImage || guide.image || ''}
                        alt={guide.name}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <User size={64} className="text-slate-700" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60" />
            </div>

            {/* КОЛОНКА 2: ИНФОРМАЦИЯ */}
            <div className={cn(
                "lg:col-span-7 flex flex-col",
                isReverse ? "lg:order-1" : "lg:order-2"
            )}>
                {/* 1. Бейджи */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-4 py-1.5 bg-teal-500 text-slate-950 text-sm font-black uppercase tracking-widest rounded-lg shadow-lg">
                        {guide.role}
                    </span>
                    {guide.superpower && (
                        <span className="px-4 py-1.5 bg-slate-900 border border-white/10 text-slate-300 text-sm font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 shadow-sm">
                            <Sparkles size={14} className="text-amber-400" /> {guide.superpower}
                        </span>
                    )}
                </div>

                {/* 2. Имя */}
                <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6 drop-shadow-lg">
                    {guide.name}
                </h2>

                {/* 3. Краткая Биография (только bio для превью) */}
                <div className="text-base md:text-lg text-slate-400 leading-relaxed mb-6 font-medium whitespace-pre-wrap">
                    {guide.bio || guide.fullBio}
                </div>

                {/* 4. Теги */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {guide.tags && guide.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-lg">
                            #{tag}
                        </span>
                    ))}
                </div>

                {/* 5. RPG Статистика */}
                {parsedStats.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-8 p-6 md:p-8 bg-slate-900/50 rounded-3xl border border-white/5 shadow-inner">
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
             
                {/* 7. Кнопки действий */}
                <div className="flex flex-wrap items-center gap-4 mt-auto pt-8 border-t border-white/10">
                    <Link
                        href={`/guides/${guide.slug}`}
                        className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest text-sm transition-all border border-white/5 hover:border-white/20 flex items-center gap-2 group w-full sm:w-auto justify-center"
                    >
                        Подробное досье
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    {(guide.instagram || guide.telegram) && (
                        <div className="flex gap-3 justify-center w-full sm:w-auto">
                            {guide.instagram && (
                                <a href={guide.instagram} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 hover:border-teal-500/50 text-slate-400 hover:text-teal-400 transition-all shadow-sm">
                                    <Instagram size={20} />
                                </a>
                            )}
                            {guide.telegram && (
                                <a href={guide.telegram} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 hover:border-teal-500/50 text-slate-400 hover:text-teal-400 transition-all shadow-sm">
                                    <Send size={20} className="ml-[-2px]" />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}