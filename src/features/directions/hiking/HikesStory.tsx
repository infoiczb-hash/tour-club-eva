import { Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function HikesStory() {
  return (
    <section className="py-8 md:py-16 bg-stone-950 text-stone-100 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
            
            {/* ТЕКСТОВАЯ ЧАСТЬ */}
            <div className="flex flex-col text-left animate-in fade-in slide-in-from-left-8 duration-1000 fill-mode-both">
                <div className="text-[12px] font-bold tracking-[0.2em] text-teal-500 uppercase mb-4 md:mb-6">
                    Из дневника гида
                </div>

                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter mb-6">
                    "Там, где не ловит связь, <br className="hidden md:block"/>
                    появляется <span className="text-teal-500">коннект с собой</span>"
                </h2>

                <p className="text-[14px] md:text-lg font-medium leading-relaxed text-stone-400 mb-6 md:mb-8 max-w-lg">
                    Горячий чай, звенящая тишина и осознание того, что все городские дедлайны остались где-то далеко внизу.
                </p>

                <div className="w-full h-px bg-gradient-to-r from-stone-800 to-transparent mb-5" />

                <div className="flex flex-wrap gap-3">
                  {[
                    "Масштаб гор, захватывающий дух",
                    "Погружение в другую культуру и быт",
                    "Настоящий детокс: отключение от забот",
                    "Другой климат",
                    "Новые знакомства",
                    "Ментальная перезагрузка"
                  ].map((feature, idx) => (
                    <span 
                      key={idx} 
                      className="px-4 py-2.5 bg-white/5 border border-white/10 hover:border-teal-500/40 text-slate-300 hover:text-teal-400 text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl flex items-center gap-2.5 transition-all shadow-sm cursor-default group"
                    >
                      <Sparkles 
                        size={16} 
                        className="text-teal-500/70 group-hover:text-teal-400 transition-colors" 
                      /> 
                      {feature}
                    </span>
                  ))}
                </div>
            </div>

            {/* ВИЗУАЛЬНАЯ ЧАСТЬ */}
            <div className="relative aspect-square md:aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl group border border-white/5 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 fill-mode-both">
                <Image 
                    src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771838659/4_tvn5t8.jpg" 
                    alt="Атмосфера экспедиций" 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent pointer-events-none transition-opacity duration-500 group-hover:opacity-50" />
            </div>

        </div>
      </div>
    </section>
  );
}