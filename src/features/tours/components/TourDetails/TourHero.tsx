import React from 'react';
import Image from 'next/image';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { Tour } from '@/features/tours/types';

const TYPE_MAP: Record<string, string> = {
  hiking: 'Поход',
  water: 'Сплав',
  auto: 'Автотур',
  excursion: 'Экскурсия',
  kids: 'Детский',
  weekend: 'Выходного дня'
};

interface TourHeroProps {
  tour: Tour;
}

export default function TourHero({ tour }: TourHeroProps) {
  
  const renderDateRange = () => {
    if (!tour.date) return 'Дата уточняется';
    
    const startDate = new Date(tour.date);
    const ruDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
    const dayOnly = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' });

    if (!tour.endDate) return ruDate.format(startDate);

    const endDate = new Date(tour.endDate);
    if (startDate.getMonth() === endDate.getMonth()) {
       return `${dayOnly.format(startDate)} — ${ruDate.format(endDate)}`;
    }
    return `${ruDate.format(startDate)} — ${ruDate.format(endDate)}`;
  };

  const getDuration = () => {
    if (tour.duration) return tour.duration;
    if (tour.date && tour.endDate) {
      const start = new Date(tour.date).getTime();
      const end = new Date(tour.endDate).getTime();
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return `${days} дней`;
    }
    return '1 день';
  };

  // 👇 ИСПРАВЛЕНИЕ: Берем реальное название категории (fallback на старые данные)
  const normalizedType = tour.type ? tour.type.toLowerCase().trim() : '';
  const typeLabel = tour.category?.title || TYPE_MAP[normalizedType] || tour.type || 'Путешествие';

  return (
    <section className="relative h-[80vh] min-h-[550px] w-full flex items-end overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <Image
          src={tour.image || '/placeholder-tour.jpg'}
          alt={tour.title || "Тур"}
          fill
          className="object-cover opacity-60"
          priority
          fetchPriority="high"
          quality={85}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pb-4 md:pb-8 pt-32 flex flex-col justify-end h-full">
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4 md:space-y-6 max-w-5xl mt-10">
            <div className="flex flex-wrap gap-2 md:gap-3">
              
              <span className="px-3 py-1 rounded-md bg-teal-500 text-slate-900 text-[14px] md:text-xs font-black uppercase tracking-widest backdrop-blur-md">
                  {typeLabel}
              </span>

              {tour.label && (
                <span className="px-3 py-1 rounded-md bg-white/20 text-white border border-white/20 text-[14px] md:text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    {tour.label}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase leading-[1.1] tracking-tight drop-shadow-xl">
              {tour.title}
            </h1>
            
            {tour.subtitle && (
              <p className="text-sm md:text-lg text-slate-200 font-normal max-w-2xl leading-relaxed opacity-90">
                {tour.subtitle}
              </p>
            )}

            <div className="pt-6 md:pt-8 mt-4 border-t border-white/10">
                <div className="grid grid-cols-2 md:flex md:items-center gap-y-6 gap-x-8 md:gap-12 text-white">
                    
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div>
                            <p className="text-[12px] uppercase text-slate-400 font-bold tracking-widest mb-0.5">Локация</p>
                            <p className="font-bold text-sm md:text-base leading-none">{tour.location}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                            <Calendar size={16} />
                        </div>
                        <div>
                            <p className="text-[12px] uppercase text-slate-400 font-bold tracking-widest mb-0.5">Даты</p>
                            <p className="font-bold text-sm md:text-base leading-none capitalize">{renderDateRange()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                            <Clock size={16} />
                        </div>
                        <div>
                            <p className="text-[12px] uppercase text-slate-400 font-bold tracking-widest mb-0.5">Длительность</p>
                            <p className="font-bold text-sm md:text-base leading-none">{getDuration()}</p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
      </div>
    </section>
  );
}