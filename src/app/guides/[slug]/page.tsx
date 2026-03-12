// src/app/guides/[slug]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { cn } from '@/lib/utils'; 
import { 
  Instagram, Send, MapPin, Sparkles, 
  Zap, Flame, Utensils, Activity, Heart, Compass, ArrowLeft 
} from 'lucide-react';
import type { ElementType } from 'react';

import GuideContactButton from '@/features/guides/components/GuideContactButton';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

export const revalidate = 60;

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
  Zap: { icon: Zap, color: "text-amber-400" },
  Utensils: { icon: Utensils, color: "text-rose-400" },
  Sparkles: { icon: Sparkles, color: "text-purple-400" },
  Flame: { icon: Flame, color: "text-teal-400" },
  Activity: { icon: Activity, color: "text-sky-400" },
  Heart: { icon: Heart, color: "text-red-500" },
  Compass: { icon: Compass, color: "text-emerald-400" },
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
    description: description,
    keywords: [
      `гид ${guide.name}`, 
      'гиды турклуб Эва', 
      'походы Приднестровье инструктор', 
      'организатор туров', 
      'активный отдых'
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${guide.name} — ${guide.role} клуба «Эва»`,
      description: description,
      url: url,
      siteName: 'Турклуб «Эва»',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Гид ${guide.name}`,
        }
      ],
      type: 'profile',
      locale: 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${guide.name} — ${guide.role}`,
      description: description,
      images: [imageUrl],
    }
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params; 

  const guide = await prisma.guide.findUnique({
    where: { slug: slug, isActive: true }
  });

  if (!guide) notFound(); 

  let stats: any[] = [];
  if (guide.stats) {
    stats = typeof guide.stats === 'string' ? JSON.parse(guide.stats) : guide.stats;
  }

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

      {/* --- HERO СЕКЦИЯ --- */}
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-end pb-12 md:pb-24">
        {guide.actionImage || guide.image ? (
          <Image 
            src={guide.actionImage || guide.image || ''} 
            alt={`Гид ${guide.name}`} 
            fill 
            className="object-cover opacity-60"
            priority
            fetchPriority="high"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <Link href="/guides" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 hover:bg-slate-800">
            <ArrowLeft size={16} /> К списку гидов
          </Link>
          
          <div className="flex flex-col md:flex-row gap-4 md:items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500 text-slate-950 mb-4 font-black uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(20,184,166,0.4)]">
                {guide.role}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6 drop-shadow-lg">
                {guide.name} 
              </h1>
              {guide.experience && (
                <p className="text-teal-400 font-mono text-sm md:text-base uppercase tracking-widest drop-shadow-md">
                  Опыт: {guide.experience}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- КОНТЕНТ --- */}
      <section className="container mx-auto px-4 pb-24 relative z-10 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* ЛЕВАЯ КОЛОНКА */}
          <div className="lg:col-span-8 space-y-12">
            
            {guide.quotes && guide.quotes.length > 0 && (
              <div className="border-l-4 border-teal-500 pl-6 py-2 bg-slate-900/30 rounded-r-2xl p-4">
                <p className="text-2xl md:text-3xl font-medium text-white italic leading-snug">
                  «{guide.quotes[0]}»
                </p>
              </div>
            )}

            <div className="prose prose-base md:prose-lg prose-invert max-w-none 
                prose-p:text-slate-300 prose-p:text-[16px] md:prose-p:text-[18px] prose-p:leading-[1.8] prose-p:mb-8 prose-p:mt-0
                prose-strong:text-white prose-strong:font-bold">
              <h2 className="text-xl font-bold uppercase tracking-widest text-slate-500 mb-6 not-prose">Биография</h2>
              <div className="whitespace-pre-wrap">
                {guide.fullBio || guide.bio || 'Этот гид пока не написал свою историю, но он точно профессионал!'}
              </div>
            </div>

            {(guide.tags?.length > 0 || guide.superpower) && (
              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-500 mb-6">Особенности</h2>
                <div className="flex flex-wrap gap-3">
                  {guide.superpower && (
                    <span className="px-4 py-2 bg-teal-950/50 border border-teal-500/30 text-teal-400 text-sm font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-sm">
                      <Sparkles size={16} /> {guide.superpower}
                    </span>
                  )}
                  {guide.tags.map((tag, idx) => (
                    <span key={idx} className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm font-bold uppercase tracking-widest rounded-xl shadow-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ПРАВАЯ КОЛОНКА */}
          <div className="lg:col-span-4 space-y-8">
            
            {stats.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Навыки гида</h3>
                <div className="space-y-6">
                  {stats.map((stat: any, i: number) => {
                    const mapping = ICON_MAP[stat.icon] || ICON_MAP['Zap'];
                    const Icon = mapping.icon;
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-end mb-2">
                          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-300">
                            <Icon size={14} className={mapping.color} />
                            <span>{stat.label}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-white">{stat.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
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

            <div className="bg-gradient-to-br from-teal-900/40 to-slate-900 border border-teal-500/20 p-8 rounded-[2rem] text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center rounded-2xl mb-4 shadow-lg">
                    <MapPin size={32} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2">В поход с гидом</h3>
                  <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    Оставьте заявку, и мы подберем маршрут, который поведет {guide.name}.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <GuideContactButton guideName={guide.name} />
                    
                    <Link 
                      href="/tour" 
                      className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all border border-white/10"
                    >
                      Или смотреть все туры
                    </Link>
                  </div>
              </div>
            </div>

            {(guide.instagram || guide.telegram) && (
              <div className="flex justify-center gap-4">
                {guide.instagram && (
                  <a href={guide.instagram} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 hover:border-teal-500/50 text-slate-400 hover:text-teal-400 transition-all shadow-lg">
                    <Instagram size={20} />
                  </a>
                )}
                {guide.telegram && (
                  <a href={guide.telegram} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 hover:border-teal-500/50 text-slate-400 hover:text-teal-400 transition-all shadow-lg">
                    <Send size={20} />
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