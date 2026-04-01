import { Droplets, Sun, Shirt, Footprints, LifeBuoy, Briefcase, Car, Check, Clock, Route } from 'lucide-react';

export default function ProLogistics() {
    return (
        <section className="py-8 md:py-16 bg-slate-950 border-t border-white/5 relative overflow-hidden">
            {/* Фоновое свечение */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-900/10 md:blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* ВЕРХНИЙ РЯД: Две карточки (Прогулки и Сплавы) */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                    
                    {/* БЛОК 1: Короткие прогулки */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:border-teal-500/30 transition-colors rounded-[2rem] p-6 md:p-8 flex flex-col h-full group">
                        <div className="flex flex-row items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors duration-300">
                                <Clock className="text-teal-400 group-hover:text-slate-900 transition-colors" size={24} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-teal-400 transition-colors">
                                Для коротких прогулок
                            </h3>
                        </div>

                        <ul className="space-y-3 text-[14px] md:text-[15px] text-slate-300 flex-grow font-medium">
                            <li className="flex gap-3 items-start p-3.5 rounded-xl bg-white/5 border border-white/5">
                                <div className="mt-0.5 shrink-0"><Droplets size={18} className="text-blue-400"/></div> 
                                <span>Питьевая вода (0.5 – 1 литр на человека) по желанию.</span>
                            </li>
                            <li className="flex gap-3 items-start p-3.5 rounded-xl bg-white/5 border border-white/5">
                                <div className="mt-0.5 shrink-0"><Sun size={18} className="text-amber-400"/></div> 
                                <span>Защита от солнца (головной убор, кепка, очки <b>на шнурке</b> (иначе утонут), SPF если активное солнце).</span>
                            </li>
                            <li className="flex gap-3 items-start p-3.5 rounded-xl bg-white/5 border border-white/5">
                                <div className="mt-0.5 shrink-0"><Shirt size={18} className="text-slate-300"/></div> 
                                <span>Комплект сухой одежды (если захочется переодеться после воды).</span>
                            </li>
                            <li className="flex gap-3 items-start p-3.5 rounded-xl bg-white/5 border border-white/5">
                                <div className="mt-0.5 shrink-0"><Footprints size={18} className="text-slate-300"/></div> 
                                <span>Тапочки или аквашузы.</span>
                            </li>
                            <li className="flex gap-3 items-start p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-50">
                                <div className="mt-0.5 shrink-0"><LifeBuoy size={18} className="text-teal-400"/></div> 
                                <span>Если у Вас свой спасательный жилет, можете взять.</span>
                            </li>
                        </ul>
                    </div>

                    {/* БЛОК 2: Длинные сплавы */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:border-teal-500/30 transition-colors rounded-[2rem] p-6 md:p-8 flex flex-col h-full group">
                        <div className="flex flex-row items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors duration-300">
                                <Route className="text-teal-400 group-hover:text-slate-900 transition-colors" size={24} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-teal-400 transition-colors">
                                Для длинных сплавов
                            </h3>
                        </div>

                        <ul className="space-y-3 text-[14px] md:text-[15px] text-slate-300 flex-grow font-medium">
                            <li className="flex gap-3 items-start p-3.5 rounded-xl bg-white/5 border border-white/5">
                                <div className="mt-0.5 shrink-0"><Droplets size={18} className="text-blue-400"/></div> 
                                <span>Питьевая вода (минимум 1-1.5 литра на человека).</span>
                            </li>
                            <li className="flex gap-3 items-start p-3.5 rounded-xl bg-white/5 border border-white/5">
                                <div className="mt-0.5 shrink-0"><Sun size={18} className="text-amber-400"/></div> 
                                <span>Мощный крем SPF 50+, кепка и очки обязательно <b>на шнурке</b> (иначе утонут).</span>
                            </li>
                            <li className="flex gap-3 items-start p-3.5 rounded-xl bg-white/5 border border-white/5">
                                <div className="mt-0.5 shrink-0"><Footprints size={18} className="text-slate-300"/></div> 
                                <span>Удобная обувь для воды (аквашузы или сандалии для остановок на берегах).</span>
                            </li>
                            <li className="flex gap-3 items-start p-3.5 rounded-xl bg-white/5 border border-white/5">
                                <div className="mt-0.5 shrink-0"><Shirt size={18} className="text-slate-300"/></div> 
                                <span>Сменная одежда и обувь.</span>
                            </li>
                            <li className="flex gap-3 items-start p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-50">
                                <div className="mt-0.5 shrink-0"><Briefcase size={18} className="text-teal-400"/></div> 
                                <span>Если есть свой гермомешок и гермочехол для телефона, ключей и перекуса (если нет своего — выдадим).</span>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* НИЖНИЙ РЯД: Свой SUP (Широкий блок) */}
                <div className="bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:border-teal-500/30 transition-colors rounded-[2rem] p-6 md:p-8 w-full group">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mb-6 md:mb-8 border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors duration-300">
                                <Car className="text-teal-400 group-hover:text-slate-900 transition-colors" size={24} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-teal-400 transition-colors">
                                А если у меня свой SUP?
                            </h3>
                        </div>
                        <p className="text-[14px] md:text-base text-slate-300 font-medium md:max-w-md lg:max-w-lg">
                            Присоединяйтесь к нашим маршрутам на своем сапборде. Оплачивается 50% от стоимости сплава/тура.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 text-[14px] md:text-[15px] text-slate-300 font-medium">
                        <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="mt-0.5 shrink-0"><Check size={18} className="text-teal-500"/></div> 
                            <span>Место для доски в нашем прицепе (не нужно сдувать)</span>
                        </div>
                        <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="mt-0.5 shrink-0"><Check size={18} className="text-teal-500"/></div> 
                            <span>Трансфер вас и доски от финиша к точке старта</span>
                        </div>
                        <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="mt-0.5 shrink-0"><Check size={18} className="text-teal-500"/></div> 
                            <span>Доступ к нашему насосу в случае необходимости</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}