// src/app/guides/[slug]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { cn } from '@/lib/utils'; 
import { 
  Instagram, Send, MapPin, Sparkles, 
  Zap, Flame, Utensils, Activity, Heart, Compass, ArrowLeft, Quote, Trophy
} from 'lucide-react';
import type { ElementType } from 'react';

import GuideContactButton from '@/features/guides/components/GuideContactButton';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

export const revalidate = 300;

export async function generateStaticParams() {
  const guides = await prisma.guide.findMany({
    select: { slug: true },
    where: { isActive: true }
  });
  
  return guides
    .filter(guide => guide.slug) 
    .map((guide) => ({
      slug: guide.slug as string,
    }));
}

const ICON_MAP: Record<string, { icon: ElementType, color: string }> = {
  Zap:      { icon: Zap,      color: "text-amber-400"  },
  Utensils: { icon: Utensils, color: "text-rose-400"   },
  Sparkles: { icon: Sparkles, color: "text-purple-400" },
  Flame:    { icon: Flame,    color: "text-teal-400"   },
  Activity: { icon: Activity, color: "text-sky-400"    },
  Heart:    { icon: Heart,    color: "text-red-500"    },
  Compass:  { icon: Compass,  color: "text-emerald-400"},
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; 
  const guide = await prisma.guide.findUnique({ where: { slug } });
  
  if (!guide) return { title: 'Гид не найден' };

  const description = guide.bio || `Отправляйтесь в туры с ${guide.name}. Опыт: ${guide.experience || 'много лет'}. Узнайте расписание и биографию.`;
  const url = `${BASE_URL}/guides/${guide.slug}`;
  
  let imageUrl = guide.actionImage || guide.image || `${BASE_URL}/og-default.jpg`;
  if (imageUrl.startsWith('/')) imageUrl = `${BASE_URL}${imageUrl}`;

  return {
    title: `Гид ${guide.name} — туры, походы, биография | Турклуб Эва`,
    description,
    keywords: [
      `гид ${guide.name}`, 
      'гиды турклуб Эва', 
      'походы Приднестровье инструктор', 
      'организатор туров', 
      'активный отдых'
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${guide.name} — ${guide.role} клуба «Эва»`,
      description,
      url,
      siteName: 'Турклуб «Эва»',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `Гид ${guide.name}` }],
      type: 'profile',
      locale: 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${guide.name} — ${guide.role}`,
      description,
      images: [imageUrl],
    }
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params; 

  const guide = await prisma.guide.findUnique({
    where: { slug, isActive: true }
  });

  if (!guide) notFound(); 

  let stats: any[] = [];
  if (guide.stats) {
    stats = typeof guide.stats === 'string' ? JSON.parse(guide.stats) : (guide.stats as any[]);
  }

  // Защита массивов от null
  const tags        = Array.isArray(guide.tags)         ? guide.tags         : [];
  const quotes      = Array.isArray(guide.quotes)       ? guide.quotes       : [];
  const achievements = Array.isArray(guide.achievements) ? guide.achievements : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: guide.name,
    jobTitle: guide.role,
    description: guide.bio,
    image: guide.actionImage || guide.image,
    url: `${BASE_URL}/guides/${guide.slug}` 
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-teal-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ─── HERO ─── */}
      <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex items-end md:pb-24">
        {guide.actionImage || guide.image ? (
          <Image 
            src={guide.actionImage || guide.image || ''} 
            alt={`Гид ${guide.name}`} 
            fill 
            // FIX 1: убрали opacity-70 → фото не затемнено
            className="object-cover object-top md:object-[center_15%]"
            priority
            fetchPriority="high"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}
        
        {/* FIX 1: ослабили via — верх фото светлый, низ читаемый */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        {/* FIX 2: убрали pb-12 на мобиле чтобы текст не давил фото */}
        <div className="container mx-auto px-4 relative z-10 pt-32 pb-10 md:pb-0">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-8 md:mb-10 text-[11px] md:text-sm font-bold uppercase tracking-widest bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-slate-800"
          >
            <ArrowLeft size={16} /> К списку гидов
          </Link>
          
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500 text-slate-950 mb-5 font-black uppercase tracking-widest text-[10px] md:text-xs shadow-[0_0_20px_rgba(20,184,166,0.4)]">
              {guide.role}
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-4 drop-shadow-2xl">
              {guide.name} 
            </h1>
            
            {guide.experience && (
              <p className="text-teal-400 font-bold text-xs md:text-sm uppercase tracking-widest drop-shadow-md mb-6 md:mb-8">
                Опыт: {guide.experience}
              </p>
            )}

            {guide.bio && (
              <p className="text-[15px] md:text-xl text-slate-300 font-medium leading-relaxed max-w-3xl border-l-2 border-teal-500/50 pl-4 md:pl-6">
                {guide.bio}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── ОСНОВНОЙ КОНТЕНТ ─── */}
      <section className="container mx-auto px-4 pb-24 relative z-10 mt-10 md:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* ЛЕВАЯ КОЛОНКА */}
          <div className="lg:col-span-8 flex flex-col gap-10 md:gap-14">
            
            {/* 1. Теги и Суперсила */}
            {(tags.length > 0 || guide.superpower) && (
              <div className="flex flex-wrap gap-3">
                {guide.superpower && (
                  <span className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[12px] md:text-sm font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-sm">
                    <Sparkles size={16} /> {guide.superpower}
                  </span>
                )}
                {tags.map((tag, idx) => (
                  <span key={idx} className="px-4 py-2.5 bg-slate-900 border border-white/10 text-slate-300 text-[12px] md:text-sm font-bold uppercase tracking-widest rounded-xl shadow-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 2. Шкалы навыков */}
            {stats.length > 0 && (
              <div className="bg-slate-900/50 border border-white/5 p-6 md:p-8 rounded-[2rem]">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 md:mb-8">
                  Навыки и специализация
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 md:gap-y-8">
                  {stats.map((stat: any, i: number) => {
                    const mapping = ICON_MAP[stat.icon] || ICON_MAP['Zap'];
                    const Icon = mapping.icon;
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-end mb-3">
                          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-300">
                            <Icon size={16} className={mapping.color} />
                            <span>{stat.label}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-white">{stat.value}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${stat.value}%` }}
                            className={cn(
                              "h-full rounded-full shadow-[0_0_10px_currentColor]", 
                              "transition-all duration-1000 ease-out", 
                              mapping.color.replace('text-', 'bg-')
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Достижения — REC 5: выводим achievements[] */}
            {achievements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Trophy size={18} className="text-amber-400" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    Достижения
                  </h2>
                </div>
                <ul className="space-y-3">
                  {achievements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300 text-[15px] leading-relaxed">
                      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-teal-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Досье (fullBio) — FIX 3: добавлен заголовок */}
            {guide.fullBio && (
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-6">
                  Досье
                </h2>
                <div className="prose prose-base md:prose-lg prose-invert max-w-none 
                    prose-p:text-slate-300 prose-p:text-[15px] md:prose-p:text-[18px] prose-p:leading-[1.8] prose-p:mb-6 prose-p:mt-0
                    prose-strong:text-white prose-strong:font-bold">
                  <div className="whitespace-pre-wrap">
                    {guide.fullBio}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Цитаты — FIX 4 + REC 6: заголовок + все цитаты */}
            {quotes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Quote size={18} className="text-teal-400" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    Цитаты гида
                  </h2>
                </div>
                <div className="space-y-6">
                  {quotes.map((quote, idx) => (
                    <blockquote
                      key={idx}
                      className="border-l-4 border-teal-500 pl-6 md:pl-8 py-2"
                    >
                      <p className="text-xl md:text-2xl lg:text-3xl font-medium text-white italic leading-tight">
                        «{quote}»
                      </p>
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ПРАВАЯ КОЛОНКА */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8 lg:sticky lg:top-28 self-start mt-8 lg:mt-0">
            
            <div className="bg-slate-900 border-2 border-teal-500/50 p-8 md:p-10 rounded-[2rem] text-center shadow-[0_0_40px_rgba(20,184,166,0.15)] relative">
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto bg-teal-500 text-slate-950 flex items-center justify-center rounded-2xl mb-6 shadow-lg transform -rotate-3">
                  <MapPin size={32} strokeWidth={2} />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4 text-white">
                  В поход с гидом
                </h3>
                <p className="text-[14px] md:text-[15px] text-slate-300 mb-8 leading-relaxed font-medium">
                  Оставьте заявку, и мы подберем маршрут, который поведет {guide.name}.
                </p>
                
                <div className="flex flex-col gap-3">
                  <GuideContactButton guideName={guide.name} />
                  
                  <Link 
                    href="/tour" 
                    className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider text-[12px] md:text-xs flex items-center justify-center gap-2 transition-all border border-white/5"
                  >
                    Смотреть все туры
                  </Link>
                </div>
              </div>
            </div>

            {(guide.instagram || guide.telegram) && (
              <div className="flex justify-center gap-4">
                {guide.instagram && (
                  <a
                    href={guide.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-900 border border-white/10 hover:border-teal-500/50 hover:bg-slate-800 text-slate-400 hover:text-teal-400 transition-all shadow-lg"
                  >
                    <Instagram size={24} />
                  </a>
                )}
                {guide.telegram && (
                  <a
                    href={guide.telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-900 border border-white/10 hover:border-teal-500/50 hover:bg-slate-800 text-slate-400 hover:text-teal-400 transition-all shadow-lg"
                  >
                    <Send size={24} className="ml-[-2px]" />
                  </a>
                )}
              </div>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}