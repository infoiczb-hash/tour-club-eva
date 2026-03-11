'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Sparkles } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';

const FAQ_DATA = [
    { 
        q: "А если я буду тормозить группу?", 
        a: "Это самый частый страх! Мы всегда идем по темпу самого медленного участника. Делаем частые привалы. У нас не спортивные забеги на время, а экспедиции для удовольствия." 
    },
    { 
        q: "Что с визами и документами?", 
        a: "Мы выбираем страны, где не нужны визы. Нужен действующий биометрический паспорт Украины или Молдовы со сроком действия не менее 6 месяцев до его окончания." 
    },
    { 
        q: "Чем мы будем питаться в горах?", 
        a: "Формат питания зависит от конкретного тура. Это может быть только завтрак, завтрак и ужин, или полноценное трехразовое питание. В любом случае, мы всегда обеспечиваем вкусную и сытную походную еду, которая поможет восстановить силы."
    }
];

export default function HikesFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const openContactModal = useModalStore((state) => state.openContactModal);

    return (
        <section className="py-8 md:py-16 bg-stone-950 text-stone-100 border-t border-white/5 relative overflow-hidden">
            
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                <div className="grid lg:grid-cols-12 gap-10 md:gap-16 items-start">
                    
                    {/* ЛЕВАЯ КОЛОНКА: FAQ */}
                    <div className="lg:col-span-7">
                        <div className="text-left animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-both">
                           <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-8 md:mb-12">
                              FAQ<span className="text-teal-500">.</span>
                           </h2>
                            
                            <div className="space-y-3 md:space-y-4">
                                {FAQ_DATA.map((item, index) => (
                                    <div 
                                      key={index} 
                                      className="bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-2xl overflow-hidden hover:border-teal-900/50 transition-colors shadow-lg animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                                      style={{ animationDelay: `${index * 150}ms` }}
                                    >
                                        <button
                                          onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                          aria-expanded={openIndex === index}
                                          className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none group"
                                        >
                                            <span className="font-bold pr-4 text-[14px] md:text-base text-stone-200 group-hover:text-white transition-colors">
                                                {item.q}
                                            </span>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${openIndex === index ? 'rotate-180 bg-teal-900/30 text-teal-400' : 'bg-stone-800 text-stone-400 group-hover:bg-stone-700'}`}>
                                                <ChevronDown size={18} />
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {openIndex === index && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-5 md:px-6 pb-5 md:pb-6 text-[14px] md:text-base text-stone-400 border-t border-stone-800 pt-4 font-medium leading-relaxed"
                                                >
                                                    {item.a}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ПРАВАЯ КОЛОНКА: ФИНАЛЬНЫЙ CTA */}
                    <div className="lg:col-span-5">
                        <div className="bg-stone-900/60 backdrop-blur-md border border-stone-700/50 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden lg:sticky lg:top-24 animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-both">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 blur-[50px] rounded-full pointer-events-none" />
                            
                            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-teal-500 mb-5 md:mb-6" />

                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4 text-stone-100 leading-tight">
                                Готовы к <span className="text-teal-400">перезагрузке?</span>
                            </h2>
                            <p className="text-stone-400 mb-8 text-[14px] md:text-base font-medium leading-relaxed">
                                Свяжитесь с нами, чтобы узнать даты ближайших экспедиций, подобрать комфортный маршрут или задать любые вопросы лично гиду.
                            </p>

                            <div className="flex flex-col relative z-10">
                                <button 
                                   onClick={() => openContactModal('Вопрос по турам в горы', 'TOUR')}
                                    className="w-full py-4 bg-teal-600 text-white font-bold uppercase tracking-wider text-[13px] md:text-sm rounded-xl hover:bg-teal-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                                >
                                    <MessageCircle size={18} />
                                    <span>Спросить о туре</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </section>
    );
}