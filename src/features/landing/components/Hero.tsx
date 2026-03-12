import Image from 'next/image';
import HeroScrollButton from './HeroScrollButton';

export interface HeroContent {
  title: string;
  subtitle: string;
  tagline: string;
  bg_image: string;
}

const DEFAULT_HERO: HeroContent = {
  title: 'ЭВА',
  subtitle: 'Приключения каждые выходные',
  tagline: 'ОПЫТ — КОТОРЫЙ ВДОХНОВЛЯЕТ',
  bg_image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_60/v1771673823/hero-bg_cz1j25.webp'
};

export default function HeroSection({ content = DEFAULT_HERO }: { content?: HeroContent }) {
  return (
    <section className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-slate-950">

      {/* БГ */}
      <div className="absolute inset-0 z-0">
        <Image
          src={content.bg_image}
          alt="Турклуб Эва"
          fill
          className="object-cover object-center"
          priority
          fetchPriority="high"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.5)_100%)]" />
        <div className="absolute inset-0 bg-[url('/noise.webp')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
      </div>

      {/* ТЕКСТ */}
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center mt-[-10vh]">

        {/* Девиз */}
        <div className="flex items-center gap-4 mb-6 animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:both]">
          <div className="h-[1px] w-8 md:w-16 bg-teal-400/50" />
          <span className="text-base md:text-lg font-bold tracking-[0.2em] text-teal-300 uppercase drop-shadow-md">
            {content.tagline}
          </span>
          <div className="h-[1px] w-8 md:w-16 bg-teal-400/50" />
        </div>

        {/* Заголовок */}
        <h1 className="relative flex flex-col items-center leading-none text-center">
          <span className="text-6xl sm:text-7xl md:text-8xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-xl block animate-in fade-in slide-in-from-bottom-8 duration-700 [animation-fill-mode:both]">
            Турклуб
          </span>
          <span className="text-[35vw] sm:text-[12rem] md:text-[16rem] font-black text-white uppercase tracking-tighter select-none drop-shadow-2xl leading-[0.85] block animate-in fade-in zoom-in-95 duration-1000 [animation-delay:150ms] [animation-fill-mode:both]">
            {content.title}
          </span>
        </h1>

        {/* Подзаголовок */}
        <p className="text-xl md:text-3xl text-slate-100 font-medium tracking-wide mt-8 md:mt-10 max-w-2xl leading-relaxed drop-shadow-lg animate-fade-in-up [animation-delay:600ms] [animation-fill-mode:both]">
          {content.subtitle}
        </p>
      </div>

      {/* КНОПКА */}
      <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 z-20 flex justify-center animate-fade-in-up [animation-delay:1200ms] [animation-fill-mode:both]">
        <HeroScrollButton />
      </div>
    </section>
  );
}