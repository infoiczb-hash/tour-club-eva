import Link from "next/link";
import { HelpCircle, FileText, ShieldCheck, ChevronRight } from "lucide-react";

interface LegalNavProps {
  // Передаем текущую страницу, чтобы скрыть её из списка
  currentPage: 'faq' | 'offer' | 'privacy'; 
}

const LEGAL_LINKS = [
  {
    id: 'faq',
    title: 'FAQ',
    description: 'Ответы на частые вопросы',
    href: '/faq',
    icon: HelpCircle,
    iconColor: 'text-teal-400',
    bgLight: 'bg-teal-500/10',
  },
  {
    id: 'offer',
    title: 'Договор Оферты',
    description: 'Правила и условия участия',
    href: '/offer',
    icon: FileText,
    iconColor: 'text-purple-400',
    bgLight: 'bg-purple-500/10',
  },
  {
    id: 'privacy',
    title: 'Политика конфиденциальности',
    description: 'Как мы защищаем ваши данные',
    href: '/privacy',
    icon: ShieldCheck,
    iconColor: 'text-blue-400',
    bgLight: 'bg-blue-500/10',
  }
];

export default function LegalNav({ currentPage }: LegalNavProps) {
  // Фильтруем ссылки: убираем текущую страницу
  const visibleLinks = LEGAL_LINKS.filter(link => link.id !== currentPage);

  return (
    <div className="mt-16 md:mt-24 pt-8 border-t border-white/5">
      <h3 className="text-lg font-black text-white uppercase tracking-wider mb-6 text-center md:text-left">
        Полезная информация
      </h3>
      
      {/* Сетка из двух компактных карточек */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.id} 
              href={link.href}
              className="group flex items-center justify-between p-4 md:p-5 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/5 hover:border-white/20 hover:bg-slate-800/80 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                {/* Иконка */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${link.bgLight} ${link.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} />
                </div>
                
                {/* Текст */}
                <div>
                  <div className="text-white font-bold text-sm md:text-base leading-tight mb-1 group-hover:text-teal-400 transition-colors">
                    {link.title}
                  </div>
                  <div className="text-slate-500 text-xs md:text-sm font-medium">
                    {link.description}
                  </div>
                </div>
              </div>

              {/* Стрелочка (появляется при наведении) */}
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-white/10 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                <ChevronRight size={18} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}