import { Compass, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LocalHero() {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      
      {/* Фон (без JS-параллакса, чистый и легкий SSR) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665911/1_suclsq.jpg" 
          alt="Природа Приднестровья"
          fill
          className="object-cover opacity-50"
          priority
          fetchPriority="high" 
          // FIX 1: Снизили quality с 60 → уже было, но добавляем точные sizes
          quality={60}
          // FIX 2: Точные sizes — браузер выберет нужный брейкпоинт из deviceSizes
          sizes="(max-width: 768px) 100vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center mt-12">
        <div className="flex flex-col items-center">
          
         <div className="animate-hero-subtitle inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/30 border border-emerald-500/20 backdrop-blur-md rounded-full mb-8">
            <Compass className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold tracking-[0.2em] text-emerald-400 uppercase">
              Локальные Маршруты
            </span>
          </div>

          {/* Заголовок - МГНОВЕННЫЙ РЕНДЕР БЕЗ DELAY */}
          <h1 className="animate-hero-title text-5xl md:text-7xl lg:text-9xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
            ТИШИНА <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
              РЯДОМ
            </span>
          </h1>

          <p className="animate-hero-subtitle text-lg md:text-2xl text-stone-300 font-light max-w-2xl mx-auto leading-relaxed mb-10">
            Самые важные путешествия начинаются за порогом. <br className="hidden md:block"/>
            Вдох, выдох — и мы уезжаем в глубины природы и себя.
          </p>

          <div className="animate-hero-subtitle">
            <Link 
              href="#schedule"
              className="group px-4 py-4 bg-emerald-500 text-slate-950 font-black uppercase tracking-wider text-sm rounded-2xl hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] flex items-center gap-3"
            >
              <span>Выбрать маршрут</span>
              <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}