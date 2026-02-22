'use client';

import { motion } from 'framer-motion';
import { Shield, LifeBuoy, Navigation } from 'lucide-react';

const SAFETY_GUARANTEES = [
    {
        icon: LifeBuoy,
        title: "Проверенное снаряжение",
        desc: "Широкие Touring-доски (80+ см), которые прощают ошибки новичков. Обязательные сертифицированные спасжилеты для всех участников, включая детей."
    },
    {
        icon: Shield,
        title: "Инструктаж и подготовка",
        desc: "Никто не выходит на воду без базовых знаний. За 15 минут на берегу мы научим вас правильно стоять, держать весло, тормозить и разворачиваться."
    },
    {
        icon: Navigation,
        title: "Сопровождение гидом",
        desc: "Наши гиды всегда находятся на воде вместе с группой. Они контролируют маршрут, помогают отстающим и обеспечивают полное спокойствие."
    }
];

export default function SupSafety() {
    return (
        <section className="py-12 md:py-20 bg-[#020617] relative overflow-hidden border-t border-white/5">
            
            {/* Фоновые декорации для глубины */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-900/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />
            
            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                 
                 {/* ЗАГОЛОВОК (Используем маркетинговый текст) */}
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center text-center mb-12 md:mb-16"
                 >
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-950/30 backdrop-blur-md mb-6">
                         <Shield className="text-blue-400" size={14} strokeWidth={2} />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                             Гарантия безопасности
                         </span>
                     </div>
                     <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                        На воде <span className="text-blue-500">как дома</span>
                     </h2>
                     <p className="text-slate-400 mt-2 max-w-2xl text-sm md:text-base font-medium leading-relaxed">
                        Ваша единственная задача — расслабиться и получать удовольствие. Все риски, организацию и контроль мы берем на себя.
                     </p>
                 </motion.div>

                 {/* КАРТОЧКИ */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                     {SAFETY_GUARANTEES.map((item, idx) => {
                         const Icon = item.icon;
                         return (
                             <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.15, duration: 0.5 }}
                                className="bg-slate-900/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all duration-500 text-center group flex flex-col items-center relative overflow-hidden"
                             >
                                 {/* Внутреннее свечение при наведении */}
                                 <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                 <div className="relative w-16 h-16 mb-6">
                                     <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md group-hover:blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                                     <div className="relative w-full h-full bg-slate-900 rounded-full flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 transition-colors duration-500 z-10 shadow-lg">
                                         <Icon className="text-slate-400 group-hover:text-blue-400 transition-colors duration-300" size={28} strokeWidth={1.5} />
                                     </div>
                                 </div>
                                 
                                 <h4 className="text-lg md:text-xl font-black text-white mb-3 tracking-tight group-hover:text-blue-300 transition-colors">
                                     {item.title}
                                 </h4>
                                 <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                     {item.desc}
                                 </p>
                             </motion.div>
                         );
                     })}
                 </div>

            </div>
        </section>
    );
}