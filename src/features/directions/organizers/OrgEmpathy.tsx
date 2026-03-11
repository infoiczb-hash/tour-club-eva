'use client';

import { ShieldCheck, Tent, Utensils } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

// Заменяет <motion.div whileInView ...> — анимация через CSS transition + IntersectionObserver.
// delay передаётся как Tailwind-класс чтобы не тащить inline style.
function FadeIn({
  children,
  delay = 'delay-0',
}: {
  children: React.ReactNode;
  delay?: 'delay-0' | 'delay-100' | 'delay-200' | 'delay-300';
}) {
  const { ref, inView } = useInView({ rootMargin: '-50px', threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        delay,
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
    >
      {children}
    </div>
  );
}

export default function OrgEmpathy() {
  return (
    <section className="py-12 md:py-20 bg-slate-950 relative">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Заголовок-Манифест */}
        <div className="max-w-4xl mx-auto text-center mb-10 md:mb-12">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">
              Когда вы везете группу в наших турах, <br className="hidden md:block" />
              вы должны быть <span className="text-indigo-500">Лидером</span>, а не завхозом.
            </h2>
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-medium">
              Мы знаем, как важно выдохнуть. В ТурКлубе «ЭВА» мы становимся вашими невидимыми помощниками. Мы берем на себя всю головную боль, чтобы вы могли посвятить время людям.
            </p>
          </FadeIn>
        </div>

        {/* 3 Главные боли */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <FadeIn delay="delay-100">
            <div className="p-8 bg-slate-900/60 rounded-[2rem] border border-white/5 h-full hover:border-indigo-500/30 transition-colors">
              <ShieldCheck className="w-12 h-12 text-indigo-400 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-4">Безопасность и Тыл</h3>
              <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                Проверенные маршруты, гиды-инструкторы. Решаем любые (ну почти) форс-мажоры незаметно для группы.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay="delay-200">
            <div className="p-8 bg-slate-900/60 rounded-[2rem] border border-white/5 h-full hover:border-indigo-500/30 transition-colors">
              <Tent className="w-12 h-12 text-emerald-400 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-4">Снаряжение под ключ</h3>
              <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                Вам не нужно искать снаряжение. Мы предоставляем снаряжение для сплавов, туров и для кемпинга. В рамках имеющегося стока.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay="delay-300">
            <div className="p-8 bg-slate-900/60 rounded-[2rem] border border-white/5 h-full hover:border-indigo-500/30 transition-colors">
              <Utensils className="w-12 h-12 text-amber-400 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-4">Полевая Гастрономия</h3>
              <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                Учитываем особенности питания: накормим и веганов, и мясоедов.
              </p>
            </div>
          </FadeIn>
        </div>

      </div>
    </section>
  );
}