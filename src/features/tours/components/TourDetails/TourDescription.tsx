import React from 'react';
import { 
  CheckCircle2, AlertCircle, Sparkles, Map, Camera, Mountain, 
  Compass, Tent, Flame, Heart, Star, Coffee, Navigation 
} from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { SafeHTML } from '@/shared/ui/SafeHTML';

interface TourDescriptionProps {
  tour: Tour;
}

// Вспомогательная функция для рендера динамических иконок из БД
const renderIcon = (iconName?: string) => {
  const iconProps = { className: "text-teal-500", size: 24, strokeWidth: 1.5 };
  
  if (!iconName) return <CheckCircle2 {...iconProps} />;
  
  switch (iconName.toLowerCase()) {
    case 'map': return <Map {...iconProps} />;
    case 'camera': return <Camera {...iconProps} />;
    case 'mountain': return <Mountain {...iconProps} />;
    case 'compass': return <Compass {...iconProps} />;
    case 'tent': return <Tent {...iconProps} />;
    case 'flame': return <Flame {...iconProps} />;
    case 'heart': return <Heart {...iconProps} />;
    case 'star': return <Star {...iconProps} />;
    case 'coffee': return <Coffee {...iconProps} />;
    case 'sparkles': return <Sparkles {...iconProps} />;
    case 'navigation': return <Navigation {...iconProps} />;
    default: return <CheckCircle2 {...iconProps} />;
  }
};

export default function TourDescription({ tour }: TourDescriptionProps) {
  if (!tour.description && (!tour.highlights || tour.highlights.length === 0) && !tour.importantInfo) {
    return null;
  }

  return (
    //   ИСПРАВЛЕНИЕ: Убрали mb-12 и сделали секцию flex-контейнером с идеальным gap.
    // Теперь блоки никогда не слипнутся, а снизу не будет лишней дыры.
<section className="scroll-mt-24 flex flex-col gap-10 md:gap-12" id="about">
      
      {/* ВАЖНАЯ ИНФОРМАЦИЯ (ФАЗА 1) */}
      {tour.importantInfo && (
        <div className="p-5 sm:p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-4 items-start animate-in fade-in shadow-lg">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={24} strokeWidth={2.5} />
          <div>
            <h4 className="text-rose-500 font-black uppercase tracking-widest text-sm mb-2">
              Важная информация
            </h4>
            <div className="text-rose-100/90 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
              {tour.importantInfo}
            </div>
          </div>
        </div>
      )}

      {/* ГЛАВНЫЕ ВПЕЧАТЛЕНИЯ */}
      {tour.highlights && tour.highlights.length > 0 && (
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 md:px-10 border border-white/5 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-8 md:mb-10 relative z-10 flex items-center gap-4">
            <Sparkles className="text-teal-500" size={32} strokeWidth={2} />
            Главные впечатления
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 relative z-10">
            {tour.highlights.map((item, idx) => (
              <div key={idx} className="flex gap-5 items-start group">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-teal-500/20 group-hover:border-teal-500/30 transition-all duration-300 border border-white/5 shadow-lg">
                  {renderIcon(item.icon)}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="font-black text-white text-lg md:text-xl mb-1.5 group-hover:text-teal-400 transition-colors leading-tight">
                    {item.title}
                  </div>
                  {(item.description || item.desc) && (
                    <div className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">
                      {item.description || item.desc}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

     {/* Описание тура */}
      {tour.description && (
        <div className="prose prose-invert prose-teal max-w-none px-2 md:px-0">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-6">
            О туре
          </h2>
          {/*   ЗАМЕНЯЕМ DANGEROUSLY SET INNER HTML НА SAFEHTML */}
          <SafeHTML 
            html={tour.description}
            className="text-slate-300 leading-relaxed text-base md:text-lg space-y-4"
          />
        </div>
      )}
    </section>
  );
}