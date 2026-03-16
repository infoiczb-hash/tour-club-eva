"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Gamepad2, Backpack, Compass, ArrowRight, Trophy, Sparkles, Shield, Dumbbell, Activity, BookOpen, Brain, Heart, Search, Users, Ghost } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import type { FunTest } from "@prisma/client";
import { useInView } from '@/hooks/useInView';
import { useModalStore } from '@/shared/store/useModalStore';

const MODAL_REGISTRY: Record<string, React.ComponentType<any>> = {
  'fears':         dynamic(() => import("@/features/fun/components/FearDebrief"), { ssr: false }),
  'physical':      dynamic(() => import("@/features/fun/components/PhysicalReadiness"), { ssr: false }),
  'signals':       dynamic(() => import("@/features/fun/components/BodySignals"), { ssr: false }),
  'debrief':       dynamic(() => import("@/features/fun/components/TourDebrief"), { ssr: false }),
  'backpack':      dynamic(() => import("@/features/fun/components/QuizBackpack"), { ssr: false }),
  'survival':      dynamic(() => import("@/features/fun/components/QuizSurvival"), { ssr: false }),
  'totem':         dynamic(() => import("@/features/fun/components/QuizTotem"), { ssr: false }),
  'tourist-type':  dynamic(() => import("@/features/fun/components/QuizTouristType"), { ssr: false }),
  'psych-profile': dynamic(() => import("@/features/fun/components/PsychProfile"), { ssr: false }),
};

const CATEGORY_UI_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  "Психологические тесты": { label: "Психологические тесты", icon: <Brain size={24} />,    color: "purple"  },
  "Поддержка в туре":      { label: "Поддержка в туре",      icon: <Heart size={24} />,    color: "rose"    },
  "Подбор тура":           { label: "Подбор тура",           icon: <Search size={24} />,   color: "blue"    },
  "Какой ты турист?":      { label: "Какой ты турист?",      icon: <Users size={24} />,    color: "emerald" },
  "Юмористические":        { label: "Юмористические",        icon: <Ghost size={24} />,    color: "amber"   },
  "Другое":                { label: "Интерактивы",           icon: <Gamepad2 size={24} />, color: "teal"    },
};

const VISUAL_REGISTRY: Record<string, { color: string; icon: React.ReactNode; badge?: string }> = {
  'fears':        { color: "blue",    icon: <Shield size={24} strokeWidth={2.5} />,   badge: "AI Powered" },
  'physical':     { color: "emerald", icon: <Dumbbell size={24} strokeWidth={2.5} />, badge: "AI Powered" },
  'signals':      { color: "rose",    icon: <Activity size={24} strokeWidth={2.5} />, badge: "AI Powered" },
  'debrief':      { color: "purple",  icon: <BookOpen size={24} strokeWidth={2.5} />, badge: "AI Powered" },
  'tourist-type': { color: "amber",   icon: <Compass size={24} strokeWidth={2.5} />  },
  'backpack':     { color: "orange",  icon: <Backpack size={24} strokeWidth={2.5} />  },
  'default':      { color: "teal",    icon: <Sparkles size={24} strokeWidth={2.5} /> },
};

export default function FunClient({ activeTests }: { activeTests: FunTest[] }) {
  const [activeQuizSlug, setActiveQuizSlug] = useState<string | null>(null);
  const searchParams  = useSearchParams();
  const openContactModal = useModalStore((state) => state.openContactModal);

  useEffect(() => {
    const quizParam = searchParams.get('quiz');
    if (quizParam) setActiveQuizSlug(quizParam);
  }, [searchParams]);

  const handleOldQuizResult = (resultText: string) => {
    setActiveQuizSlug(null);
    setTimeout(() => { openContactModal(resultText, 'TOUR'); }, 400);
  };

  const groupedContent = useMemo(() => {
    const groups: Record<string, FunTest[]> = {};
    activeTests.forEach(test => {
      const cat = test.category || "Другое";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(test);
    });
    return groups;
  }, [activeTests]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 overflow-hidden relative">

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/10 blur-[150px] rounded-full opacity-40" />
        <div className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-teal-900/10 blur-[150px] rounded-full opacity-30" />
      </div>

      <section className="relative pt-32 pb-12 px-4 container mx-auto text-center z-10">
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md">
          <Sparkles size={16} className="text-teal-400" />
          <span className="text-xs font-black uppercase tracking-widest text-teal-300">Психология & Игры</span>
        </div>
        <h1 className="animate-hero-title [animation-delay:100ms] text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.9]">
          Твои <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400">Тесты и квизы</span>
        </h1>
        <p className="animate-fade-in-up [animation-delay:200ms] text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium">
          Узнай какой ты турист, проработай страхи, кто ты в туристической группе и подбери идеальное приключение. Осторожно: вызывает желание уйти в поход!
        </p>
      </section>

      <div className="container mx-auto px-4 pb-24 relative z-10 space-y-16">
        {Object.entries(groupedContent).map(([categoryName, tests], categoryIndex) => {
          const config = CATEGORY_UI_CONFIG[categoryName] || { label: categoryName, icon: <Gamepad2 />, color: "teal" };
          return (
            <CategorySection
              key={categoryName}
              categoryName={categoryName}
              config={config}
              tests={tests}
              categoryIndex={categoryIndex}
              onOpen={setActiveQuizSlug}
            />
          );
        })}
        <CtaBanner />
      </div>

      {Object.entries(MODAL_REGISTRY).map(([slug, ModalComponent]) => {
        if (!ModalComponent || activeQuizSlug !== slug) return null;
        return (
          <ModalComponent
            key={slug}
            isOpen
            open
            onComplete={['backpack', 'survival', 'tourist-type', 'totem'].includes(slug) ? handleOldQuizResult : undefined}
            onClose={() => setActiveQuizSlug(null)}
          />
        );
      })}
    </div>
  );
}

function CategorySection({ categoryName, config, tests, categoryIndex, onOpen }: {
  categoryName: string;
  config: { label: string; icon: React.ReactNode; color: string };
  tests: FunTest[];
  categoryIndex: number;
  onOpen: (slug: string) => void;
}) {
  const { ref: refGrid, inView: gridInView } = useInView();

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4 max-w-6xl mx-auto">
        <div className={clsx("p-3 rounded-2xl bg-white/5 border border-white/10", `text-${config.color}-400`)}>
          {config.icon}
        </div>
        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">
          {config.label}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      <div ref={refGrid} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {tests.map((test, index) => {
          const visual = VISUAL_REGISTRY[test.slug] || VISUAL_REGISTRY['default'];
          return (
            <QuizCard
              key={test.id}
              onClick={() => onOpen(test.slug)}
              image={test.image || ""}
              color={visual.color}
              icon={visual.icon}
              badge={visual.badge}
              title={test.title}
              desc={test.description}
              priority={categoryIndex === 0 && index === 0}
              index={index}
              inView={gridInView}
            />
          );
        })}
      </div>
    </section>
  );
}

function CtaBanner() {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={clsx(
        'max-w-6xl mx-auto bg-gradient-to-r from-teal-900/40 to-slate-900 border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group',
        // ✅ transition-[opacity,transform] вместо transition-all — composited
        'transition-[opacity,transform] duration-700 ease-out',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 hidden md:block blur-[100px] rounded-full pointer-events-none group-hover:bg-teal-500/20 transition-colors duration-500" />
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <h3 className="text-3xl font-black text-white uppercase mb-2 flex flex-col md:flex-row items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center"><Trophy size={20} /></span>
            <span>Готов к практике?</span>
          </h3>
          <p className="text-slate-400 max-w-lg text-lg">Теория — это отлично. Но настоящие ответы ждут тебя на маршруте.</p>
        </div>
        <Link href="/tour" className="px-8 py-4 bg-teal-500 text-slate-950 font-black uppercase tracking-wider rounded-2xl hover:bg-teal-400 hover:scale-105 transition-[background-color,transform] shadow-[0_0_20px_rgba(20,184,166,0.3)] whitespace-nowrap">
          Смотреть все туры
        </Link>
      </div>
    </div>
  );
}

function QuizCard({ onClick, image, color, icon, badge, title, desc, priority, index, inView }: {
  onClick: () => void;
  image: string;
  color: string;
  icon: React.ReactNode;
  badge?: string;
  title: string;
  desc: string;
  priority: boolean;
  index: number;
  inView: boolean;
}) {
  const colors: Record<string, string> = {
    orange:  "bg-orange-500 shadow-orange-500/20 text-orange-400 group-hover:border-orange-500/50",
    blue:    "bg-blue-500 shadow-blue-500/20 text-blue-400 group-hover:border-blue-500/50",
    emerald: "bg-emerald-500 shadow-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/50",
    purple:  "bg-purple-600 shadow-purple-500/30 text-purple-400 group-hover:border-purple-500/50",
    amber:   "bg-amber-500 shadow-amber-500/20 text-amber-400 group-hover:border-amber-500/50",
    rose:    "bg-rose-500 shadow-rose-500/20 text-rose-400 group-hover:border-rose-500/50",
    teal:    "bg-teal-500 shadow-teal-500/20 text-teal-400 group-hover:border-teal-500/50",
  };
  const activeColor = colors[color] || colors.teal;

  return (
    <div
      onClick={onClick}
      style={{ transitionDelay: inView ? `${index * 100}ms` : '0ms' }}
      className={clsx(
        'group relative h-[380px] bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer shadow-2xl',
        // ✅ ИСПРАВЛЕНИЕ: transition-all → composited-only свойства.
        // hover:-translate-y-2 и opacity анимируются на GPU без Layout recalc.
        'transition-[transform,opacity,border-color] duration-500 ease-out hover:-translate-y-2 hover:border-white/10',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      )}
    >
      {image && (
        <Image
          src={image}
          alt={title}
          fill
          // ✅ ИСПРАВЛЕНИЕ LCP: первая карточка первой категории — priority=true.
          // next/image добавит fetchpriority="high" и уберёт loading="lazy".
          // Lighthouse фиксировал «Требуется fetchpriority=high» — это устраняет
          // задержку загрузки LCP-ресурса (было 950 мс).
          priority={priority}
          loading={priority ? undefined : "lazy"}
          // ✅ ИСПРАВЛЕНИЕ sizes: карточки в max-w-6xl (1152px) сетке 3 колонки.
          // Реальная ширина: desktop ≈ 368px, tablet ≈ 50vw, mobile ≈ 92vw.
          // Было: "(max-width: 768px) 100vw, ..." → Cloudinary запрашивал w_750.
          // Стало: точный ceiling 400px → экономия ~25-40% на каждой карточке.
          sizes="(max-width: 768px) 92vw, (max-width: 1024px) 48vw, 400px"
          // ✅ Снижен quality: карточки с grayscale+opacity, артефакты незаметны.
          // Первая (LCP) — 65 для баланса качества. Остальные — 55.
          quality={priority ? 65 : 55}
          className="object-cover opacity-50 grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-transform duration-700"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

      {badge && (
        <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1.5 shadow-lg z-20">
          <Sparkles size={12} className={activeColor.split(" ")[2]} />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">{badge}</span>
        </div>
      )}

      <div className="absolute inset-0 p-8 flex flex-col justify-end z-10 pointer-events-none">
        <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg", activeColor.split(" ").slice(0, 2).join(" "))}>
          {icon}
        </div>
        <h3
          className="text-3xl font-black text-white uppercase mb-3 leading-[0.95] drop-shadow-md"
          dangerouslySetInnerHTML={{ __html: title.replace('\n', '<br/>') }}
        />
        <p className="text-sm text-slate-300 font-medium line-clamp-2 mb-6 leading-relaxed drop-shadow-md">{desc}</p>
        <div className={clsx("flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-[gap] group-hover:gap-4", activeColor.split(" ")[2])}>
          Начать <ArrowRight size={14} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}