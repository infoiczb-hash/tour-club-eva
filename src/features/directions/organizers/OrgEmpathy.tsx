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
       <div className="max-w-4xl text-left mb-12 md:mb-16">
  <FadeIn>
    <div className="border-l-4 border-indigo-500 pl-5 md:pl-8 py-2">
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4 md:mb-6 leading-[1.05] md:leading-[1]">
        Когда вы везете группу, <br className="hidden md:block" />
        вы должны быть <span className="text-indigo-500">Лидером</span>, <br className="hidden md:block" />
        а не завхозом.
      </h2>
      <p className="text-[15px] md:text-lg text-slate-300 leading-[1.25] md:leading-[1.3] font-medium max-w-3xl">
        Мы знаем, как важно выдохнуть. В ТурКлубе «Эва» мы становимся вашими невидимыми помощниками. Мы берем на себя всю головную боль по логистике и организации, чтобы вы могли полностью посвятить время людям.
      </p>
    </div>
  </FadeIn>
</div>

        {/* 3 Главные боли */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <FadeIn delay="delay-100">
            <div className="p-8 bg-slate-900/60 rounded-[2rem] border border-white/5 h-full hover:border-indigo-500/30 transition-colors">
              <ShieldCheck className="w-12 h-12 text-indigo-400 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-4">Безопасность и Тыл</h3>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                Проверенные маршруты, гиды-инструкторы. Решаем любые (ну почти) форс-мажоры незаметно для группы.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay="delay-200">
            <div className="p-8 bg-slate-900/60 rounded-[2rem] border border-white/5 h-full hover:border-indigo-500/30 transition-colors">
              <Tent className="w-12 h-12 text-emerald-400 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-4">Снаряжение под ключ</h3>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                Вам не нужно искать снаряжение. Мы предоставляем снаряжение для сплавов, туров и для кемпинга. В рамках имеющегося стока.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay="delay-300">
            <div className="p-8 bg-slate-900/60 rounded-[2rem] border border-white/5 h-full hover:border-indigo-500/30 transition-colors">
              <Utensils className="w-12 h-12 text-amber-400 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-4">Полевая Гастрономия</h3>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                Учитываем особенности питания: накормим и веганов, и мясоедов.
              </p>
            </div>
          </FadeIn>
        </div>

      </div>
    </section>
  );
}