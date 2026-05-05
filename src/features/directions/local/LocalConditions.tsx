import { Bus, Utensils, Users, HeartHandshake, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SwipeHint from '@/shared/ui/SwipeHint';   

const CONDITIONS: { icon: LucideIcon; title: string; desc: string }[] = [
    { 
        icon: HeartHandshake, 
        title: "Формат прогулок", 
        desc: "Полноценный день перезагрузки на природе без сложной подготовки, но не без приключений." 
    },
    { 
        icon: Bus, 
        title: "Трансфер сопровождения", 
        desc: "Забираем из Бендер, Тирасполя и других городов. Вам не нужно быть за рулем — мы берем дорогу на себя, возвращая вас домой к вечеру." 
    },
    { 
        icon: Utensils, 
        title: "Фирменная полевая кухня", 
        desc: "Если тур с питанием, то готовим полевую еду, делаем свежий салат и завариваем чай. Формат питания зависит от тура." 
    },
    { 
        icon: Users, 
        title: "Душевные компании", 
        desc: "Мы собираем группы, где каждому комфортно, тепло и интересно. Это идеальное место, чтобы завести новых друзей." 
    }
];

export default function LocalConditions() {
    return (
        <section className="py-8 md:py-16 bg-slate-950 relative overflow-hidden border-t border-white/5">
            
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-900/10 md:blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both text-left mb-8 md:mb-12 max-w-3xl">
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                        В Наших <span className="text-emerald-500">Форматах</span>
                    </h2>
                    <p className="text-[14px] md:text-base text-stone-400 font-medium leading-relaxed">
                        Минимум экскурсионных достопримечательностей и гида, как радио. Ваша единственная задача — наслаждаться моментом.
                    </p>
                </div>

                <div className="relative">
                     <div className="mb-3">
                           <SwipeHint /> </div>
                    <div className="grid grid-rows-2 md:grid-rows-none grid-flow-col md:grid-flow-row auto-cols-[85vw] md:auto-cols-auto md:grid-cols-2 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-10 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {CONDITIONS.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div 
                                    key={idx}
                                    className="snap-center bg-slate-900/40 backdrop-blur-sm border border-white/5 p-6 md:p-8 rounded-[2rem] hover:bg-slate-900 transition-colors flex flex-row items-start gap-4 md:gap-5 group shadow-lg h-full"
                                >
                                    <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-950 flex items-center justify-center border border-white/5 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-colors duration-300">
                                        <Icon size={24} strokeWidth={1.5} className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-white mb-2 tracking-tight group-hover:text-emerald-400 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-[14px] md:text-[15px] text-stone-400 leading-relaxed font-medium">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  </div>

            </div>
        </section>
    );
}