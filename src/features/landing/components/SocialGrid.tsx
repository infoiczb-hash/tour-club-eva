"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Instagram, Send, Play, X, Zap, Volume2, VolumeX, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- ТИПЫ ---
interface SocialPost {
  id: number;
  type: string;
  url: string;
  cover: string;
  likes: number;
  caption: string;
}

// --- ИКОНКИ ---
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
);

const SOCIAL_LINKS = [
  { 
    name: "Instagram", 
    icon: <Instagram size={16} />, 
    url: "https://instagram.com/evaturclub", 
    color: "hover:text-pink-500 hover:border-pink-500/50 hover:bg-pink-500/10" 
  },
  { 
    name: "TikTok", 
    icon: <TikTokIcon className="w-4 h-4" />, 
    url: "https://tiktok.com/@evaturclub", 
    color: "hover:text-teal-400 hover:border-teal-400/50 hover:bg-teal-400/10" 
  },
  { 
    name: "Telegram", 
    icon: <Send size={16} />, 
    url: "https://t.me/evaturclub", 
    color: "hover:text-sky-500 hover:border-sky-500/50 hover:bg-sky-500/10" 
  }
];

// ==========================================
// 1. FullScreen Vertical Player (TikTok Style)
// ==========================================
const VerticalPlayer = ({ 
    posts, 
    initialIndex, 
    onClose 
}: { 
    posts: SocialPost[], 
    initialIndex: number, 
    onClose: () => void 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Скроллим к выбранному видео при открытии
    useEffect(() => {
        if (containerRef.current) {
            const height = containerRef.current.clientHeight;
            containerRef.current.scrollTo({ top: initialIndex * height, behavior: 'instant' });
        }
    }, [initialIndex]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 bg-black/20 backdrop-blur-lg rounded-full text-white/80 hover:text-white border border-white/10"
            >
                <X size={24} />
            </button>

            {/* Vertical Scroll Container */}
            <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
            >
                {posts.map((post) => (
                    <SingleSlide key={post.id} post={post} />
                ))}
            </div>

            {/* Navigation Hints (Desktop) */}
            <div className="hidden md:flex flex-col gap-2 absolute right-8 top-1/2 -translate-y-1/2 z-40">
                 <div className="p-2 bg-white/5 rounded-full animate-bounce"><ChevronUp size={20} className="text-white/50"/></div>
                 <div className="p-2 bg-white/5 rounded-full animate-bounce"><ChevronDown size={20} className="text-white/50"/></div>
            </div>
        </motion.div>
    );
};

// Отдельный слайд для логики IntersectionObserver (Play/Pause при скролле)
const SingleSlide = ({ post }: { post: SocialPost }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true); // По умолчанию звук выключен (политика браузеров)
    const [isPlaying, setIsPlaying] = useState(false);

    // Intersection Observer: Запускает видео только когда оно в центре экрана
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().catch(() => {});
                    setIsPlaying(true);
                } else {
                    videoRef.current?.pause();
                    if (videoRef.current) videoRef.current.currentTime = 0;
                    setIsPlaying(false);
                }
            },
            { threshold: 0.6 } // 60% видео должно быть видно
        );

        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    const toggleMute = () => setIsMuted(!isMuted);

    return (
        <div className="w-full h-full snap-center relative flex items-center justify-center bg-black">
            {/* Video */}
            <video 
                ref={videoRef}
                src={post.url}
                className="h-full w-full md:w-auto md:max-w-[500px] object-cover md:rounded-2xl"
                loop
                playsInline
                muted={isMuted}
                onClick={toggleMute} // Клик по видео включает звук
            />
            
            {/* Sound Overlay Hint */}
            {isMuted && isPlaying && (
                <div 
                    className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer bg-black/10 hover:bg-black/20 transition-colors"
                    onClick={toggleMute}
                >
                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-full animate-pulse border border-white/10">
                         <VolumeX size={32} className="text-white" />
                         <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[12px] font-bold uppercase tracking-widest text-white whitespace-nowrap">Tap for Sound</span>
                    </div>
                </div>
            )}

            {/* Controls / Info */}
            <div className="absolute bottom-0 inset-x-0 p-6 md:p-10 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none md:max-w-[500px] mx-auto">
                 <div className="flex items-center justify-between items-end">
                     <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[12px] font-bold uppercase tracking-widest text-teal-400 bg-teal-950/80 px-2 py-1 rounded border border-teal-500/20 backdrop-blur-md">
                                Eva Club
                            </span>
                            {!isMuted && <Volume2 size={16} className="text-white/80" />}
                        </div>
                        <p className="text-white font-medium text-sm md:text-lg leading-snug drop-shadow-md max-w-[85%]">
                            {post.caption}
                        </p>
                     </div>
                     
                     {/* Side Actions */}
                     <div className="flex flex-col gap-4 items-center pointer-events-auto">
                         <div className="flex flex-col items-center gap-1">
                             <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                 <Heart size={20} className="text-rose-500" fill="currentColor"/>
                             </div>
                             <span className="text-[12px] font-bold text-white">{post.likes}</span>
                         </div>
                         <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                             <Send size={18} className="text-white" />
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};

// ==========================================
// 2. Main Component (Grid)
// ==========================================
export default function SocialGrid() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [activePostIndex, setActivePostIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/social/posts.json')
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((data) => {
        if (data.posts && Array.isArray(data.posts)) setPosts(data.posts.slice(0, 6));
      })
      .catch((err) => console.error(err));
  }, []);

  if (posts.length === 0) return null; 

  return (
    <section className="py-12 md:py-24 bg-slate-950 text-white relative overflow-hidden border-t border-white/5">
      
      {/* GLOW */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-teal-900/10 md:md:blur-[150px] pacity-50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
       {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
               <span className="text-[16px] font-bold uppercase tracking-widest text-teal-400">Live Feed</span>
            </div>
            {/* Title */}
            <h2 className="text-3xl md:text-6xl uppercase tracking-tighter leading-none mb-3 md:mb-4">
                <span className="font-light text-slate-400 block md:inline">Ловим </span>
                <span className="font-black text-white">Моменты</span>
                <span className="text-teal-500">.</span>
            </h2>
          </div>

          <div className="flex gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a 
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center gap-2 transition-all duration-300",
                  "text-slate-400 text-xs font-bold uppercase tracking-wider",
                  social.color
                )}
              >
                {social.icon}
                <span className="hidden md:inline">{social.name}</span>
              </a>
            ))}
          </div>
        </div>
{/* --- GRID / CAROUSEL --- */}
<div className="relative group/carousel">
    <div 
      // ✅ ДОБАВЛЕНО ДЛЯ a11y:
      tabIndex={0}
      role="region"
      aria-label="Лента моментов из туров"
      className="
        flex overflow-x-auto snap-x snap-mandatory hide-scrollbar
        gap-4 md:gap-6 pb-8 px-4 -mx-4 md:px-0 md:mx-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded-2xl
    ">
    {posts.map((post, index) => (
        <ReelCard 
            key={post.id} 
            post={post} 
            onClick={() => setActivePostIndex(index)} 
        />
    ))}
    </div>
            
            {/* SWIPE HINT (Mobile only, bottom right) */}
            <div className="md:hidden absolute bottom-0 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
                <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                <ChevronRight size={14} />
            </div>
        </div>

      </div>

      {/* --- TIKTOK MODAL --- */}
      <AnimatePresence>
        {activePostIndex !== null && (
            <VerticalPlayer 
                posts={posts} 
                initialIndex={activePostIndex} 
                onClose={() => setActivePostIndex(null)} 
            />
        )}
      </AnimatePresence>
    </section>
  );
}

// --- CARD COMPONENT ---
function ReelCard({ post, onClick }: { post: SocialPost; onClick: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleMouseEnter = () => videoRef.current?.play().catch(() => {});
    const handleMouseLeave = () => {
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
    };

    return (
      <motion.div 
        className="
            relative group flex-shrink-0 cursor-pointer snap-center
            w-[200px] aspect-[9/16] md:w-[240px] md:aspect-[9/16]
            rounded-2xl overflow-hidden bg-slate-900 border border-white/5
            transition-all duration-500 ease-out
            hover:border-teal-500/30 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)]
        "
        whileHover={{ y: -8 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {/* Cover */}
        <div className="absolute inset-0 z-10 transition-opacity duration-700 group-hover:opacity-0 pointer-events-none">
            <Image
                src={post.cover}
                alt={post.caption}
                fill
                className="object-cover filter brightness-[0.85]"
                sizes="(max-width: 768px) 50vw, 20vw"
            />
        </div>

        {/* Grid Preview Video (Muted) */}
        <video
          ref={videoRef}
          src={post.url}
          muted
          loop
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85] group-hover:brightness-100 transition-all duration-700 z-0"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity z-20 pointer-events-none" />

        {/* HUD */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between z-20 pointer-events-none">
            {/* Mute Icon in Grid */}
            <div className="self-end w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-white/50">
                <VolumeX size={12} />
            </div>

            <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center justify-between mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1.5">
                        <Heart size={12} className="text-rose-500" fill="currentColor"/> 
                        <span className="text-[12px] font-bold text-white">{post.likes}</span>
                    </div>
                </div>
                <p className="text-xs font-medium text-white line-clamp-2 leading-snug drop-shadow-sm group-hover:text-teal-50 transition-colors">
                    {post.caption}
                </p>
            </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 z-20">
           <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg">
              <Play size={16} fill="currentColor" className="ml-1"/>
           </div>
        </div>
      </motion.div>
    );
}