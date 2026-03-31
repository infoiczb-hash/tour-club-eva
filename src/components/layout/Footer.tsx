import Link from 'next/link';
import { Instagram, Send, Mail, Phone, MessageCircle } from "lucide-react";
import ClientButtons from '@/features/footer/ClientButtons';
import SocialLink from '@/features/footer/SocialLink';
import AnimatedHeart from '@/features/footer/AnimatedHeart';

export const Footer = () => {
  // 1. Единый стиль для ссылок с плавной анимацией подчеркивания слева направо
  const linkStyles = "relative w-fit text-white hover:text-teal-400 font-bold text-sm transition-colors after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-teal-400 after:transition-all after:duration-300";

  return (
    <footer role="contentinfo" className="relative bg-[#0B1120] border-t border-white/5 overflow-hidden">
      
      {/* ФОН */}
      <div className="absolute inset-0 pointer-events-none z-0">
         <div className="absolute bottom-0 left-0 w-full h-[200px] bg-teal-900/10 blur-[80px]" />
      </div>

      {/* КОНТЕНТ */}
      <div className="container relative z-10 mx-auto px-5 pt-12 pb-[calc(20px+env(safe-area-inset-bottom))]">
        
        {/* Основная сетка: разделили на 3 равные колонки для баланса (4+4+4 = 12) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12">
          
          {/* БЛОК 1: БРЕНД И КОНТАКТЫ */}
          <div className="md:col-span-4 flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                Турклуб «Эва»
              </h2>
              <p className="text-slate-300 text-sm leading-snug max-w-sm">
                Создаем маршруты, в которые хочется возвращаться. <br className="hidden md:block"/>
                Походы, где важны не километры, а люди рядом.
              </p>
            </div>

            {/* Контакты */}
            <div className="flex flex-col gap-3 mt-1">
              <a href="tel:+37377770141" className="inline-flex items-center gap-3 text-white hover:text-teal-400 transition-colors group">
                <Phone size={18} className="text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-bold tracking-tight">+373 777 70141</span>
              </a>

              <a href="mailto:info@evatur.club" className="inline-flex items-center gap-3 text-white hover:text-teal-400 transition-colors text-sm font-medium group">
                 <Mail size={18} className="text-slate-400 group-hover:text-teal-400 shrink-0 transition-colors" />
                 <span>info@evatur.club</span>
              </a>
            </div>

            {/* Соцсети */}
            <div className="flex gap-3 mt-1">
              <SocialLink href="https://instagram.com/evaturclub" icon={<Instagram size={18} />} label="Instagram" aria-label="Наш Instagram" />
              <SocialLink href="https://t.me/evaturclub" icon={<Send size={18} />} label="Telegram" aria-label="Наш Telegram"/>
                          </div>
          </div>

          {/* БЛОК 2: НАВИГАЦИЯ (2 четкие колонки по 3 ссылки) */}
          <div className="md:col-span-4 flex justify-start md:justify-center">
             <nav className="flex gap-x-12 gap-y-5">
                
                {/* Левая колонка */}
                <div className="flex flex-col gap-5">
                    <Link href="/offer" className={linkStyles}>
                        Оферта
                    </Link> 
                    <Link href="/faq" className={linkStyles}>
                        FAQ    
                    </Link>
                    <Link href="/privacy" className={linkStyles}>
                        Политика конфиденциальности 
                    </Link>
                </div>

                {/* Правая колонка */}
                <div className="flex flex-col gap-5">
                    <Link href="/directions" className={linkStyles}>
                        Направления Клуба
                    </Link>
                    <Link href="/fun" className={linkStyles}>
                        Тесты и квизы
                    </Link>
                    <Link href="/blog" className={linkStyles}>
                        Блог клуба
                    </Link>
                </div>

             </nav>
          </div>

          {/* БЛОК 3: CTA (Кнопки) */}
          <div className="md:col-span-4 flex flex-col items-start md:items-end justify-start">
             {/* 3. Жестко выстраиваем кнопки по горизонтали */}
             <div className="flex flex-row flex-wrap items-center gap-3 w-full md:w-auto">
                <ClientButtons />
             </div>
          </div>

        </div>

        {/* НИЖНИЙ КОЛОНТИТУЛ */}
        <div className="border-t border-white/10 pt-5 flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">
           <p className="text-[12px] text-white/80 font-bold uppercase tracking-wider">
             © {new Date().getFullYear()} Турклуб «Эва» • ИП САНДУ Р.С.
           </p>
           
           <p className="text-[14px] text-white/80 font-normal flex items-center justify-center gap-1.5">
             <span>Сделано с</span>
             <AnimatedHeart />
             <span>для людей, любящих природу</span>
           </p>
        </div>
      </div>
    </footer>
  );
};