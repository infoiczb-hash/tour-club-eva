import { Compass, Coffee, ShieldCheck } from 'lucide-react';

export default function HikesHero() {
  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden bg-stone-950 pt-28 pb-16 md:pt-0 md:pb-0">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-800/20 md:blur-[120px] rounded-full pointer-events-none" />

      <div
        className="relative z-10 container mx-auto px-4 text-center flex flex-col items-center justify-center transition-opacity duration-500"
      >
     <div className="animate-hero-subtitle inline-block px-4 md:px-5 py-2 mb-8 text-[10px] md:text-sm font-bold tracking-widest text-teal-200 border border-teal-800/50 rounded-full backdrop-blur-md uppercase bg-teal-950/30">
          Туры по горам Румынии и не только.
        </div>

        <div className="animate-hero-title mb-6 md:mb-8 w-full">
          <h1 className="text-[11vw] sm:text-5xl md:text-7xl lg:text-8xl font-black text-stone-100 leading-[1.1] md:leading-tight mb-2 md:mb-4 tracking-tighter mx-auto">
            ВДОХНОВЛЯЙСЯ <br /> ГОРАМИ.
          </h1>
          <div className="text-[7.5vw] sm:text-4xl md:text-6xl lg:text-7xl font-black text-teal-500 leading-tight tracking-tighter">
            НЕ ПОКОРЯЙ ИХ.
          </div>
        </div>

        <p className="animate-hero-subtitle text-[14px] md:text-xl text-stone-400 mb-10 md:mb-12 max-w-2xl mx-auto font-medium leading-relaxed px-2">
          Оставь городскую суету позади. Открой для себя настоящую Румынию: неспешный треккинг налегке, горячий чай с видом на долины и люди, с которыми всегда по пути.
        </p>

        <div className="animate-hero-subtitle w-full">
          <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-3 md:gap-12 text-stone-300">
            <div className="flex items-center gap-3 bg-stone-900/50 md:bg-transparent px-5 py-3 md:p-0 rounded-2xl border border-stone-800 md:border-none w-full max-w-[280px] md:w-auto justify-center">
              <Compass className="w-5 h-5 md:w-6 md:h-6 text-teal-500 shrink-0" />
              <span className="text-[12px] md:text-sm font-bold uppercase tracking-wider">Связь с природой</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-stone-800" />
            <div className="flex items-center gap-3 bg-stone-900/50 md:bg-transparent px-5 py-3 md:p-0 rounded-2xl border border-stone-800 md:border-none w-full max-w-[280px] md:w-auto justify-center">
              <Coffee className="w-5 h-5 md:w-6 md:h-6 text-teal-500 shrink-0" />
              <span className="text-[12px] md:text-sm font-bold uppercase tracking-wider">Уютные вечера</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-stone-800" />
            <div className="flex items-center gap-3 bg-stone-900/50 md:bg-transparent px-5 py-3 md:p-0 rounded-2xl border border-stone-800 md:border-none w-full max-w-[280px] md:w-auto justify-center">
              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-teal-500 shrink-0" />
              <span className="text-[12px] md:text-sm font-bold uppercase tracking-wider">Налегке и с рюкзаками</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}