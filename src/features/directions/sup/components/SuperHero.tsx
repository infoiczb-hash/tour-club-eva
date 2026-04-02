import Link from "next/link";
import { Waves, Map } from "lucide-react";
import ParallaxBg from "./ParallaxBg";

export default function SupHero() {
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center">

      {/* ФОН С ПАРАЛЛАКСОМ (Единственный клиентский компонент здесь) */}
      <ParallaxBg />

      {/* КОНТЕНТ (Теперь 100% Server Component) */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 mt-16 max-w-5xl mx-auto w-full">
        
        <div className="animate-hero-subtitle inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md shadow-lg">
          <Waves size={16} className="text-teal-400" />
          <span className="text-xs font-black uppercase tracking-widest text-teal-300">
            SUP-Бординг в Приднестровье
          </span>
        </div>

        <h1 className="animate-hero-title text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.85] drop-shadow-2xl">
          СКОЛЬЗИ <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">ПО ВОДЕ</span>
        </h1>

        <p className="animate-hero-subtitle text-base md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md">
          Ваше идеальное мини-путешествие. Никакого шума и спешки — только вы, доска и природа. Открываем знакомые места с совершенно нового ракурса.
        </p>

        <div className="animate-hero-subtitle flex flex-col sm:flex-row gap-4">
          <Link
            href="#catalog"
            className="px-8 py-4 rounded-xl bg-teal-500 text-slate-950 font-black uppercase tracking-widest text-sm hover:bg-teal-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center gap-2"
          >
            <Map size={18} /> Выбрать программу
          </Link>
        </div>
      </div>

      {/* SCROLL INDICATOR */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none animate-in fade-in duration-1000 delay-500">
        <span className="text-[12px] font-bold text-white/50 uppercase tracking-widest">Вниз</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
      </div>
    </section>
  );
}