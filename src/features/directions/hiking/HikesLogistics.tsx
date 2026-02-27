'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Bus, Tent, Backpack, Quote } from 'lucide-react';

const LOGISTICS = [
    {
        icon: Bus,
        title: "Транспорт",
        desc: "Едем на микроавтобусах (различной вместимости) прямо из ПМР/Молдовы до точки старта маршрута. Никаких сложных пересадок с рюкзаками по вокзалам."
    },
    {
        icon: Tent,
        title: "Ночевки",
        desc: "Спим в гостевых домах, горных приютах, отелях или в палатках в зависимости от маршрута и формата тура."
    },
    {
        icon: Backpack,
        title: "Снаряжение",
        desc: "Мы предоставляем обещственное снаряжение. Личное (рюкзак, спальник) — ваше. Перед походом даем подробный гайд, чтобы вы не несли лишнего. Если что-то надо найдем для Вас или скажем где взять. Есть аренда в рамках стока."
    },
    {
        icon: ShieldCheck,
        title: "Безопасность",
        desc: "Берем аптечку. На сложных маршрутах регистрируемся у спасателей. Всегда есть рации для сопровождения группы. Гид всегда контролирует темп группы, в целях группового комфорта и безопасности."
    }
];

export default function HikesLogistics() {
    return (
        <section className="py-12 md:py-20 bg-stone-950 border-t border-white/5 relative overflow-hidden">
            
            {/* Легкое атмосферное свечение */}
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] -translate-y-1/2 bg-teal-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                <div className="grid lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Левая колонка: Цитата Гида */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-5"
                    >
                        <div className="bg-stone-900/50 p-8 md:p-10 rounded-[2.5rem] border border-stone-800 shadow-2xl relative backdrop-blur-sm">
                            <Quote className="absolute top-8 right-8 text-stone-800 w-16 h-16 pointer-events-none" />
                            
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-8 relative z-10">
                                В горах нет <br/>
                                <span className="text-teal-500">случайных людей</span>
                            </h2>
                            
                            <p className="text-stone-400 font-medium leading-relaxed mb-10 relative z-10 text-sm md:text-base">
                                «Тур в горы — это ваш личный отдых, а не испытание на прочность. Моя главная задача как гида — взять на себя всю логистику, навигацию и быт, чтобы вы могли просто идти, дышать и впитывать красоту вокруг. Мы проходим маршрут вместе, в темпе самого медленного участника. Никто не останется один.»
                            </p>

                            <div className="flex items-center gap-4 border-t border-stone-800 pt-6">
                                <div className="w-14 h-14 bg-stone-800 rounded-full flex items-center justify-center shrink-0 border border-stone-700 overflow-hidden">
                                    <span className="text-stone-500 font-bold text-xl">Р</span>
                                </div>
                                <div>
                                    <div className="text-stone-100 font-bold text-lg leading-tight">Роман Санду</div>
                                    <div className="text-teal-600 text-[14px] md:text-xs uppercase font-bold tracking-widest mt-1">
                                       Туристический гид
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Правая колонка: База/Логистика (Темные карточки) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-7 grid sm:grid-cols-2 gap-4 md:gap-6"
                    >
                        {LOGISTICS.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div key={idx} className="bg-stone-900/40 p-6 md:p-8 rounded-3xl border border-stone-800 hover:border-teal-500/50 transition-colors group backdrop-blur-sm">
                                    <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-900/40 transition-colors duration-300 border border-stone-700 group-hover:border-teal-700/50">
                                        <Icon className="text-teal-500 group-hover:text-teal-400 transition-colors duration-300" size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-stone-100 mb-3">{item.title}</h3>
                                    <p className="text-stone-400 text-sm leading-relaxed font-medium">
                                        {item.desc}
                                    </p>
                                </div>
                            )
                        })}
                    </motion.div>

                </div>
            </div>
        </section>
    );
}