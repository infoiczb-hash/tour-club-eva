import { Leaf, Coffee, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const RESULTS: {
    icon: LucideIcon;
    title: string;
    desc: string;
    color: string;
    bg: string;
    border: string;
    hover: string;
}[] = [
    {
        icon: Leaf,
        title: "Свобода",
        desc: "Мы не бегаем за гидом. Мы гуляем по кромке Днестра, смотрим на парапланы, пинаем осенние листья, ищем грибы и ловим лучшие закаты.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        hover: "group-hover:bg-emerald-500 group-hover:border-emerald-400"
    },
    {
        icon: Coffee,
        title: "Атмосфера",
        desc: "Фирменный чай «Бабаха» на шишках, вкуснейшая походная каша на огне и душевные разговоры, которых так не хватает в суете города.",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        hover: "group-hover:bg-amber-500 group-hover:border-amber-400"
    },
    {
        icon: Wind,
        title: "Замедление",
        desc: "Гамаки в сосновом бору, шелест деревьев и полная тишина. Возможность задремать, почитать книгу или просто смотреть в бескрайнее небо.",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        hover: "group-hover:bg-blue-500 group-hover:border-blue-400"
    }
];

export default function LocalPhilosophy() {
    return (
        <section className="py-8 md:py-14 relative bg-slate-950 border-t border-white/5 overflow-hidden">
            
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-900/10 md:blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* ВВОДНЫЙ МАНИФЕСТ */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both mb-12 md:mb-20 max-w-4xl text-left">
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter mb-6 md:mb-8 leading-none">
                        Красота Без билета <br className="hidden md:block"/><span className="text-emerald-500">— на самолёт</span>
                    </h2>
                    
                    <div className="border-l-4 border-emerald-500 pl-5 md:pl-8 py-2">
                        <p className="text-[16px] md:text-2xl font-medium text-slate-400 leading-snug tracking-tight">
                            Мы привыкли искать красоту за <span className="text-white font-bold">сотни километров</span>. Но настоящая красота не требует билета на самолет. Нужно лишь <span className="text-white font-bold">правильное настроение</span>.
                        </p>
                    </div>
                </div>

                {/* ПОДВОДКА К КАРТОЧКАМ */}
                <div className="animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both text-left mb-6 md:mb-8">
                    <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                        И тогда <span className="text-emerald-500">случается</span>
                    </h3>
                </div>
                
                {/* КАРТОЧКИ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {RESULTS.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div 
                                key={idx}
                                className="bg-slate-900/40 backdrop-blur-sm border border-white/5 p-6 md:p-8 rounded-[2rem] hover:bg-slate-900/80 transition-colors flex flex-row gap-4 md:gap-5 items-start group shadow-lg"
                            >
                                <div className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-colors duration-300 ${item.bg} ${item.border} ${item.hover}`}>
                                    <Icon 
                                        size={24} 
                                        strokeWidth={1.5} 
                                        className={`transition-colors ${item.color} group-hover:text-slate-900`}
                                    />
                                </div>
                                
                                <div>
                                    <h4 className="text-lg md:text-xl font-bold text-white mb-2 tracking-tight group-hover:text-emerald-400 transition-colors">
                                        {item.title}
                                    </h4>
                                    <p className="text-[14px] md:text-[15px] text-slate-400 leading-relaxed font-medium">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}