'use client';

import { Users, Compass, Mountain, Check } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const FORMATS = [
  {
    id: '01',
    title: 'Тимбилдинг и Корпоратив',
    target: 'Для компаний и IT-команд',
    capacity: '15 — 100+ человек',
    icon: Users,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    desc: 'Сплочение через совместное преодоление без экстрима (а может и с ним). Сплавы на байдарках, SUP, рафтах, выезды по Приднестровью и не только. Идеально для снятия стресса и неформального общения коллег.',
    features: ['Организация массового сплава', 'Командные испытания', 'Сплочения команды'],
  },
  {
    id: '02',
    title: 'Ретриты и Практики',
    target: 'Для мастеров и студий',
    capacity: '10 — 30 человек',
    icon: Compass,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    desc: 'Это микс ваших знаний и наших умений в природе-терапии. Идеально для форматов йога, психология, медитации, трансформационных игр. Наша роль может быть разной, надо обсуждать.',
    features: ['Тихие, уединенные локации', 'Вегетарианское/диетическое меню', 'Полная тишина от организаторов'],
  },
  {
    id: '03',
    title: 'Стратсессии (Топ-менеджмент)',
    target: 'Для руководителей',
    capacity: '5 — 15 человек',
    icon: Mountain,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    desc: 'Формат для узкого круга. Погружение в бизнес-процессы вдали от городской суеты. Тишина, природа и фокус на стратегических задачах.',
    features: ['Закрытые локации в горах/лесу', 'Индивидуальные сплавы на 2/3 дня'],
  },
];

// Каждая карточка наблюдает себя отдельно — анимация запускается
// когда конкретная карточка входит в viewport, а не все сразу.
function FormatCard({ format, index }: { format: typeof FORMATS[number]; index: number }) {
  const { ref, inView } = useInView();
  const Icon = format.icon;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${index * 100}ms` : '0ms' }}
      className={cn(
        'flex flex-col lg:flex-row gap-8 lg:gap-12 p-8 md:p-10 bg-slate-900/40 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 ease-out group',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
    >
      {/* Левая колонка: Цифра и Иконка */}
      <div className="shrink-0 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-6 lg:w-48">
        <div className="text-6xl md:text-7xl font-black text-slate-800 group-hover:text-indigo-900/50 transition-colors leading-none">
          {format.id}
        </div>
        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center border', format.bg, format.border, format.color)}>
          <Icon size={32} strokeWidth={1.5} />
        </div>
      </div>

      {/* Центральная колонка: Описание */}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={cn('px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border', format.bg, format.border, format.color)}>
            {format.target}
          </span>
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
            {format.capacity}
          </span>
        </div>
        <h3 className="text-2xl md:text-4xl font-black text-white mb-6 tracking-tight">
          {format.title}
        </h3>
        <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">
          {format.desc}
        </p>
      </div>

      {/* Правая колонка: Чеклист */}
      <div className="lg:w-72 shrink-0 flex flex-col justify-center">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Что входит в базу:</div>
        <ul className="space-y-3">
          {format.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Check size={12} className="text-indigo-400" />
              </div>
              <span className="text-sm text-slate-300 font-medium leading-tight">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function OrgFormats() {
  const { ref: refHeader, inView: headerInView } = useInView();

  return (
    <section className="py-12 md:py-20 bg-slate-950 border-t border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">

        <div
          ref={refHeader}
          className={cn(
            'mb-10 md:mb-12 transition-all duration-500 ease-out',
            headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          )}
        >
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">
            Что мы можем предложить <span className="text-indigo-500">Вам</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Вы можете выбрать любой наш тур или формат (SUP, байдарки, местную программу или тур в горы) или мы создадим тур или мероприятие под ваш запрос: от шумного сплава до тихой медитации.
          </p>
        </div>

        <div className="flex flex-col gap-8 md:gap-12">
          {FORMATS.map((format, idx) => (
            <FormatCard key={format.id} format={format} index={idx} />
          ))}
        </div>

      </div>
    </section>
  );
}