'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';

const FAQ_DATA = [
    { 
        q: "Что если я никогда не стоял на SUP?", 
        a: "Это не проблема! Наши доски (шириной от 78 см) максимально устойчивы. Перед выходом на воду инструктор проводит подробный инструктаж на берегу: как садиться, вставать, грести и держать баланс. Большинство новичков уверенно стоят на ногах уже через 15 минут." 
    },
    { 
        q: "Какая одежда нужна?", 
        a: "В жаркую погоду — купальник, плавки, легкие шорты и футболка (желательно синтетика или лайкра, чтобы быстро сохла). Обязательно головной убор и солнцезащитные очки на шнурке. Обувь на самой доске не нужна (гребем босиком), но для берега возьмите кроксы или кораллки." 
    },
    { 
        q: "Что делать, если я упаду в воду?", 
        a: "Падения случаются, и это часть веселья! Во-первых, вы будете в сертифицированном спасательном жилете. Во-вторых, к вашей ноге пристегнут страховочный лиш (трос), поэтому доска никуда не уплывет. Инструктор покажет, как легко забраться обратно на доску из воды."
    },
    {
        q: "Можно ли взять с собой телефон на воду?",
        a: "Да, конечно. Мы настоятельно рекомендуем использовать специальные водонепроницаемые чехлы на шнурке (гермочехлы), которые вешаются на шею. Без чехла брать телефон на доску мы категорически не советуем — риск утопить его очень высок."
    }
];

export default function SupFAQ() {
    // Состояние для открытия нужного вопроса
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-12 md:py-20 bg-slate-950 border-t border-white/5 relative overflow-hidden text-slate-200">
            
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                
                {/* ЗАГОЛОВОК */}
                <div className="text-center mb-10 md:mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                   <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-4 md:mb-6 backdrop-blur-md">
                        <MessageCircle className="w-4 h-4 text-teal-400" />
                        <span className="text-[10px] font-bold tracking-widest text-teal-300 uppercase">
                            База знаний
                        </span>
                    </div>
                   <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                      Частые <span className="text-teal-500">Вопросы</span>
                   </h2>
                   <p className="text-sm md:text-base font-medium text-slate-400 max-w-2xl mx-auto leading-relaxed">
                      Собрали ответы на самые популярные вопросы от новичков. Если не нашли то, что искали — напишите нам.
                   </p>
                </div>

                {/* АККОРДЕОН */}
                <div className="space-y-3 md:space-y-4">
                    {FAQ_DATA.map((item, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div 
                              key={index} 
                              className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden hover:border-teal-500/30 transition-all shadow-lg animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                              style={{ animationDelay: `${index * 150}ms` }}
                            >
                                {/* КНОПКА ВОПРОСА */}
                                <button
                                  onClick={() => setOpenIndex(isOpen ? null : index)}
                                  className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none group"
                                >
                                    <span className="font-bold pr-4 text-[14px] md:text-lg text-slate-200 group-hover:text-white transition-colors leading-tight">
                                        {item.q}
                                    </span>
                                    {/* ИКОНКА СТРЕЛОЧКИ */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'rotate-180 bg-teal-500/10 text-teal-400' : 'bg-white/5 text-slate-400 group-hover:bg-white/10'}`}>
                                        <ChevronDown size={18} />
                                    </div>
                                </button>
                                
                                {/* ПЛАВНОЕ РАЗВОРАЧИВАНИЕ ОТВЕТА (Framer Motion) */}
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="px-5 md:px-6 pb-5 md:pb-6 text-[14px] md:text-base text-slate-400 border-t border-white/5 pt-4 font-medium leading-relaxed"
                                        >
                                            {item.a}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}