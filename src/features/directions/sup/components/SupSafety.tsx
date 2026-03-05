'use client';

import { motion } from 'framer-motion';
import { Shield, LifeBuoy, Navigation, ChevronRight } from 'lucide-react'; // 🔥 Добавили ChevronRight

const SAFETY_GUARANTEES = [
    {
        icon: LifeBuoy,
        title: "Проверенное снаряжение",
        desc: "Широкие доски (78+ см), которые прощают ошибки новичков. Обязательные сертифицированные спасжилеты для всех участников, включая детей."
    },
    {
        icon: Shield,
        title: "Инструктаж и подготовка",
        desc: "Никто не выходит на воду без базовых знаний. За 15 минут на берегу мы научим вас правильно стоять, держать весло, тормозить и разворачиваться."
    },
    {
        icon: Navigation,
        title: "Сопровождение гидом",
        desc: "Наши инструктора всегда рядом на берегу или на воде (зависит от формата). Они контролируют маршрут, помогают освоить SUP-доску и в целом обеспечивают полное спокойствие."
    }
];

export default function SupSafety() {
    return (
        // 🔥 1. Уменьшили отступы (было py-12 md:py-20, стало py-8 md:py-16)
        <section className="py-8 md:py-14 bg-[#020617] relative overflow-hidden border-t border-white/5">
            
            {/* Фоновые декорации для глубины */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-900/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />
            
            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                 
                 {/* 🔥 ЗАГОЛОВОК: Строгое выравнивание по левому краю */}
                 <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="text-left mb-8 md:mb-12 max-w-3xl"
                 >
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-950/30 backdrop-blur-md mb-4 md:mb-6">
                         <Shield className="text-blue-400" size={14} strokeWidth={2} />
                         {/* Текст бейджа увеличен до 14px */}
                         <span className="text-[14px] font-bold uppercase tracking-widest text-blue-400">
                             Гарантия безопасности
                         </span>
                     </div>
                     <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                        На воде <br className="hidden md:block"/><span className="text-blue-500">как дома</span>
                     </h2>
                     {/* Описание увеличено до 14px */}
                     <p className="text-slate-400 mt-2 text-[14px] md:text-base font-medium leading-relaxed">
                        Ваша единственная задача — расслабиться и получать удовольствие. Все риски, организацию и контроль мы берем на себя.
                     </p>
                 </motion.div>

                 {/* 🔥 3. ОБЕРТКА ДЛЯ ГОРИЗОНТАЛЬНОГО СКРОЛЛА */}
                 <div className="relative">
                     <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                         {SAFETY_GUARANTEES.map((item, idx) => {
                             const Icon = item.icon;
                             return (
                                 <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    // 🔥 2. Схлопнули карточку: flex-row, выравнивание влево, ширина 85vw
                                    className="group shrink-0 snap-center w-[85vw] md:w-auto bg-slate-900/40 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all duration-500 text-left flex flex-row items-start relative overflow-hidden"
                                 >
                                     <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                     {/* Квадратная иконка слева */}
                                     <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 mr-4 md:mr-5">
                                         <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md group-hover:blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                                         <div className="relative w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 group-hover:bg-blue-500 transition-colors duration-500 z-10 shadow-lg text-slate-400 group-hover:text-slate-900">
                                             <Icon size={24} strokeWidth={1.5} className="transition-colors duration-300" />
                                         </div>
                                     </div>
                                     
                                     <div>
                                         <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-blue-300 transition-colors leading-tight">
                                             {item.title}
                                         </h3>
                                         {/* 🔥 Текст описания строго 14px */}
                                         <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
                                             {item.desc}
                                         </p>
                                     </div>
                                 </motion.div>
                             );
                         })}
                     </div>

                     {/* 🔥 4. Синяя пульсирующая подсказка "Мотай" */}
                     <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
                         <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                         <ChevronRight size={14} />
                     </div>
                 </div>

            </div>
        </section>
    );
}