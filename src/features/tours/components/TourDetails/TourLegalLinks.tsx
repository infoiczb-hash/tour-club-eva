import React from 'react';
import Link from 'next/link';
import { HelpCircle, FileText, ShieldCheck } from 'lucide-react';

const LEGAL_LINKS = [
  {
    href: '/faq',
    icon: <HelpCircle size={20} />,
    title: 'Вопросы и ответы',
    desc: 'Всё что нужно знать перед поездкой',
  },
  {
    href: '/offer',
    icon: <FileText size={20} />,
    title: 'Договор оферты',
    desc: 'Условия участия в турах клуба',
  },
  {
    href: '/privacy',
    icon: <ShieldCheck size={20} />,
    title: 'Политика конфиденциальности',
    desc: 'Как мы обрабатываем ваши данные',
  },
];

export default function TourLegalLinks() {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
        Правовая информация
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LEGAL_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-white/10 hover:bg-slate-800/60 transition-all duration-200 group"
          >
            <span className="shrink-0 text-slate-400 group-hover:text-slate-300 transition-colors mt-0.5">
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors leading-tight">
                {item.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}