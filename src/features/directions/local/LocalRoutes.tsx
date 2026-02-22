'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

// Вспомогательный компонент для карточки маршрута
function RouteCard({ title, subtitle, desc, img }: any) {
    return (
        <div className="group relative h-[450px] md:h-[500px] rounded-3xl overflow-hidden flex flex-col justify-end isolate border border-white/10 hover:border-emerald-500/30 transition-colors">
            <Image 
                src={img} 
                alt={title} 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                sizes="(max-width: 768px) 100vw, 33vw"
            />
            {/* Градиент для читаемости текста */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 p-6 md:p-8 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 block">
                    {subtitle}
                </span>
                <h3 className="text-2xl font-black text-white mb-4 leading-tight">
                    {title}
                </h3>
                <p className="text-stone-300 text-sm md:text-base leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {desc}
                </p>
                <div className="mt-6 w-10 h-1 bg-emerald-500 rounded-full" />
            </div>
        </div>
    );
}

export default function LocalRoutes() {
    return (
        <section className="py-12 md:py-20 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-white/5">
            <div className="container mx-auto px-4">
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Места <span className="text-emerald-500">Силы</span>
                    </h2>
                    <p className="text-stone-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                        Фирменные выезды ТурКлуба «ЭВА». Туда, где камни хранят тайны, а сосны шепчут о покое. Выбирайте направление по душе.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                        <RouteCard 
                            title="Северные Ущелья" 
                            subtitle="Строенцы и Рашков"
                            desc="Калагурские ущелья, Красная скала и башни ветров. Прогулка по тропам, где камни дышат. Идеально для тех, кто любит масштаб и панорамные виды."
                            img="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771666029/5_nmcfpa.jpg"
                        />
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                        <RouteCard 
                            title="Дубоссарское Море" 
                            subtitle="Маркауцы и Роги"
                            desc="Обзорные площадки водохранилища, прогулка по кромке воды, паромный баркас и гамаки в сосновом бору. День полного отключения от суеты."
                            img="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665919/2_hjcjd8.jpg"
                        />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                        <RouteCard 
                            title="Школьные Выезды" 
                            subtitle="Для классов и групп"
                            desc="Компактные туры в лес для детей от 15 человек на каникулах или выходных. Командообразование, природа и настоящие эмоции вместо экранов."
                            img="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771665925/3_evqllj.jpg"
                        />
                    </motion.div>
                </div>

            </div>
        </section>
    );
}