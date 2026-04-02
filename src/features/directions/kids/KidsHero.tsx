import { Flame, Compass } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function KidsHero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pb-12">
      
      {/* ФОН: Темный и атмосферный */}
      <div className="absolute inset-0 z-0">
       <Image 
          src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771662349/kids-bg_don8xd.webp"
          alt="Дети у костра"
          fill
          className="object-cover opacity-40 md:opacity-50"
          priority
          fetchPriority="high"
          // FIX 1: Снизили quality с 75 до 60 — достаточно для фона, экономия ~20% веса
          quality={60}
          // FIX 2: Точные sizes — не грузим 1920px на мобайл
          sizes="(max-width: 768px) 100vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center mt-20 md:mt-0">
        <div className="flex flex-col items-center">
          
         {/* Бейдж */}
          <div className="animate-hero-subtitle inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md rounded-full mb-8">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-[12px] md:text-xs font-bold tracking-widest text-amber-400 uppercase">
              Детское направление
            </span>
          </div>

          {/* Заголовок - МГНОВЕННЫЙ РЕНДЕР БЕЗ DELAY */}
          <h1 className="animate-hero-title text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tighter">
            ВМЕСТО ЭКРАНА <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              КОСТЁР
            </span>
          </h1>

          {/* Описание */}
          <p className="animate-hero-subtitle text-base md:text-xl text-slate-300 mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
            Мы возвращаем детям детство, а подросткам даём приключения, которыми гордишься.
          </p>

          {/* Кнопка превращена в якорную ссылку */}
          <div className="animate-hero-subtitle">
            <Link 
              href="#formats"
              className="group px-8 py-4 bg-amber-500 text-slate-950 font-black uppercase tracking-wider text-sm rounded-2xl hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(245,158,11,0.3)] flex items-center gap-3 mx-auto"
            >
              <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
              <span>Выбрать формат</span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}