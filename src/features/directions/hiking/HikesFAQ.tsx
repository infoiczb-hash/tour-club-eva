'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Send, Sparkles } from 'lucide-react';
import ContactHubModal from "@/components/modals/ContactHubModal";

const FAQ_DATA = [
        { 
        q: "А если я буду тормозить группу?", 
        a: "Это самый частый страх! Мы всегда идем по темпу самого медленного участника. Делаем частые привалы. У нас не спортивные забеги на время, а экспедиции для удовольствия." 
    },
    { 
        q: "Что с визами и документами?", 
        a: " Мы выбираем страны где не нужны визы. Нужен действующий биометрический пасопрт Украины или Молдовы со сроком действия не менее 6 месяцев до его окончания" 
    },
    { 
        q: "Чем мы будем питаться в горах?", 
        a: "Формат питания зависит от конкретного тура. От формата только завтрак, завтрак и ужин или трехразовое питание. В любом случае, мы всегда обеспечиваем вкусную и сытную еду, которая поможет вам восстановить силы после дня в горах."
},
    ];

export default function HikesFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [isHubOpen, setIsHubOpen] = useState(false);

    return (
        <section className="py-12 md:py-20 bg-stone-950 text-stone-100 border-t border-white/5 relative overflow-hidden">
            
            {/* Фоновое свечение */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-teal-900/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    
                    {/* ЛЕВАЯ КОЛОНКА: FAQ */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8">
                                ВАЖНО <span className="text-teal-500">ЗНАТЬ</span>
                            </h2>
                            
                            <div className="space-y-3">
                                {FAQ_DATA.map((item, index) => (
                                    <div key={index} className="bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-2xl overflow-hidden hover:border-teal-900/50 transition-colors">
                                        <button 
                                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                            className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
                                        >
                                            <span className="font-bold pr-4 text-stone-200 text-sm md:text-base">{item.q}</span>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${openIndex === index ? 'rotate-180 bg-teal-900/30 text-teal-400' : 'bg-stone-800 text-stone-400'}`}>
                                                <ChevronDown size={18} />
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {openIndex === index && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-5 md:px-6 pb-5 md:pb-6 text-stone-400 text-sm md:text-base border-t border-stone-800 pt-4 font-medium leading-relaxed"
                                                >
                                                    {item.a}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* ПРАВАЯ КОЛОНКА: ФИНАЛЬНЫЙ CTA */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-stone-900/60 backdrop-blur-md border border-stone-700/50 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden lg:sticky lg:top-24"
                        >
                            {/* Декоративное пятно в карточке */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 blur-[50px] rounded-full pointer-events-none" />
                            
                            <Sparkles className="w-10 h-10 text-teal-500 mb-6" />

                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4 text-stone-100">
                                Готовы к <span className="text-teal-400">перезагрузке?</span>
                            </h2>
                            <p className="text-stone-400 mb-8 text-sm md:text-base font-medium leading-relaxed">
                                Свяжитесь с нами, чтобы узнать даты ближайших экспедиций, подобрать комфортный маршрут или задать любые вопросы лично гиду.
                            </p>

                            <div className="flex flex-col gap-3 relative z-10">
                                <a 
                                    href="https://t.me/romansvtirase"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 bg-teal-600 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-teal-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(13,148,136,0.2)]"
                                >
                                    <Send size={18} />
                                    <span>Написать в Telegram</span>
                                </a>

                                <button 
                                    onClick={() => setIsHubOpen(true)}
                                    className="w-full py-4 bg-stone-800 text-stone-200 font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-stone-700 hover:text-white transition-all flex items-center justify-center gap-2 border border-stone-700 hover:border-stone-600"
                                >
                                    <MessageCircle size={18} />
                                    <span>Задать вопрос на сайте</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>

            <ContactHubModal 
                isOpen={isHubOpen} 
                onClose={() => setIsHubOpen(false)} 
                initialTab="HELP" 
            />
        </section>
    );
}