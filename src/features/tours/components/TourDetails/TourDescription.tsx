"use client";

import React from 'react';
import { Star, Zap, Shield, Heart, Camera, Coffee, Mountain, Map, Sun, Compass, Hash } from 'lucide-react';
import { clsx } from 'clsx';

const ICON_MAP: Record<string, any> = {
  star: Star, zap: Zap, shield: Shield, 
  heart: Heart, camera: Camera, coffee: Coffee,
  mountain: Mountain, map: Map, sun: Sun
};

interface TourDescriptionProps {
  description?: string | null;
  highlights?: any[];
  tags?: string[]; // <--- ДОБАВИЛИ ПРОПС
}

export default function TourDescription({ description, highlights, tags }: TourDescriptionProps) {
  
  const renderDescription = (text: string) => {
    if (!text) return null;
    
    const paragraphs = text.split(/\n+/); 

    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return null;

      let formattedHtml = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<span class="text-teal-400 font-bold uppercase tracking-wide">$1</span>')
        .replace(/<b>(.*?)<\/b>/g, '<span class="text-teal-400 font-bold uppercase tracking-wide">$1</span>')
        .replace(/->/g, '<span class="text-slate-400 mx-1">→</span>');

      return (
        <div key={index} className="mb-3 last:mb-0">
          <div 
          className="text-slate-200 text-sm md:text-base leading-snug md:leading-7 font-normal text-justify"
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />
      </div>
      );
    });
  };

  return (
    <section className="scroll-mt-24" id="about">
      
      {/* 1. БЛОК ТЕГОВ (НОВОЕ) */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {tags.map((tag, i) => (
            <span 
              key={i}
              className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 hover:bg-teal-500/20 transition-colors cursor-default"
            >
              <Hash size={12} />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 2. БЛОК ВПЕЧАТЛЕНИЙ */}
      {highlights && highlights.length > 0 && (
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-[2px] bg-teal-500"></span>
              <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest">
                Что вас ждет
              </h3>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlights.map((item: any, i: number) => {
                const IconComponent = ICON_MAP[item.icon?.toLowerCase()] || Star;
                return (
                  <div 
                    key={i} 
                    className="group bg-slate-900/50 border border-white/5 hover:border-teal-500/30 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/5"
                  >
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-teal-500 mb-3 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-slate-900 transition-all duration-300 shadow-inner">
                      <IconComponent size={20} strokeWidth={1.5} />
                    </div>
                    <h4 className="font-bold text-white text-base mb-1 group-hover:text-teal-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-slate-400 text-sm leading-snug text-left">
                      {item.desc || item.description}
                    </p>
                  </div>
                )
              })}
           </div>
        </div>
      )}

      {/* 3. ЗАГОЛОВОК */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20">
           <Compass size={20} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
           О путешествии
        </h2>
      </div>

      {/* 4. ТЕКСТОВОЕ ОПИСАНИЕ */}
      <div className="bg-slate-900/30 rounded-3xl border border-white/5 p-5 md:p-6">
         <div className="prose prose-invert max-w-none">
            {description ? renderDescription(description) : (
              <p className="italic opacity-50">Описание готовится...</p>
            )}
         </div>
      </div>

    </section>
  );
}