"use client";

import React from "react";
import { Calendar, Clock } from "lucide-react";
import { TourProgramData, TourProgramDay, TourActivity } from "../types"; 
import { useInView } from '@/hooks/useInView';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//   Выносим карточку дня в отдельный компонент, чтобы у каждой был свой независимый хук useInView
function ProgramDayCard({ item, idx }: { item: TourProgramDay; idx: number }) {
  const { ref, inView } = useInView({ threshold: 0.1, rootMargin: '-50px' });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "relative pl-8 md:pl-12 transition-all duration-500 ease-out",
        inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"
      )}
      style={{ transitionDelay: `${Math.min(idx * 100, 500)}ms` }} // Ограничиваем delay, чтобы не ждать вечность на длинных турах
    >
      {/* Точка на таймлайне */}
      <div className="absolute -left-[11px] top-0 w-[22px] h-[22px] bg-slate-50 dark:bg-[#0a0f0d] border-4 border-teal-500 rounded-full z-10 box-content shadow-sm transition-transform hover:scale-125" />

      <div className="group">
        {/* Бейдж дня */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-full mb-3 uppercase tracking-wider border border-teal-500/20">
          <Clock size={12} />
          День {item.day || (idx + 1)}
        </span>

        {/* Карточка дня */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
          
          {/* Заголовок дня */}
          <h4 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
            {item.title}
          </h4>
          
          {/* АКТИВНОСТИ ВНУТРИ ДНЯ */}
          {item.activities && item.activities.length > 0 ? (
            <div className="space-y-4">
              {item.activities.map((act: TourActivity, aIdx: number) => (
                <div key={aIdx} className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-900 transition-colors">
                  
                  {/* Время */}
                  {act.time && (
                    <div className="shrink-0 pt-0.5">
                       <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900  px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          {act.time}
                       </span>
                    </div>
                  )}

                  <div className="space-y-1">
                     {/* Заголовок активности + Иконка */}
                     <div className="flex items-center gap-2">
                        {act.icon && (
                          <span className="text-lg leading-none">{act.icon}</span>
                        )}
                        {act.title && (
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                            {act.title}
                          </p>
                        )}
                     </div>
                     
                     {/* Описание активности */}
                     {act.description && (
                       <p className="text-xs md:text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
                         {act.description}
                       </p>
                     )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // FALLBACK: Если нет активностей, выводим description
            item.description && (
              <div className="prose prose-sm dark:prose-invert text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {item.description}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function TourProgram({ program }: { program: TourProgramData }) {
  // Если пусто, ничего не рисуем
  if (!program) return null;

  let days: TourProgramDay[] = [];
  let simpleText: string | null = null;

  // ==================================================
  // 1. ЛОГИКА ПАРСИНГА (Усиленная защита)
  // ==================================================
  if (typeof program === 'string') {
    const trimmed = program.trim();
    // Пытаемся понять, JSON ли это
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(program);
        if (Array.isArray(parsed)) {
            days = parsed; // Это массив дней
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.days)) {
            days = parsed.days; // Это объект { days: [...] }
        } else {
            simpleText = program; // Не удалось распознать структуру
        }
      } catch {
        simpleText = program; // Ошибка парсинга -> считаем обычным текстом
      }
    } else {
      simpleText = program; // Обычный текст
    }
  } else if (Array.isArray(program)) {
    days = program;
  } else if (typeof program === 'object' && 'days' in program) {
    // Приведение типа
    days = (program as any).days;
  }

  // ==================================================
  // 2. РЕНДЕР: ПРОСТОЙ ТЕКСТ (Legacy / Simple Mode)
  // ==================================================
  if (simpleText) {
    return (
      <div className="py-8 animate-in fade-in duration-500">
        <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white mb-6">
          <Calendar className="text-teal-500" /> Программа
        </h3>
        <div className="prose prose-lg dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {simpleText}
        </div>
      </div>
    );
  }

  // ==================================================
  // 3. РЕНДЕР: КОНСТРУКТОР (Builder / Timeline Mode)
  // ==================================================
  if (!days || days.length === 0) return null;

  return (
    <div className="py-8">
      <h3 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-10 text-slate-900 dark:text-white flex items-center gap-3">
        <Calendar className="text-teal-500" />
        Программа тура
      </h3>

      {/* Контейнер с вертикальной линией */}
      <div className="relative border-l-2 border-teal-500/20 ml-4 md:ml-6 space-y-12 pb-4">
        {days.map((item: TourProgramDay, idx: number) => (
          <ProgramDayCard key={idx} item={item} idx={idx} />
        ))}
      </div>
    </div>
  );
}