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
  tags?: string[];
}

export default function TourDescription({ description, highlights, tags }: TourDescriptionProps) {
  
  const renderDescription = (text: string) => {
    if (!text) return null;
    const paragraphs = text.split(/\n+/); 
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return null;
      let formattedHtml = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-black">$1</strong>')
        .replace(/<b>(.*?)<\/b>/g, '<strong class="text-white font-black">$1</strong>')
        .replace(/->/g, '<span class="text-teal-500 font-bold mx-1">→</span>');
      return (
        <div key={index} className="mb-4 last:mb-0">
          <div 
            className="text-slate-300 text-sm md:text-base leading-relaxed font-normal text-left"
            dangerouslySetInnerHTML={{ __html: formattedHtml }}
          />
        </div>
      );
    });
  };

  return (
    <section className="scroll-mt-24" id="about">
      
      {/* ===== 1. БЛОК ВПЕЧАТЛЕНИЙ И ТЕГОВ ===== */}
      {(highlights && highlights.length > 0) || (tags && tags.length > 0) ? (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

          {/* Лейбл блока — p вместо h3 чтобы не нарушать порядок заголовков:
              h3 до h2 — нарушение. Визуально идентично, семантически корректно. */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-[2px] bg-teal-500 rounded-full" aria-hidden="true"></span>
            <p className="text-xs md:text-sm font-black text-teal-400 uppercase tracking-widest">
              Что вас ждет в туре
            </p>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag, i) => (
                <span 
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] md:text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-default"
                >
                  <Hash size={12} strokeWidth={2.5} aria-hidden="true" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {highlights && highlights.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {highlights.map((item: any, i: number) => {
                const IconComponent = ICON_MAP[item.icon?.toLowerCase()] || Star;
                return (
                  <div 
                    key={i} 
                    className="group bg-slate-900/50 border border-white/5 rounded-2xl p-3 md:p-4 hover:bg-slate-800/80 hover:border-teal-500/30 transition-all duration-300 flex flex-col"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-teal-500 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors">
                        <IconComponent size={16} strokeWidth={2} aria-hidden="true" />
                      </div>
                      <p className="font-bold text-white text-[14px] md:text-sm leading-tight group-hover:text-teal-400 transition-colors line-clamp-2">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-slate-400 text-sm md:text-sm leading-snug text-left">
                      {item.desc || item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* ===== 2. О ПУТЕШЕСТВИИ (h2 — главный заголовок секции) ===== */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20 shrink-0">
          <Compass size={20} strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
          О путешествии
        </h2>
      </div>

      <div className="bg-slate-900/30 rounded-3xl border border-white/5 p-5 md:p-8">
        <div className="prose prose-invert max-w-none">
          {description ? renderDescription(description) : (
            <p className="italic text-slate-400 text-sm">Описание готовится...</p>
          )}
        </div>
      </div>

    </section>
  );
}