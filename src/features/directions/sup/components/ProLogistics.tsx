'use client';

import { Shield, Check, Droplets, Sun, Anchor, Car, Briefcase } from 'lucide-react';

export default function ProLogistics() {
    return (
        // 🔥 1. Уменьшили внешние отступы (было py-12, стало py-8 md:py-16)
        <section className="py-8 md:py-12 bg-slate-950 border-t border-white/5 relative overflow-hidden">
            {/* Легкий фоновый акцент */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-900/10 md:blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    
                    {/* 🔥 2. БЛОК 1 (Перенесен наверх): Чек-лист */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:border-teal-500/30 transition-colors rounded-[2rem] p-6 md:p-8 flex flex-col h-full group">
                        <div className="flex flex-row items-center gap-4 mb-5 md:mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors duration-300">
                                <Briefcase className="text-teal-400 group-hover:text-slate-900 transition-colors" size={24} strokeWidth={1.5} />
                            </div>
                            {/* 🔥 3. Заголовок в стиле страницы */}
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-teal-400 transition-colors">
                                Что с собой брать?
                            </h3>
                        </div>

                        <p className="text-slate-400 text-[14px] mb-6 leading-relaxed font-medium">
                            Базовый набор для комфортного прохождения длинных (3+ часов) дистанций.
                        </p>

                        <ul className="space-y-3 text-[14px] text-slate-300 flex-grow font-medium">
                            <li className="flex gap-3 items-center p-3.5 md:p-4 rounded-xl bg-white/5 border border-white/5">
                                <Droplets size={18} className="text-blue-400 shrink-0"/> 
                                <span>Питьевая вода (минимум 1.5 литра на человека)</span>
                            </li>
                            <li className="flex gap-3 items-center p-3.5 md:p-4 rounded-xl bg-white/5 border border-white/5">
                                <Sun size={18} className="text-amber-400 shrink-0"/> 
                                <span>Крем SPF 50+, кепка, очки <b>на шнурке</b> (иначе утонут)</span>
                            </li>
                            <li className="flex gap-3 items-center p-3.5 md:p-4 rounded-xl bg-white/5 border border-white/5">
                                <Anchor size={18} className="text-slate-400 shrink-0"/> 
                                <span>Гермомешок для телефона, ключей и перекуса</span>
                            </li>
                            <li className="flex gap-3 items-center p-3.5 md:p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-50">
                                <Shield size={18} className="text-teal-400 shrink-0"/> 
                                <span><b>Спасжилет обязателен всегда!</b> (выдаем бесплатно)</span>
                            </li>
                        </ul>
                    </div>

                    {/* 🔥 2. БЛОК 2 (Перенесен вниз): Своя доска */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:border-teal-500/30 transition-colors rounded-[2rem] p-6 md:p-8 flex flex-col h-full group">
                        <div className="flex flex-row items-center gap-4 mb-5 md:mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors duration-300">
                                <Car className="text-teal-400 group-hover:text-slate-900 transition-colors" size={24} strokeWidth={1.5} />
                            </div>
                            {/* 🔥 3. Заголовок в стиле страницы */}
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-teal-400 transition-colors">
                                А если у меня свой SUP?
                            </h3>
                        </div>
                        
                        <p className="text-slate-400 text-[14px] mb-6 leading-relaxed font-medium">
                            Присоединяйтесь к нашим маршрутам на своем сапборде. Оплачивается только оргвзнос (50% от стоимости) и логистика доставки.
                        </p>
                        
                        <ul className="space-y-4 text-[14px] text-slate-300 mb-8 flex-grow font-medium">
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0"><Check size={18} className="text-teal-500 group-hover:text-teal-400 transition-colors"/></div> 
                                <span>Место для доски в нашем прицепе (не нужно сдувать)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0"><Check size={18} className="text-teal-500 group-hover:text-teal-400 transition-colors"/></div> 
                                <span>Трансфер вас и доски от финиша к точке старта</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0"><Check size={18} className="text-teal-500 group-hover:text-teal-400 transition-colors"/></div> 
                                <span>Доступ к нашему насосу в случае необходимости</span>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    );
}