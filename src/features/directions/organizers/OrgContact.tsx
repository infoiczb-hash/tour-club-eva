'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Send, ArrowRight, MessageSquareText } from 'lucide-react';
import ContactHubModal from "@/components/modals/ContactHubModal";

export default function OrgContact() {
    const [isHubOpen, setIsHubOpen] = useState(false);

    return (
        <section className="py-12 md:py-20 bg-slate-950 border-t border-white/5 relative overflow-hidden">
            {/* Фоновое свечение B2B */}
             <div className="container mx-auto px-4 max-w-5xl relative z-10">
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-900/20 mb-6">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                            Открыты к сотрудничеству
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">
                        ДАВАЙТЕ ОБСУДИМ <br className="hidden md:block"/>
                        <span className="text-indigo-500">ВАШУ ЗАДАЧУ</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                        Мы не продаем готовые пакеты. Мы слушаем вас и рассчитываем смету индивидуально под запрос вашей команды.
                    </p>
                </motion.div>

                {/* Карточки связи */}
                <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* КАРТОЧКА 1: Контакт-Центр (Официальная заявка) */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-8 md:p-10 bg-slate-900/60 rounded-[2rem] border border-white/10 hover:border-indigo-500/40 transition-colors flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                                <Briefcase size={28} className="text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                                Оставить заявку на расчет
                            </h3>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium mb-8">
                                Опишите кратко вашу идею, количество человек и примерные даты. Мы свяжемся с вами и подготовим коммерческое предложение.
                            </p>
                        </div>
                        
                        <button 
                            onClick={() => setIsHubOpen(true)}
                            className="w-full py-4 bg-white/5 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all border border-white/10 hover:border-transparent flex items-center justify-center gap-3 group/btn"
                        >
                            <MessageSquareText size={20} className="text-indigo-400 group-hover/btn:text-white transition-colors" />
                            <span>Открыть Контакт-Центр</span>
                        </button>
                    </motion.div>

                    {/* КАРТОЧКА 2: Прямая связь в Telegram (Лично Роману) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-8 md:p-10 bg-gradient-to-br from-[#229ED9]/10 to-slate-900/60 rounded-[2rem] border border-[#229ED9]/20 hover:border-[#229ED9]/50 transition-colors flex flex-col justify-between group relative overflow-hidden"
                    >
                        {/* Декоративный логотип TG на фоне */}
                        <Send size={150} className="absolute -bottom-10 -right-10 text-[#229ED9]/5 -rotate-12 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-[#229ED9]/10 border border-[#229ED9]/30 flex items-center justify-center">
                                    <Send size={24} className="text-[#229ED9] ml-1" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg leading-tight">Роман Санду</div>
                                    <div className="text-slate-400 text-xs uppercase tracking-widest mt-1 font-bold">Основатель клуба</div>
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                                Прямая связь
                            </h3>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium mb-8">
                                Есть срочный вопрос, нестандартная идея или нужен корпоратив "уже в эту пятницу"? Напишите мне напрямую в Telegram, обсудим лично.
                            </p>
                        </div>
                        
                        <a 
                            href="https://t.me/romansvtirase"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 w-full py-4 bg-[#229ED9] hover:bg-[#1f91c7] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,158,217,0.3)] hover:shadow-[0_0_30px_rgba(34,158,217,0.5)] flex items-center justify-center gap-3 group/tg"
                        >
                            <span>Написать @romansvtirase</span>
                            <ArrowRight size={20} className="group-hover/tg:translate-x-1 transition-transform" />
                        </a>
                    </motion.div>

                </div>
            </div>

            {/* Ваша универсальная модалка связи */}
            <ContactHubModal 
                isOpen={isHubOpen} 
                onClose={() => setIsHubOpen(false)} 
                initialTab="HELP" 
            />
        </section>
    );
}