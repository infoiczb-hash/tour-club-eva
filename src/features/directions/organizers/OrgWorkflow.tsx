'use client';

import { PhoneCall, FileSpreadsheet, TentTree } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    num: '01',
    title: 'Бриф и Задача',
    icon: PhoneCall,
    desc: 'Вы связываетесь с нами. Мы обсуждаем количество человек, портрет команды, желаемую атмосферу (драйв или релакс) и ваш бюджет. Никаких сложных ТЗ — просто живой разговор.',
    result: 'Понимание целей выезда.',
  },
  {
    num: '02',
    title: 'Концепт и Смета',
    icon: FileSpreadsheet,
    desc: 'В течение 1-2 дней мы присылаем вам варианты маршрута/тура/мероприятия и смету. Согласование сметы, в случае разделения расходов.',
    result: 'Утвержденный план реализации.',
  },
  {
    num: '03',
    title: 'Реализация',
    icon: TentTree,
    desc: 'Мы закупаем продукты (зависит от договоренностей), готовим снаряжение, организуем логистику. В день «Х» вы и ваша команда просто садитесь в автобус и начинаете отдыхать. Завхоз вам больше не нужен.',
    result: '100% готовность с нашей стороны.',
  },
];

function StepCard({ step, index }: { step: typeof STEPS[number]; index: number }) {
  const { ref, inView } = useInView();
  const Icon = step.icon;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${index * 200}ms` : '0ms' }}
      className={cn(
        'relative flex flex-col items-center text-center group transition-all duration-500 ease-out',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
    >
      {/* Иконка-Узел */}
      <div className="w-24 h-24 rounded-full bg-[#020617] border-2 border-indigo-500/20 flex items-center justify-center relative z-10 mb-8 group-hover:border-indigo-500 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all duration-500">
        <Icon size={32} className="text-indigo-400" strokeWidth={1.5} />
        <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-indigo-500 text-white font-black flex items-center justify-center border-4 border-[#020617]">
          {step.num}
        </div>
      </div>

      <h3 className="text-2xl font-black text-white mb-4 tracking-tight group-hover:text-indigo-400 transition-colors">
        {step.title}
      </h3>
      <p className="text-slate-400 leading-relaxed text-sm md:text-base mb-6 font-medium">
        {step.desc}
      </p>

      <div className="mt-auto px-5 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs font-bold uppercase tracking-widest w-full">
        Итог: {step.result}
      </div>
    </div>
  );
}

export default function OrgWorkflow() {
  const { ref: refHeader, inView: headerInView } = useInView();

  return (
    <section className="py-12 md:py-20 bg-[#020617] relative border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">

        <div
          ref={refHeader}
          className={cn(
            'text-center mb-10 md:mb-12 transition-all duration-500 ease-out',
            headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          )}
        >
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">
            Как мы <span className="text-indigo-500">Работаем</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
            Мы ценим ваше время, поэтому согласование проходит максимально быстро.
          </p>
        </div>

        <div className="relative">
          {/* Соединительная линия */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {STEPS.map((step, idx) => (
              <StepCard key={idx} step={step} index={idx} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}