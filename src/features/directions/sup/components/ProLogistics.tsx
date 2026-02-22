'use client';

import { MapPin, Shield, Check, Droplets, Sun, Anchor, Car } from 'lucide-react';

export default function ProLogistics() {
    return (
        <section className="py-12 bg-slate-950 border-t border-white/5 relative overflow-hidden">
            {/* Легкий фоновый акцент */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-900/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-5xl relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* БЛОК 1: Логистика и своя доска */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:border-teal-500/30 transition-colors rounded-3xl p-8 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                                <Car className="text-teal-400" size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-wide">
                                Со своей доской на сплавах
                            </h3>
                        </div>
                        
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Присоединяйтесь к нашим маршрутам на своем сапборде. Оплачивается только оргвзнос (50% от стоимости) и логистика доставки.
                        </p>
                        
                        <ul className="space-y-3 text-sm text-slate-300 mb-8 flex-grow">
                            <li className="flex items-start gap-3">
                                <Check size={16} className="text-teal-500 mt-0.5 shrink-0"/> 
                                <span>Место для доски в нашем прицепе (не нужно сдувать)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check size={16} className="text-teal-500 mt-0.5 shrink-0"/> 
                                <span>Трансфер вас и доски от финиша к точке старта</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check size={16} className="text-teal-500 mt-0.5 shrink-0"/> 
                                <span>Доступ к насосу в случае необходимости</span>
                            </li>
                        </ul>
                        
                    </div>

                    {/* БЛОК 2: Хардкорный чек-лист */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:border-teal-500/30 transition-colors rounded-3xl p-8 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                                <Shield className="text-slate-300" size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-wide">
                                Чек-лист для тех, ко собрался на SUP-сплав
                            </h3>
                        </div>

                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Базовый набор для комфортного прохождения длинных (3+ часов) дистанций.
                        </p>

                        <ul className="space-y-4 text-sm text-slate-300 flex-grow">
                            <li className="flex gap-3 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <Droplets size={18} className="text-blue-400 shrink-0"/> 
                                <span>Питьевая вода (минимум 1.5 литра на человека)</span>
                            </li>
                            <li className="flex gap-3 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <Sun size={18} className="text-amber-400 shrink-0"/> 
                                <span>Крем SPF 50+, кепка, очки <b>на шнурке</b> (иначе утонут)</span>
                            </li>
                            <li className="flex gap-3 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <Anchor size={18} className="text-slate-400 shrink-0"/> 
                                <span>Гермомешок для телефона, ключей от машины и перекуса</span>
                            </li>
                            <li className="flex gap-3 items-center p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-50">
                                <Shield size={18} className="text-teal-400 shrink-0"/> 
                                <span><b>Спасжилет обязателен всегда!</b> (выдаем бесплатно)</span>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    );
}