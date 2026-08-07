'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  PawPrint,
  Mountain,
  Waves,
  Users,
  Brain,
  ShieldCheck,
  Quote,
  Phone,
  Mail,
} from 'lucide-react';

function TrailProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? window.scrollY / scrollable : 0;
      setProgress(Math.min(1, Math.max(0, pct)));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const path = 'M0,10 L6,7 L12,9 L18,3 L26,6 L34,1 L42,5 L50,2 L58,8 L66,4 L74,9 L82,5 L90,7 L100,3';

  return (
    <div
      className="fixed top-0 left-0 w-full h-[4px] md:h-[5px] z-50 bg-slate-950/70 backdrop-blur-md"
      role="progressbar"
      aria-label="Прогресс прочтения страницы"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <svg
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        className="w-full h-full"
        aria-hidden="true"
      >
        <path d={path} fill="none" stroke="rgb(51 65 85)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        <path
          d={path}
          fill="none"
          stroke="url(#trailGradient)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: '100',
            strokeDashoffset: `${100 - progress * 100}`,
            transition: 'stroke-dashoffset 80ms linear',
          }}
        />
        <defs>
          <linearGradient id="trailGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function Section({
  children,
  className = '',
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`relative w-full max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-20 ${className}`}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block text-xs font-bold tracking-[0.125em] text-teal-400 uppercase mb-3">
      {children}
    </span>
  );
}

const adventures = [
  {
    icon: Mountain,
    title: 'Горы и походы',
    text: 'Шаг за шагом вверх — туда, где становится тише и яснее. Лесные тропы, открытые вершины и вид, ради которого стоит идти.',
  },
  {
    icon: Waves,
    title: 'Байдарки и SUP',
    text: 'Когда дорога превращается в воду, а движение — в медитацию. Закаты, острова, шум воды и всплеска весла.',
  },
  {
    icon: Users,
    title: 'Детям и семьям',
    text: 'Первый настоящий опыт свободы и ответственности через игру, движение и поддержку.',
  },
  {
    icon: Brain,
    title: 'Психологические местные туры',
    text: 'Путешествия, где природа становится пространством для внутренней работы и перезагрузки.',
  },
];

export default function AboutContent() {
  return (
    <main className="min-h-[100svh] bg-slate-950 overflow-hidden">
      <TrailProgress />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] bg-teal-900/10 rounded-full pointer-events-none blur-[120px]" />

      {/* HERO */}
      <Section className="pt-32 md:pt-40 pb-12 md:pb-16 text-center" id="hero">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-full mb-8">
            <PawPrint className="w-4 h-4 text-teal-400" aria-hidden="true" />
            <span className="text-xs font-bold tracking-[0.2em] text-slate-300 uppercase">Турклуб «Эва»</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-[5.2rem] font-black text-white tracking-tighter leading-none mb-10">
            Твой опыт,<br />
            твоя{' '}
            <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              свобода
            </span>
          </h1>

          <div className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 leading-relaxed space-y-6">
            <p>
              Когда в последний раз ты возвращался домой с ощущением, что этот день останется с тобой навсегда? 
              Не потому, что увидел красивое место, а потому что прожил его по-настоящему.
            </p>
            <p className="text-white font-medium">
              Именно за таким опытом люди приходят в ТК «Эву» — и именно поэтому возвращаются снова.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* КТО МЫ */}
      <Section id="who-we-are" className="border-t border-white/5">
        <Reveal>
          <Eyebrow>Кто мы</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-8">
            Не туристическая компания.<br />Мы — сообщество.
          </h2>
          <div className="prose prose-lg prose-invert max-w-none text-slate-300 space-y-6">
            <p>
              Для нас каждое приключение — это возможность прожить день, который запомнится надолго. 
              Мы верим, что природа меняет людей. Не громкими словами, а простыми вещами: дорогой, тишиной леса, 
              гребком весла, поддержкой команды и моментом, когда понимаешь: «Я смог».
            </p>
            <p className="text-white">
              Со временем многие перестают быть просто участниками. Они становятся частью сообщества «Эва» — 
              помогают создавать новые маршруты и вдохновляют других сделать первый шаг.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ПОЧЕМУ ЭВА */}
      <Section id="why-eva" className="border-t border-white/5">
        <Reveal>
          <Eyebrow>Почему «Эва»?</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-8">
            «Эй, подожди меня!»
          </h2>
          <div className="prose prose-lg prose-invert max-w-none text-slate-300 space-y-6">
            <p>
              В совесткой туристской среде есть короткий оклик — «Эва!». Это более громкий аналог «Ау» (можете проверить прямо сейчас) и очень важная просьба: 
              «Эй, подожди меня!». За этими словами — целая философия. В походах не побеждает тот, кто быстрее всех. 
              Настоящее путешествие начинается, когда группа становится командой.
            </p>
            <p className="text-white font-medium">
              «Эва» — это обещание, что рядом всегда будут люди, готовые поддержать, подождать и разделить радость каждого пройденного километра.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ПРИКЛЮЧЕНИЯ */}
      <Section id="adventures" className="!max-w-4xl border-t border-white/5">
        <Reveal>
          <div className="text-center mb-10">
            <Eyebrow>Наши приключения</Eyebrow>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Разные маршруты.<br />Одно ощущение после них.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {adventures.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group p-8 bg-slate-900/60 border border-white/10 rounded-3xl hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-500"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* БЕЗОПАСНОСТЬ */}
      <Section id="safety" className="border-t border-white/5">
        <Reveal>
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-teal-400" aria-hidden="true" />
            <Eyebrow>Безопасность и сопровождение</Eyebrow>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-8">
            Уверенность — основа каждого маршрута.
          </h2>
          <div className="prose prose-lg prose-invert max-w-none text-slate-300 space-y-6">
            <p>
              Перед выходом — инструктаж. На маршруте рядом всегда инструкторы, 
              которые чувствуют состояние группы и каждого участника.
            </p>
            <p className="text-white">
              Мы не создаём «комфортный отдых в городе». Иногда будет усталость, дождь или сложная тропа. 
              Но именно в эти моменты рядом команда, которая не даст остаться один на один с трудностями.
            </p>
          </div>
        </Reveal>
      </Section>

   {/* ТАЛИСМАН */}
<Section id="mascot" className="border-t border-white/5">
  <Reveal>
    <div className="relative bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 rounded-3xl p-10 md:p-16 overflow-hidden">
      <PawPrint className="absolute -bottom-10 -right-10 w-64 h-64 text-teal-500/10 rotate-12" aria-hidden="true" />
      
      <div className="relative z-10 max-w-2xl">
        <Eyebrow>Наш талисман</Eyebrow>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-8">
          Так у нас появилась Эва
        </h2>
        
        <div className="space-y-6 text-lg text-slate-300">
          <p>
            Во время одного из походов в Строенцких лесах к нашей группе просто присоединилась собака. 
            Она появилась на маршруте и пошла вместе с нами, будто всегда была частью команды.
          </p>
          <p>
            Она прошла весь путь: лесные тропы, подъёмы, привалы и усталость. Никто её не звал, 
            но она ни разу не отстала. Не искала комфорта, не просила остановиться — просто шла рядом, 
            спокойно и уверенно.
          </p>
          <p>
            К концу маршрута стало понятно, что это уже не случайность. Так у нас появилась Эва.
          </p>
          <p className="text-white">
            С тех пор она живёт с нами и часто выходит на маршруты вместе с группами. 
            Где-то идёт впереди, где-то держится рядом, а где-то просто лежит на привале и наблюдает 
            за людьми, которые только начинают свой путь.
          </p>
          <p>
            Для нас она стала напоминанием о самом простом и важном: 
            на природе не нужно лишнего — нужно просто идти вместе.
          </p>
          <p className="text-white font-medium">
            Эва — не «талисман» в формальном смысле. Она — полноценная часть команды. 
            Тихая, внимательная и удивительно точная в том, когда просто нужно быть рядом.
          </p>
          <p>
            И если вы однажды встретите её на маршруте — скорее всего, вы сразу поймёте, 
            почему она здесь.
          </p>
        </div>
      </div>
    </div>
  </Reveal>
</Section>

      {/* ОСНОВАТЕЛЬ + CTA */}
      <Section id="join" className="border-t border-white/5 text-center">
        <Reveal>
          <Quote className="w-10 h-10 text-teal-500/30 mx-auto mb-6" aria-hidden="true" />
          
          <blockquote className="text-2xl md:text-3xl text-white font-medium leading-tight max-w-3xl mx-auto mb-10">
            «Иногда всё начинается не с идеи, а с ощущения... Дело не в километрах. Дело в людях и в том, что происходит между ними в пути.»
          </blockquote>

          <p className="text-teal-400 font-bold uppercase tracking-widest mb-12">Роман Санду, основатель</p>

          <div className="space-y-8">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-widest text-sm rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-teal-500/20"
            >
              Выбрать маршрут
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="flex flex-col sm:flex-row gap-6 justify-center text-slate-400">
              <a href="tel:+37377770141" className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                <Phone size={18} /> +373 777 701 41
              </a>
              <a href="mailto:info@evatur.club" className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                <Mail size={18} /> info@evatur.club
              </a>
            </div>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}