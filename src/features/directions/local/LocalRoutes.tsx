import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

const ROUTES = [
    {
        title: "Северные Ущелья", 
        subtitle: "Строенцы и Рашков",
        desc: "Калагурские ущелья, Красная скала и башни ветров. Прогулка по тропам, где камни дышат. Идеально для тех, кто любит масштаб и панорамные виды.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_60/v1771666029/5_nmcfpa.jpg"
    },
    {
        title: "Дубоссарское Море", 
        subtitle: "Маркауцы и Роги",
        desc: "Обзорные площадки водохранилища, прогулка по кромке воды, паромный баркас и гамаки в сосновом бору. День полного отключения от суеты.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_60/v1771665919/2_hjcjd8.jpg"
    },
    {
        title: "Школьные Выезды", 
        subtitle: "Для классов и групп",
        desc: "Компактные туры в лес для детей от 15 человек на каникулах или выходных. Командообразование, природа и настоящие эмоции вместо экранов.",
        img: "https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_60/v1771665925/3_evqllj.jpg"
    }
];

export default function LocalRoutes() {
    return (
        <section className="py-8 md:py-16 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-white/5 relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both text-left mb-8 md:mb-12 max-w-3xl">
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                        Направления <br className="hidden md:block"/><span className="text-emerald-500">Локальных программ</span>
                    </h2>
                    <p className="text-[14px] md:text-base text-stone-400 font-medium leading-relaxed">
                        Фирменные выезды ТурКлуба «ЭВА». Туда, где камни хранят тайны, а сосны шепчут о покое. Выбирайте направление по душе.
                    </p>
                </div>

                <div className="relative">
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {ROUTES.map((route, idx) => (
                            <div 
                                key={idx}
                                className="group shrink-0 snap-center w-[85vw] md:w-auto relative h-[420px] md:h-[500px] rounded-[2rem] overflow-hidden flex flex-col justify-end isolate border border-white/10 hover:border-emerald-500/30 hover:-translate-y-2 transition-all duration-300 shadow-xl"
                            >
                                <Image 
                                    src={route.img} 
                                    alt={route.title} 
                                    fill 
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                                />
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent opacity-90" />
                                
                                <div className="relative z-10 p-6 md:p-8">
                                    <span className="text-emerald-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 block">
                                        {route.subtitle}
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-black text-white mb-3 leading-tight">
                                        {route.title}
                                    </h3>
                                    <p className="text-[14px] text-stone-300 leading-relaxed font-medium">
                                        {route.desc}
                                    </p>
                                    <div className="mt-5 w-10 h-1 bg-emerald-500 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
                        <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                        <ChevronRight size={14} />
                    </div>
                </div>

            </div>
        </section>
    );
}