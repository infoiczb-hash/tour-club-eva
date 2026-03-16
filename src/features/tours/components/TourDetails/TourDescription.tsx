import React from 'react';
import { Star, Zap, Shield, Heart, Camera, Coffee, Mountain, Map, Sun, Compass, Hash } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  star: Star, zap: Zap, shield: Shield, 
  heart: Heart, camera: Camera, coffee: Coffee,
  mountain: Mountain, map: Map, sun: Sun
};

interface TourDescriptionProps {
  description?: any;
  highlights?: any[];
  tags?: string[];
}

export default function TourDescription({ description, highlights, tags }: TourDescriptionProps) {
  // Подготавливаем HTML-контент из базы
  let htmlContent = '';
  if (typeof description === 'string') {
    htmlContent = description;
  } else if (Array.isArray(description)) {
    htmlContent = description.filter(p => typeof p === 'string').join('<br/>');
  } else if (description) {
    htmlContent = String(description);
  }

  return (
    <section className="scroll-mt-24" id="about">
      
      {((highlights && highlights.length > 0) || (tags && tags.length > 0)) && (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

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
                  className="px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] md:text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-default min-w-0 max-w-full"
                >
                  <Hash size={12} strokeWidth={2.5} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">{tag}</span>
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
                    className="group bg-slate-900/50 border border-white/5 rounded-2xl p-3 md:p-4 hover:bg-slate-800/80 hover:border-teal-500/30 transition-all duration-300 flex flex-col min-w-0"
                  >
                    <div className="flex items-start gap-2.5 mb-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-teal-500 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors mt-0.5">
                        <IconComponent size={16} strokeWidth={2} aria-hidden="true" />
                      </div>
                      <p className="font-bold text-white text-[14px] md:text-sm leading-tight group-hover:text-teal-400 transition-colors line-clamp-2 break-words min-w-0 flex-1 pt-1.5">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-slate-400 text-sm md:text-sm leading-snug text-left break-words">
                      {item.desc || item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mb-5 min-w-0">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20 shrink-0">
          <Compass size={20} strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight break-words flex-1">
          О путешествии
        </h2>
      </div>

      <div className="bg-slate-900/30 rounded-3xl border border-white/5 p-5 md:p-8 min-w-0 overflow-hidden">
        {htmlContent ? (
          <div 
            className="prose prose-invert prose-sm md:prose-base max-w-none break-words
                       prose-p:text-slate-300 prose-p:leading-relaxed
                       prose-a:text-teal-400 hover:prose-a:text-teal-300
                       prose-strong:text-white prose-strong:font-bold
                       prose-ul:text-slate-300 prose-ol:text-slate-300"
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        ) : (
          <p className="italic text-slate-400 text-sm">Описание готовится...</p>
        )}
      </div>

    </section>
  );
}