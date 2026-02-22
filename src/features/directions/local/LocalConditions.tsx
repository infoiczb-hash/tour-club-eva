'use client';

import { motion } from 'framer-motion';
import { Bus, Utensils, Users, HeartHandshake } from 'lucide-react';

// Вспомогательный компонент для карточки
function InfoCard({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex items-start gap-2 p-6 md:p-8 bg-slate-900/40 border border-white/5 rounded-3xl hover:bg-slate-900 transition-colors group">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center border border-white/5 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-colors">
                <Icon size={24} className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div>
                <h4 className="text-white font-bold text-lg mb-2">{title}</h4>
                <p className="text-stone-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

export default function LocalConditions() {
    return (
        <section className="py-24 bg-slate-950">
            <div className="container mx-auto px-4 max-w-5xl">
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
                        Всё продумано до <span className="text-emerald-500">Мелочей</span>
                    </h2>
                    <p className="text-stone-400 text-base max-w-2xl mx-auto">
                        Вам не нужно ломать голову над логистикой или перекусами. Ваша единственная задача — наслаждаться моментом.
                    </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                        <InfoCard 
                            icon={HeartHandshake} 
                            title="Доступный формат" 
                            desc="Полноценный день перезагрузки на природе без сложной подготовки. Подходит для любого уровня физической активности."
                        />
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                        <InfoCard 
                            icon={Bus} 
                            title="Комфортный трансфер" 
                            desc="Забираем из Бендер и Тирасполя. Вам не нужно быть за рулем — мы берем дорогу на себя, возвращая вас домой к вечеру."
                        />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                        <InfoCard 
                            icon={Utensils} 
                            title="Фирменная полевая кухня" 
                            desc="Готовим потрясающую кашу на живом огне, делаем свежий салат и завариваем тот самый чай на шишках и травах."
                        />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
                        <InfoCard 
                            icon={Users} 
                            title="Душевные компании" 
                            desc="Мы собираем небольшие группы, где каждому комфортно, тепло и интересно. Это идеальное место, чтобы завести новых друзей."
                        />
                    </motion.div>
                </div>

            </div>
        </section>
    );
}