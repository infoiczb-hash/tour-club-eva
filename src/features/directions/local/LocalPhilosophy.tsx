'use client';

import { motion } from 'framer-motion';
import { Leaf, Coffee, Wind } from 'lucide-react';

// Вспомогательный компонент для анимации появления текста
function FadeText({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay }}
        >
            {children}
        </motion.div>
    );
}

export default function LocalPhilosophy() {
    return (
        <section className="py-10 md:py-12 relative bg-slate-950">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto space-y-16">
                    
                    <FadeText>
                        <h2 className="text-3xl md:text-5xl font-light text-white leading-tight">
                            Мы привыкли искать красоту за сотни километров. <span className="text-stone-500">Но настоящая красота не требует билета на самолет. Нужно лишь правильное настроение.</span>
                        </h2>
                    </FadeText>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                        <FadeText delay={0.1}>
                            <div className="p-8 bg-slate-900/50 rounded-3xl border border-white/5 h-full hover:border-emerald-500/30 transition-colors group">
                                <Leaf className="w-10 h-10 text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
                                <h3 className="text-xl font-bold text-white mb-4">Свобода</h3>
                                <p className="text-stone-400 leading-relaxed text-sm md:text-base">
                                    Мы не бегаем за гидом. Мы гуляем по кромке Днестра, смотрим на парапланы, пинаем осенние листья, ищем грибы и ловим лучшие закаты.
                                </p>
                            </div>
                        </FadeText>
                        
                        <FadeText delay={0.2}>
                            <div className="p-8 bg-slate-900/50 rounded-3xl border border-white/5 h-full hover:border-emerald-500/30 transition-colors group">
                                <Coffee className="w-10 h-10 text-amber-500 mb-6 group-hover:scale-110 transition-transform" />
                                <h3 className="text-xl font-bold text-white mb-4">Атмосфера</h3>
                                <p className="text-stone-400 leading-relaxed text-sm md:text-base">
                                    Фирменный чай «Бабаха» на шишках, вкуснейшая походная каша на огне и душевные разговоры, которых так не хватает в суете города.
                                </p>
                            </div>
                        </FadeText>
                        
                        <FadeText delay={0.3}>
                            <div className="p-8 bg-slate-900/50 rounded-3xl border border-white/5 h-full hover:border-emerald-500/30 transition-colors group">
                                <Wind className="w-10 h-10 text-blue-400 mb-6 group-hover:scale-110 transition-transform" />
                                <h3 className="text-xl font-bold text-white mb-4">Замедление</h3>
                                <p className="text-stone-400 leading-relaxed text-sm md:text-base">
                                    Гамаки в сосновом бору, шелест деревьев и полная тишина. Возможность задремать, почитать книгу или просто смотреть в бескрайнее небо.
                                </p>
                            </div>
                        </FadeText>
                    </div>

                </div>
            </div>
        </section>
    );
}