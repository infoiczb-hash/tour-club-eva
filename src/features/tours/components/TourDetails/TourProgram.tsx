"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, ChevronDown, Flag, Navigation, CircleDot, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface TourProgramProps {
  program: any;
}

export default function TourProgram({ program }: TourProgramProps) {
  const days = React.useMemo(() => {
    if (!program) return [];
    if (Array.isArray(program)) return program;
    if (typeof program === 'object' && program.days) return program.days;
    return [];
  }, [program]);

  const [openDayIndex, setOpenDayIndex] = useState<number | null>(0);
  const [isPrinting, setIsPrinting] = useState(false);

  const toggleDay = (index: number) => setOpenDayIndex(openDayIndex === index ? null : index);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  if (!days || days.length === 0) return null;

  return (
    <section className="scroll-mt-24" id="program">
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20">
          <MapPin size={20} />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase">Программа тура</h2>
          <p className="text-slate-400 text-lg font-medium">Маршрут разбит на {days.length} дня</p>
        </div>
      </div>

      <div className="relative max-w-4xl">
        <div className="absolute left-[19px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-slate-800 to-transparent print:hidden" />
        <div className="space-y-3">
          {days.map((day: any, index: number) => {
            const isOpen = isPrinting || openDayIndex === index;
            const isLast = index === days.length - 1;
            return (
              <div key={index} className="relative pl-14 md:pl-20 print:pl-12 print:break-inside-avoid print:mb-4">
                <button
                  onClick={() => toggleDay(index)}
                  className={clsx(
                    "absolute left-0 top-0 w-10 h-10 rounded-full border-4 flex items-center justify-center z-10 transition-all duration-300 print:border-slate-300 print:bg-white print:text-black",
                    isOpen && !isPrinting
                      ? "bg-teal-500 text-slate-900 border-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.5)] scale-110"
                      : "bg-slate-800 text-slate-400 border-slate-950 hover:bg-teal-500 hover:text-slate-900"
                  )}
                >
                  {isLast ? <Flag size={14} strokeWidth={3} className="print:text-black" /> : <span className="text-xs font-black">{index + 1}</span>}
                </button>

                <div className={clsx(
                  "rounded-2xl border transition-all duration-300 overflow-hidden print:border-slate-300 print:bg-transparent print:shadow-none",
                  isOpen && !isPrinting
                    ? "bg-slate-900 border-teal-500/30 shadow-2xl shadow-black/50"
                    : "bg-slate-900/40 border-white/5 hover:border-white/10 cursor-pointer"
                )}>
                  <div onClick={() => toggleDay(index)} className="p-4 md:p-5 flex items-center justify-between cursor-pointer group">
                    <div>
                      <h3 className={clsx("text-base md:text-lg font-black uppercase tracking-tight transition-colors mb-0.5 print:text-black", isOpen && !isPrinting ? "text-teal-400" : "text-white group-hover:text-teal-200")}>
                        {day.title || `День ${index + 1}`}
                      </h3>
                      {day.location && (
                        <div className="flex items-center gap-2 text-[14px] font-bold text-slate-400 uppercase print:text-slate-600">
                          <Navigation size={10} /> {day.location}
                        </div>
                      )}
                    </div>
                    <ChevronDown size={18} className={clsx("text-slate-400 transition-transform duration-300 print:hidden", isOpen && "rotate-180 text-teal-500")} />
                  </div>

                  {/* AnimatePresence оставляем — это анимация высоты по клику, не scroll */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: isPrinting ? 0 : 0.3 }}
                        className="print:block print:h-auto print:opacity-100"
                      >
                        <div className="px-4 md:px-6 pb-6 pt-0 border-t border-white/5 print:border-slate-200">
                          <div className="prose prose-invert prose-sm max-w-none text-slate-300 font-light whitespace-pre-line leading-relaxed pt-4 print:prose-p:text-black print:text-black">
                            {day.description}
                          </div>
                          {day.activities && Array.isArray(day.activities) && day.activities.length > 0 && (
                            <div className="mt-4 space-y-2 bg-black/20 p-3 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200">
                              {day.activities.map((act: any, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-xs md:text-sm print:text-black">
                                  <CircleDot size={12} className="text-teal-500 mt-1 shrink-0 print:text-slate-400" />
                                  <span className="text-slate-200 print:text-black">
                                    {typeof act === 'string' ? act : (
                                      <>
                                        {act.time && <span className="font-bold text-teal-400 mr-2 print:text-black">{act.time}</span>}
                                        {act.title}
                                      </>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pl-14 md:pl-0 print:break-inside-avoid">
          <div className="bg-amber-900/10 border border-amber-500/20 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-3 md:gap-4 items-start print:bg-white print:border-slate-300">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 print:bg-transparent print:text-slate-800">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h4 className="text-amber-500 font-bold uppercase text-xs md:text-sm mb-1 tracking-wide print:text-slate-900">Внимание!</h4>
              <p className="text-amber-100/80 text-[11px] md:text-xs leading-relaxed print:text-slate-700">
                Маршрут, программа тура и порядок посещения туристических объектов могут быть изменены без предварительного уведомления гидом/инструктором/сопровождающим в связи с погодными условиями, движением группы, физического состояния участников и других внешних обстоятельств.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}