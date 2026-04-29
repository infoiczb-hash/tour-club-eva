import React from 'react';
import Image from 'next/image';
import { DirectionData, THEMES } from '@/data/directionsData';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DirectionShowcaseProps {
  data: DirectionData;
}

export default function DirectionShowcase({ data }: DirectionShowcaseProps) {
  const theme = THEMES[data.theme];
  const hasFleet = data.fleet && data.fleet.length > 0;
  const hasGallery = data.gallery && data.gallery.length > 0;

  // Если нет ни флота, ни галереи — компонент просто исчезает, не ломая верстку
  if (!hasFleet && !hasGallery) return null;

  return (
    <section className="relative py-20 md:py-32 bg-[#0b1016] overflow-hidden border-t border-white/5">
      
      {/* CSS-анимация левитации (замена Framer Motion) */}
      <style>{`
        @keyframes float-item {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float-item 4s ease-in-out infinite;
        }
      `}</style>

      {/* ==========================================
          1. БЛОК АРСЕНАЛА / ФЛОТА (Apple-style)
      ========================================== */}
      {hasFleet && (
        <div className="container mx-auto px-4 sm:px-6 mb-24 md:mb-32">
            
            <div className="text-center mb-16 md:mb-20">
                <h2 
                    className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                >
                    <span className="w-2 h-2 rounded-full shadow-[0_0_15px_currentColor]" style={{ backgroundColor: theme.hex, color: theme.hex }} />
                    Ваш Арсенал
                    <span className="w-2 h-2 rounded-full shadow-[0_0_15px_currentColor]" style={{ backgroundColor: theme.hex, color: theme.hex }} />
                </h2>
                <p 
                    className="text-slate-300 font-medium max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both [animation-delay:100ms]"
                >
                    Мы используем только надежное, проверенное оборудование, чтобы вы чувствовали себя уверенно.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-auto-fit gap-8 lg:gap-12 justify-center max-w-5xl mx-auto">
                {data.fleet!.map((item, idx) => (
                    <div 
                        key={idx}
                        className="relative flex flex-col items-center group animate-in fade-in zoom-in-95 duration-700 fill-mode-both"
                        style={{ animationDelay: `${idx * 200}ms` }}
                    >
                        {/* Магическое свечение позади лодки */}
                        <div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"
                            style={{ backgroundColor: theme.hex }}
                        />

                        {/* Сама лодка (Парящая анимация на чистом CSS) */}
                   <div 
                            className="relative w-full max-w-[300px] h-[120px] sm:h-[150px] mb-8 drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_30px_30px_rgba(0,0,0,0.7)] transition-all duration-500 z-10 animate-float"
                            style={{ animationDelay: `${idx * 500}ms` }} // рассинхрон левитации
                        >
                            <Image 
                                src={item.image} 
                                alt={item.name} 
                                fill 
                                className="object-contain"
                                // ✅ Карточка имеет жесткий max-w-[300px], больше скачивать нет смысла
                                sizes="(max-width: 640px) 90vw, 300px"
                            />
                        </div>

                        {/* Стеклянный "Постамент" с текстом */}
                        <div className="w-full text-center p-6 rounded-3xl bg-gradient-to-t from-white/[0.02] to-transparent border-t border-white/5 pt-8 relative -mt-12 z-0">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 transition-colors" style={{ color: theme.hex }}>
                                {item.name}
                            </h3>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* ==========================================
          2. БЛОК ЭМОЦИЙ / ГАЛЕРЕЯ (Тактильный скролл)
      ========================================== */}
      {hasGallery && (
        <div className="w-full">
            <div className="container mx-auto px-4 sm:px-6 mb-8 md:mb-12 flex items-end justify-between">
                <div>
                    <h2 
                        className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-both"
                    >
                        Живые <span style={{ color: theme.hex }}>Эмоции</span>
                    </h2>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300 animate-in fade-in duration-700 fill-mode-both">
                    <span className="w-8 h-px bg-slate-700" />
                    Листайте
                    <span className="w-8 h-px bg-slate-700" />
                </div>
            </div>

            {/* Горизонтальная лента фотографий */}
            <div 
                className="flex gap-4 sm:gap-6 overflow-x-auto pb-12 px-4 sm:px-6 hide-scrollbar snap-x snap-mandatory animate-in fade-in duration-1000 fill-mode-both"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {data.gallery!.map((url, idx) => (
                    <div 
                        key={idx}
                        className={cn(
                            "relative flex-none snap-center rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-slate-900 transition-transform duration-500 hover:scale-[0.98] cursor-pointer",
                            // Чередуем ширину для асимметрии (Senior UI)
                            idx % 3 === 0 ? "w-[300px] sm:w-[500px] aspect-[4/3] sm:aspect-[16/9]" : "w-[260px] sm:w-[350px] aspect-[3/4]"
                        )}
                    >
                      <Image 
                            src={url} 
                            alt={`Эмоция ${idx + 1}`} 
                            fill 
                            className="object-cover transition-transform duration-1000 hover:scale-110"
                            // ✅ У карточек жесткая ширина 260-500px, ограничиваем аппетиты браузера
                            sizes="(max-width: 640px) 300px, (max-width: 1024px) 400px, 500px"
                            loading="lazy"
                        />
                        {/* Легкий градиент для глубины */}
                        <div className="absolute inset-0 bg-slate-950/10 hover:bg-transparent transition-colors duration-500 pointer-events-none" />
                    </div>
                ))}
            </div>
        </div>
      )}

    </section>
  );
}