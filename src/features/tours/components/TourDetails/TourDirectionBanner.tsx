import React from 'react';
import Link from 'next/link';
import { ArrowRight, Waves, Ship, Mountain, TreePine, Baby, MapPin } from 'lucide-react';

interface DirectionConfig {
  slug: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string; // tailwind color token
}

const DIRECTION_MAP: Record<string, DirectionConfig> = {
  sup: {
    slug: 'sup',
    label: 'SUP-прогулки',
    description: 'Идеальный баланс релакса и активности на сапборде. Узнайте о всех маршрутах, снаряжении и условиях.',
    icon: <Waves size={28} />,
    accent: 'teal',
  },
  kayaking: {
    slug: 'kayaking',
    label: 'Сплавы на байдарках',
    description: 'Перезагрузка на реке: командный дух, новые пейзажи и песни у костра. Все о сплавах — на странице направления.',
    icon: <Ship size={28} />,
    accent: 'blue',
  },
  hiking: {
    slug: 'hiking',
    label: 'Горы и походы',
    description: 'Там, где не ловит связь — появляется возможность услышать себя. Все о горных маршрутах клуба.',
    icon: <Mountain size={28} />,
    accent: 'emerald',
  },
  kids: {
    slug: 'kids',
    label: 'Детские и семейные туры',
    description: 'Вместо экрана — костёр. Походы где ребёнок учится самостоятельности и влюбляется в природу.',
    icon: <Baby size={28} />,
    accent: 'pink',
  },
  local: {
    slug: 'local',
    label: 'Вылазки выходного дня',
    description: 'Перезагрузка за 24 часа без перелётов. Секретные локации рядом с городом — только природа и тишина.',
    icon: <TreePine size={28} />,
    accent: 'lime',
  },
  organizers: {
    slug: 'organizers',
    label: 'Корпоративы и организаторам',
    description: 'Когда вы везёте группу в лес, вы должны быть лидером, а не завхозом. Мы берём рутину на себя.',
    icon: <MapPin size={28} />,
    accent: 'violet',
  },
};

// Accent palettes — только те цвета что есть в tailwind base
const ACCENT_STYLES: Record<string, { border: string; icon: string; btn: string; badge: string }> = {
  teal:    { border: 'border-teal-500/30',   icon: 'text-teal-400',   btn: 'bg-teal-500 hover:bg-teal-400 text-slate-900',   badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  blue:    { border: 'border-blue-500/30',   icon: 'text-blue-400',   btn: 'bg-blue-500 hover:bg-blue-400 text-white',        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  emerald: { border: 'border-emerald-500/30',icon: 'text-emerald-400',btn: 'bg-emerald-500 hover:bg-emerald-400 text-slate-900', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pink:    { border: 'border-pink-500/30',   icon: 'text-pink-400',   btn: 'bg-pink-500 hover:bg-pink-400 text-white',        badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  lime:    { border: 'border-lime-500/30',   icon: 'text-lime-400',   btn: 'bg-lime-500 hover:bg-lime-400 text-slate-900',    badge: 'bg-lime-500/10 text-lime-400 border-lime-500/20' },
  violet:  { border: 'border-violet-500/30', icon: 'text-violet-400', btn: 'bg-violet-500 hover:bg-violet-400 text-white',    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
};

interface TourDirectionBannerProps {
  categorySlug?: string | null;
}

export default function TourDirectionBanner({ categorySlug }: TourDirectionBannerProps) {
  if (!categorySlug) return null;

  const direction = DIRECTION_MAP[categorySlug];
  if (!direction) return null;

  const styles = ACCENT_STYLES[direction.accent] ?? ACCENT_STYLES.teal;

  return (
    <div className={`rounded-2xl border ${styles.border} bg-slate-900/60 backdrop-blur-sm p-6 md:p-8`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">

        {/* Icon */}
        <div className={`shrink-0 w-14 h-14 rounded-2xl bg-slate-800 border ${styles.border} flex items-center justify-center ${styles.icon}`}>
          {direction.icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className={`inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border mb-2 ${styles.badge}`}>
            Направление клуба
          </div>
          <h3 className="text-white font-black text-lg leading-tight mb-1">
            Больше информации о направлении — {direction.label}
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            {direction.description}
          </p>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <Link
            href={`/directions/${direction.slug}`}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-200 ${styles.btn}`}
          >
            Узнать больше
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}