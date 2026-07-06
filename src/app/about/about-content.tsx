'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
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

/* ============================================================
   TrailProgress — сигнатурный элемент страницы.
   Не абстрактная полоска прогресса, а профиль высоты маршрута:
   заполняется тем же градиентом, что и остальной бренд, по мере
   того, как человек «проходит» страницу. Метафора маршрута,
   а не декорация ради декорации.
   ============================================================ */
function TrailProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
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

  // Профиль высоты — ломаная линия, читается как силуэт хребта
  const path = 'M0,10 L6,7 L12,9 L18,3 L26,6 L34,1 L42,5 L50,2 L58,8 L66,4 L74,9 L82,5 L90,7 L100,3';

  return (
    <div
      className="fixed top-0 left-0 w-full h-[4px] md:h-[5px] z-50 bg-slate-950/60 backdrop-blur-sm"
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
        <path d={path} fill="none" stroke="rgb(51 65 85)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <path
          d={path}
          fill="none"
          stroke="url(#trailGradient)"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
          style={{
            clipPath: `inset(0 ${100 - progress * 100}% 0 0)`,
            transition: 'clip-path 80ms linear',
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

/* ============================================================
   Reveal — плавное появление секций при скролле.
   Уважает prefers-reduced-motion: при включённой настройке
   контент просто виден сразу, без transform/opacity-анимации.
   ============================================================ */
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
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
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
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`relative w-full max-w-3xl mx-auto px-6 md:px-4 py-16 md:py-24 ${className}`}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block text-[12px] md:text-xs font-bold tracking-[0.2em] text-teal-400 uppercase mb-4">
      {children}
    </span>
  );
}

const adventures = [
  {
    icon: Mountain,
    title: 'Горы и походы',
    text: 'Шаг за шагом вверх — туда, где становится тише и яснее. Лесные тропы, открытые вершины, утренний туман и вид, ради которого стоило идти.',
  },
  {
    icon: Waves,
    title: 'Байдарки и SUP',
    text: 'Когда дорога превращается в воду, а движение — почти медитация. Вечерние сплавы, закаты на воде, острова и остановки у костра.',
  },
  {
    icon: Users,
    title: 'Детям и семьям',
    text: 'Первый опыт свободы и ответственности на природе — через игру, движение и приключение, в безопасном и живом формате.',
  },
  {
    icon: Brain,
    title: 'Психологические туры',
    text: 'Путешествия, в которых природа становится пространством для внутренней работы. Без давления. Только движение, группа и поддержка.',
  },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-md';

export default function AboutContent() {
  return (
    <main className="min-h-[100svh] bg-slate-950 overflow-hidden">
      <TrailProgress />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-teal-900/10 md:blur-[140px] rounded-full pointer-events-none" />

      {/* ===== HERO ===== */}
      <Section className="pt-32 md:pt-40 pb-20 md:pb-28 text-center flex flex-col items-center" id="hero" labelledBy="hero-heading">
        <div className="animate-hero-subtitle motion-reduce:!opacity-100 inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-full mb-8 shadow-xl">
          <PawPrint className="w-4 h-4 text-teal-400" aria-hidden="true" />
          <span className="text-[12px] md:text-xs font-bold tracking-[0.15em] text-slate-300 uppercase">
            Турклуб «Эва»
          </span>
        </div>

        <h1
          id="hero-heading"
          className="animate-hero-title motion-reduce:!opacity-100 text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-10 leading-none"
        >
          Твой опыт,<br />
          твоя{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
            свобода
          </span>
          ,<br />
          твои люди
        </h1>

        <div className="animate-fade-in-up motion-reduce:!opacity-100 max-w-xl text-base md:text-lg text-slate-300 leading-relaxed space-y-4">
          <p>
            Когда в последний раз вы возвращались домой с ощущением, что этот день
            останется с вами надолго? Не потому что увидели красивое место — а потому
            что прожили день по-настоящему.
          </p>
          <p className="text-white font-semibold">
            Опыт, который вдохновляет. Именно за этим люди приходят в наш ТурКлуб —
            и именно поэтому возвращаются снова.
          </p>
        </div>
      </Section>

      {/* ===== КТО МЫ ===== */}
      <Section id="who-we-are" labelledBy="who-we-are-heading">
        <Reveal>
          <Eyebrow>Кто мы</Eyebrow>
          <h2 id="who-we-are-heading" className="text-3xl md:text-4xl font-black text-white tracking-tight mb-6 leading-tight">
            Не туристическая компания.<br />Сообщество.
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-base md:text-lg">
            <p>
              Для нас каждое приключение — это возможность прожить день, который
              запомнится надолго. Мы верим, что природа меняет людей. Не громкими
              словами, а очень простыми вещами: дорогой, которую проходишь шаг за
              шагом, тишиной леса, гребком весла, поддержкой команды и моментом, когда
              понимаешь: «Я смог».
            </p>
            <p>
              Кто-то приходит впервые — попробовать местный тур, сплав на байдарках
              или SUP. Кто-то возвращается снова и снова. Со временем многие перестают
              быть просто участниками — они становятся друзьями клуба, помогают
              создавать новые маршруты и вдохновляют других сделать первый шаг.
            </p>
            <p className="text-white font-medium">
              Самые ценные открытия происходят не на карте, а внутри человека. А природа —
              лучшее место, чтобы услышать себя.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ===== ПОЧЕМУ ЭВА ===== */}
      <Section className="border-t border-white/5" id="why-eva" labelledBy="why-eva-heading">
        <Reveal>
          <Eyebrow>Почему «Эва»?</Eyebrow>
          <h2 id="why-eva-heading" className="text-3xl md:text-4xl font-black text-white tracking-tight mb-6 leading-tight">
            «Эй, подожди меня!»
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-base md:text-lg">
            <p>
              В советской туристской среде есть короткий оклик — «Эва!». Более громкий
              аналог «Ау». За этими словами — целая философия: в походах и на сплавах
              не побеждает тот, кто идёт быстрее всех.
            </p>
            <p>
              Настоящее путешествие начинается тогда, когда группа становится командой.
              Когда сильный помогает тому, кто устал. Когда никто не остаётся один.
            </p>
            <p className="text-white font-medium">
              Для нас «Эва» — не просто название. Это обещание, что рядом всегда будут
              люди, готовые поддержать, подождать и разделить с вами радость каждого
              пройденного километра.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ===== ЧТО ВЫ ПОЧУВСТВУЕТЕ ===== */}
      <Section className="border-t border-white/5" id="what-you-feel" labelledBy="what-you-feel-heading">
        <Reveal>
          <Eyebrow>Что вы почувствуете</Eyebrow>
          <h2 id="what-you-feel-heading" className="text-3xl md:text-4xl font-black text-white tracking-tight mb-6 leading-tight">
            Больше, чем ожидали
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-base md:text-lg">
            <p>
              Вы замечаете, как постепенно исчезает городская спешка. Как шаг за шагом
              становится легче идти — не только по тропе, но и внутри себя. В какой-то
              момент приходит тишина, которую трудно найти в обычной жизни. Не пустая,
              а наполненная: шумом реки, ветром в лесу, голосами людей рядом.
            </p>
            <p>
              И самое неожиданное — люди рядом перестают быть «группой». Они становятся
              командой, а иногда — друзьями, с которыми хочется идти дальше, даже когда
              маршрут уже закончился.
            </p>
            <p className="text-white font-semibold">
              Мы не обещаем, что будет легко. Но это точно будет живой опыт — после
              которого хочется сказать: «Хочу ещё».
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ===== НАШИ ПРИКЛЮЧЕНИЯ ===== */}
      <Section className="!max-w-4xl border-t border-white/5" id="adventures" labelledBy="adventures-heading">
        <Reveal>
          <div className="text-center mb-12">
            <Eyebrow>Наши приключения</Eyebrow>
            <h2 id="adventures-heading" className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Разные маршруты.<br />Одно ощущение после них.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {adventures.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group p-6 md:p-8 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-md hover:border-teal-500/30 hover:-translate-y-1 transition-[transform,border-color] motion-reduce:hover:-translate-y-0 motion-reduce:transition-colors"
              >
                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 mb-5 group-hover:bg-teal-500/20 transition-colors">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm md:text-[15px] text-slate-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ===== БЕЗОПАСНОСТЬ ===== */}
      <Section className="border-t border-white/5" id="safety" labelledBy="safety-heading">
        <Reveal>
          <div className="inline-flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-teal-400" aria-hidden="true" />
            <Eyebrow>Безопасность и сопровождение</Eyebrow>
          </div>
          <h2 id="safety-heading" className="text-3xl md:text-4xl font-black text-white tracking-tight mb-6 leading-tight">
            Уверенность — не пункт.<br />Основа каждого маршрута.
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-base md:text-lg">
            <p>
              Перед выходом мы всегда проводим подробный инструктаж. На маршруте рядом
              всегда находятся инструкторы — их задача не просто вести группу, а
              постоянно чувствовать её состояние: темп, настроение, усталость каждого
              участника.
            </p>
            <p>
              Мы заранее продумываем маршрут, проверяем локации и готовим альтернативные
              решения. Снаряжение регулярно проверяется и обновляется.
            </p>
            <p className="text-white font-medium">
              Но мы честно проговариваем: мы не создаём «комфортный отдых в городе».
              Иногда будет усталость, дождь или непростая тропа — и именно в эти моменты
              рядом всегда есть команда, которая не даст вам остаться один на один с
              трудностями.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ===== ТАЛИСМАН ===== */}
      <Section className="border-t border-white/5" id="mascot" labelledBy="mascot-heading">
        <Reveal>
          <div className="relative bg-gradient-to-br from-teal-500/10 to-emerald-500/5 border border-teal-500/20 rounded-3xl p-8 md:p-12 overflow-hidden">
            <PawPrint className="absolute -bottom-6 -right-6 w-40 h-40 text-teal-500/10 rotate-12" aria-hidden="true" />
            <div className="relative z-10">
              <Eyebrow>Наш талисман</Eyebrow>
              <h2 id="mascot-heading" className="text-3xl md:text-4xl font-black text-white tracking-tight mb-6 leading-tight">
                Так у нас появилась Эва
              </h2>
              <div className="text-slate-300 leading-relaxed space-y-4 text-base md:text-lg max-w-2xl">
                <p>
                  Во время одного из походов в Строенцких лесах к нашей группе
                  присоединилась собака. Просто появилась на маршруте и пошла вместе с
                  нами, будто всегда была частью команды.
                </p>
                <p>
                  Она прошла весь путь: лесные тропы, подъёмы, привалы и усталость.
                  Никто её не звал, но и она ни разу не отстала. Не искала комфорта. Не
                  просила остановиться. Просто шла рядом — спокойно и уверенно.
                </p>
                <p className="text-white font-medium">
                  С тех пор она живёт с нами и часто выходит на маршруты вместе с
                  группами. Она — часть команды. И если вы однажды встретите её на
                  тропе, скорее всего, вы поймёте, почему она здесь.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ===== ОСНОВАТЕЛЬ ===== */}
      <Section className="border-t border-white/5" id="founder" labelledBy="founder-heading">
        <Reveal>
          <Eyebrow>Основатель клуба</Eyebrow>
          <div className="relative mt-4">
            <Quote className="w-9 h-9 text-teal-500/30 mb-4" aria-hidden="true" />
            <blockquote className="text-lg md:text-2xl text-white font-medium leading-snug space-y-4">
              <p>
                «Иногда всё начинается не с идеи, а с ощущения, которое невозможно
                забыть. Состояния, когда ты идёшь по тропе, устал, но внутри почему-то
                спокойно.
              </p>
              <p>
                Я понял, что дело не в километрах и не в вершинах. Дело в людях и в том,
                что происходит между ними в пути. В горах и на воде невозможно
                спрятаться за привычные роли — там быстро видно, кто ты есть на самом
                деле.
              </p>
              <p className="text-slate-300 text-base md:text-lg font-normal">
                Если ты читаешь это — возможно, тебе просто не хватает одного шага,
                чтобы попробовать. Буду рад пройти этот путь вместе».
              </p>
            </blockquote>
            <p id="founder-heading" className="mt-6 text-teal-400 font-bold uppercase tracking-wider text-sm">
              Роман Санду
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ===== ПРИСОЕДИНИТЬСЯ ===== */}
      <Section className="border-t border-white/5 text-center flex flex-col items-center" id="join" labelledBy="join-heading">
        <Reveal className="flex flex-col items-center">
          <Eyebrow>Присоединиться к «Эве»</Eyebrow>
          <h2 id="join-heading" className="text-3xl md:text-4xl font-black text-white tracking-tight mb-6 leading-tight">
            Внутри уже что-то откликнулось?
          </h2>
          <p className="max-w-lg text-slate-300 leading-relaxed mb-8">
            Здесь всё просто: ты выбираешь маршрут, мы помогаем тебе подготовиться, и
            вместе мы выходим в путь. Не нужно специального опыта — важно только желание
            попробовать и быть частью команды.
          </p>
          <p className="text-white font-semibold mb-10">
            Ты возвращаешься чуть спокойнее, чуть сильнее — с ощущением, что день прожит
            не зря.
          </p>

          <Link
            href="/"
            className={`group inline-flex items-center gap-3 px-8 py-4 bg-teal-500 text-slate-950 font-black uppercase tracking-widest text-sm rounded-xl hover:bg-teal-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(20,184,166,0.2)] mb-14 motion-reduce:hover:scale-100 ${focusRing}`}
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
            <span>Выбрать маршрут</span>
          </Link>

          <div className="w-16 h-px bg-white/10 mb-8" />

          <div className="flex flex-col sm:flex-row gap-4 text-slate-300">
            <a
              href="tel:+37377770141"
              className={`flex items-center gap-2 hover:text-teal-400 transition-colors px-2 py-1 ${focusRing}`}
              aria-label="Позвонить по телефону +373 777 70141"
            >
              <Phone size={16} aria-hidden="true" />
              <span>+373 777 70141</span>
            </a>
            <a
              href="mailto:info@evatur.club"
              className={`flex items-center gap-2 hover:text-teal-400 transition-colors px-2 py-1 ${focusRing}`}
              aria-label="Написать письмо на info@evatur.club"
            >
              <Mail size={16} aria-hidden="true" />
              <span>info@evatur.club</span>
            </a>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}