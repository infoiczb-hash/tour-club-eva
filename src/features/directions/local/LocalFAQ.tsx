'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, PhoneCall } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';	


const FAQ_DATA = [
    { 
        q: "Нужна ли специальная физическая подготовка?", 
        a: "Нет. Наши маршруты рассчитаны на обычных людей. Уровень сложности минимальный. Главное — удобная обувь (кроссовки) и желание гулять на свежем воздухе." 
    },
    { 
        q: "Что брать с собой?", 
        a: "Рюкзачок для личных вещей, бутылку воды, удобную одежду по погоде и отличное настроение. После бронирования мы пришлем подробную памятку." 
    },
    { 
        q: "А если пойдет дождь?", 
        a: "Мы постоянно следим за прогнозом. Если ожидается сильный ливень, мы переносим тур на другую дату (с сохранением вашей оплаты или полным возвратом). А небольшой грибной дождик — это только повод надеть дождевик и выпить горячего чая." 
    },
    { 
        q: "Можно ли поехать с детьми?", 
        a: "Да! Для школьников и подростков эти маршруты — настоящее открытие. Малышам может быть тяжеловато много ходить, поэтому рекомендуемый возраст от 7-8 лет (но все зависит от ребенка)." 
    }
];

export default function LocalFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
   const openContactModal = useModalStore((state) => state.openContactModal);		

    return (
        <section className="py-12 bg-slate-950 border-t border-white/5 relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-12 text-center">
                    Частые <span className="text-emerald-500">Вопросы</span>
                </h2>

                <div className="space-y-4 mb-20">
                    {FAQ_DATA.map((item, index) => (
                        <div key={index} className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-colors">
                            <button 
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                            >
                                <span className="text-white font-bold pr-4">{item.q}</span>
                                <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 transition-transform ${openIndex === index ? 'rotate-180 bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}>
                                    <ChevronDown size={18} />
                                </div>
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-6 pb-6 text-stone-400 text-sm md:text-base border-t border-white/5 pt-4"
                                    >
                                        {item.a}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* ФИНАЛЬНЫЙ ПРИЗЫВ К ДЕЙСТВИЮ */}
                <div className="bg-gradient-to-br from-slate-900 to-[#020617] border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
                    
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">
                        Остались <span className="text-emerald-500">Вопросы?</span>
                    </h2>
                    <p className="text-stone-300 mb-8 max-w-xl mx-auto relative z-10">
                        Напишите нам. Мы поможем подобрать идеальный маршрут для вас, вашей семьи или всего класса.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                        <button 
                            onClick={() => openContactModal('Вопрос по местным турам', 'TOUR')}
                            className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={18} />
                            <span>Написать нам</span>
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
}