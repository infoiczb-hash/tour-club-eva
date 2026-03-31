import Image from "next/image";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const fleet = [
  { title: "Таймень-2", desc: "Быстрая и маневренная классика. Идеальна для двоих.", tag: "2 места", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771580265/taimen-2_qgiitc.webp" },
  { title: "Таймень-3", desc: "Устойчивая и вместительная. Отличный выбор для семьи с ребенком.", tag: "3 места +1 реб.", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771580025/taimen-3_lqhcoc.webp" },
  { title: "Виктория", desc: "Максимум комфорта, открытый борт и огромная грузоподъемность.", tag: "3 места +1 реб.", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771580108/victoria-3_kdsob5.webp" },
];

export default function Fleet() {
  return (
    <section className="pt-12 md:pt-20 pb-10 bg-[#020617] relative overflow-hidden text-slate-200 border-t border-white/5">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4">
              <ShieldCheck size={14} className="text-teal-400" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">Инвентарь</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              Наш <span className="text-teal-500">Флот</span>
            </h2>
          </div>
          <p className="text-slate-300 text-sm md:text-base max-w-sm font-medium animate-in fade-in duration-700">
            Проверенные временем и сотнями километров байдарки. Каждая лодка проходит регулярное ТО.
          </p>
        </div>

        <div className="relative mt-6 md:mt-8">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-6 pt-4 md:pt-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-8 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {fleet.map((boat, i) => (
              <div
                key={i}
                className="group relative flex-shrink-0 snap-center w-[85vw] md:w-auto bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 flex flex-col items-center text-center overflow-hidden transition-all duration-500 hover:border-teal-500/30 hover:bg-slate-900/60 shadow-xl hover:shadow-2xl h-full animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-teal-500/0 blur-[80px] rounded-full transition-all duration-500 group-hover:bg-teal-500/20 pointer-events-none" />

                <div className="relative w-full h-32 md:h-40 mb-6 flex items-center justify-center z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105">
                  <Image
                    src={boat.image}
                    alt={boat.title}
                    fill
                    className="object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
                    sizes="(max-width: 640px) 85vw, 33vw"
                    // FIX: lazy — флот ниже fold
                    loading="lazy"
                    // FIX: object-contain на тёмном фоне — quality 65 достаточно
                    quality={65}
                  />
                </div>

                <span className="inline-block mb-4 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] md:text-xs font-black uppercase text-teal-400 tracking-widest relative z-10">
                  {boat.tag}
                </span>

                <h3 className="font-black text-2xl md:text-3xl text-white uppercase tracking-tight mb-3 relative z-10 transition-colors">
                  {boat.title}
                </h3>

                <p className="text-[13px] md:text-sm text-slate-400 font-medium leading-relaxed relative z-10 px-2 mt-auto">
                  {boat.desc}
                </p>
              </div>
            ))}
          </div>
          
          <div className="md:hidden flex items-center justify-end gap-1.5 mt-2 pr-4 text-slate-400 pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-widest">Мотай</span>
            <ChevronRight size={14} className="text-teal-400 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}