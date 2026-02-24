"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Instagram, Send, X, ArrowRight, ShieldCheck, 
  MapPin, User, ChevronRight, Zap, Flame, Sparkles, Utensils
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ContactHubModal from "@/components/modals/ContactHubModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface Guide {
  id: string | number;
  name: string;
  role: string;
  image: string | null;       
  actionImage?: string | null; 
  bio?: string | null;
  superpower?: string | null;
  experience?: string | null;
  achievements?: string[];
  instagram?: string | null;
  telegram?: string | null;
  contact?: string | null;
}

// --- RPG STATS COMPONENT ---
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
          <motion.div 
             initial={{ width: 0 }} 
             animate={{ width: `${value}%` }} 
             transition={{ duration: 1, ease: "easeOut" }}
             className={cn("h-full rounded-full shadow-[0_0_10px_currentColor]", colorClass.replace('text-', 'bg-'))}
          />
       </div>
    </div>
);

export default function GuidesList({ guides = [] }: { guides: Guide[] }) {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const displayGuides = Array.isArray(guides) ? guides : [];

  return (
    // Уменьшили отступы секции: py-12 md:py-24 (было больше)
    <section className="py-12 md:py-24 bg-slate-950 text-white relative overflow-hidden" id="team">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-teal-900/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-8">
            <div className="max-w-2xl">
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-6">
                        <ShieldCheck size={14} className="text-teal-400" />
                        <span className="text-[12px] font-bold uppercase tracking-widest text-teal-400">Наша команда</span>
                    </div>
                    
                    {/* Title: Чистый белый цвет */}
                    <h2 className="text-3xl md:text-6xl uppercase tracking-tighter leading-none mb-3 md:mb-4">
            <span className="font-light text-slate-400 block md:inline">Команда </span>
            <span className="font-black text-white">Клуба</span>
            <span className="text-teal-500">.</span>
        </h2>
                    
                    {/* Subtitle */}
                    <p className="text-slate-400 text-sm md:text-base font-medium max-w-md leading-relaxed border-l-2 border-white/10 pl-4">
                        Профессионалы, с которыми безопасно и интересно в любой точке мира.
                        Знают каждый камень на маршруте.
                    </p>
                </motion.div>
            </div>

            </div>

        {/* --- GRID / SCROLL --- */}
        {/* gap-4 : Добавлен отступ между карточками на мобильном (чтобы не слипались)
           -mx-4 px-4 : Отрицательные отступы чтобы скролл уходил за край экрана
        */}
        <div className="
            flex overflow-x-auto snap-x snap-mandatory hide-scrollbar 
            gap-4 -mx-4 px-4 pb-8
            md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:mx-0 md:px-0 md:pb-0
        ">
            {displayGuides.map((guide, idx) => (
                <GuideCard 
                    key={guide.id} 
                    guide={guide} 
                    index={idx} 
                    onClick={() => setSelectedGuide(guide)} 
                />
            ))}

            {/* JOIN TEAM CARD (Recruiting) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                onClick={() => setIsContactOpen(true)}
                className="
                    relative group flex-shrink-0 cursor-pointer snap-center
                    w-[85vw] sm:w-[300px] aspect-[3/4] md:w-auto md:aspect-auto md:h-[450px]
                    rounded-[2rem] border-2 border-dashed border-white/10 hover:border-teal-500/50
                    bg-white/[0.02] hover:bg-teal-900/10 transition-all duration-300
                    flex flex-col items-center justify-center text-center p-6
                    md:mt-0 lg:mt-8
                "
            >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap size={28} className="text-slate-400 group-hover:text-teal-400 transition-colors" />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase text-white mb-3">Ты?</h3>
                <p className="text-xs text-slate-400 font-medium mb-8 max-w-[220px] leading-relaxed">
                    Хочешь водить группы или стать частью команды? Нам нужны гиды, технические ассистенты, повара и просто хорошие люди.
                </p>
                <span className="px-5 py-2 rounded-full border border-teal-500/30 text-[12px] font-bold uppercase tracking-widest text-teal-400 flex items-center gap-2 group-hover:bg-teal-500 group-hover:text-slate-900 transition-all">
                    ПОДАТЬ ЗАЯВКУ <ArrowRight size={14} />
                </span>
            </motion.div>
        </div>

      </div>

      {/* --- HERO MODAL --- */}
      <AnimatePresence>
        {selectedGuide && (
          <GuideHeroModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
        )}
      </AnimatePresence>

      <ContactHubModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
        initialTab="HR"
      />
      
    </section>
  );
}

// --- GUIDE CARD ---
function GuideCard({ guide, index, onClick }: { guide: Guide, index: number, onClick: () => void }) {
    // Ритм: четные ниже на десктопе
    const rhythmClass = index % 2 !== 0 ? 'lg:mt-12' : '';

    return (
        <motion.div
            layoutId={`guide-${guide.id}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
                "group relative flex-shrink-0 cursor-pointer snap-center",
                "w-[85vw] sm:w-[300px] aspect-[3/4] md:w-auto md:aspect-auto md:h-[450px]",
                "rounded-[2rem] overflow-hidden bg-slate-900 border border-white/5",
                rhythmClass
            )}
            onClick={onClick}
        >
            {/* PHOTO: Color on mobile, BW on desktop until hover */}
            {guide.image ? (
                <Image
                    src={guide.image}
                    alt={guide.name}
                    fill
                    className="object-cover transition-all duration-700 
                    md:grayscale md:group-hover:grayscale-0 
                    md:scale-100 md:group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 25vw"
                />
            ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <User size={64} className="text-slate-700" />
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 md:opacity-60 md:group-hover:opacity-80 transition-opacity" />

            {/* INFO */}
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                <div className="transform translate-y-2 md:translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="inline-block px-2 py-0.5 rounded bg-teal-500 text-slate-900 text-[9px] font-black uppercase tracking-widest mb-3">
                        {guide.role}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-white leading-none uppercase tracking-tight mb-2">
                        {guide.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-teal-400 text-[12px] font-bold uppercase tracking-widest opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-4">
                        <span>Смотреть профиль</span>
                        <ChevronRight size={14} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// --- HERO MODAL ---
// --- HERO MODAL ---
function GuideHeroModal({ guide, onClose }: { guide: Guide, onClose: () => void }) {
    
    // DEMO STATS (в будущем из БД)
    const stats = [
        { label: "ВЫНОСЛИВОСТЬ", value: 95, icon: Zap, color: "text-amber-400" },
        { label: "КУЛИНАРИЯ", value: 80, icon: Utensils, color: "text-rose-400" },
        { label: "ХАРИЗМА", value: 90, icon: Sparkles, color: "text-purple-400" },
        { label: "ОПЫТ", value: 100, icon: Flame, color: "text-teal-400" },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/95 backdrop-blur-xl"
            onClick={onClose}
        >
            <motion.div 
                layoutId={`guide-${guide.id}`}
                // Убрали жесткий aspect-ratio, разрешили тянуться по высоте (h-auto), но не больше 90% экрана
                className="relative w-full h-full md:max-w-4xl lg:max-w-5xl md:h-auto md:max-h-[90vh] bg-slate-950 md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-white text-white hover:text-black rounded-full transition-all border border-white/10">
                    <X size={24} />
                </button>

                {/* LEFT: PHOTO */}
                {/* Заменили md:h-full на md:h-auto, чтобы фото тянулось за текстом */}
                <div className="w-full md:w-5/12 h-[40vh] md:h-auto relative">
                    {guide.image ? (
                        <Image src={guide.actionImage || guide.image} alt={guide.name} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center"><User size={64}/></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent md:bg-gradient-to-r md:from-slate-950/90 md:to-transparent" />
                    
                    <div className="absolute bottom-4 left-4 right-4 md:hidden">
                        <h2 className="text-4xl font-black text-white uppercase leading-[0.9] drop-shadow-lg">{guide.name}</h2>
                    </div>
                </div>

                {/* RIGHT: INFO */}
                {/* Заменили md:h-full на md:h-auto */}
                <div className="w-full md:w-7/12 p-6 md:p-10 flex flex-col h-[60vh] md:h-auto bg-slate-950 relative">
                    
                    {/* Header Desktop */}
                    <div className="hidden md:block mb-8 shrink-0">
                         <div className="text-[12px] font-mono text-teal-500 uppercase tracking-widest mb-2 opacity-60">Instuctor Profile</div>
                         <h2 className="text-5xl lg:text-6xl font-black text-white uppercase leading-[0.85] tracking-tight">{guide.name}</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide pb-24 md:pb-32">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-8">
                             <span className="px-3 py-1 bg-teal-500 text-slate-950 text-[12px] font-black uppercase rounded">{guide.role}</span>
                             {guide.superpower && (
                                <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 text-[12px] font-bold uppercase rounded flex items-center gap-1">
                                    <Sparkles size={10} className="text-amber-400"/> {guide.superpower}
                                </span>
                             )}
                        </div>

                        {/* STATS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-10 p-6 bg-white/[0.03] rounded-3xl border border-white/5">
                            {stats.map((stat, i) => (
                                <SkillBar key={i} {...stat} colorClass={stat.color} />
                            ))}
                        </div>

                        {/* BIO */}
                        <div className="mb-8">
                            <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">Биография</h4>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                {guide.bio || "Опытный путешественник, который ценит безопасность и хорошую компанию. Всегда знает, где самый красивый вид и вкусная вода."}
                            </p>
                        </div>

                        {/* Socials */}
                        <div className="flex gap-3 mb-4">
                            {guide.instagram && <SocialBtn href={guide.instagram} icon={Instagram} />}
                            {guide.telegram && <SocialBtn href={guide.telegram} icon={Send} />}
                        </div>
                    </div>

                    {/* STICKY FOOTER */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:px-10 md:pb-10 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                         <Link 
                            href={`/tour`} 
                            className="w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] active:scale-[0.98]"
                         >
                            <MapPin size={18} strokeWidth={2.5} />
                            <span>ТУРЫ СО МНОЙ</span>
                         </Link>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
}

function SocialBtn({ href, icon: Icon }: any) {
   return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 transition-all hover:text-white hover:border-white/30">
         <Icon size={18} />
      </a>
   )
}