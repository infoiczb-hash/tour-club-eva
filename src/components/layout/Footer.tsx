import Link from 'next/link';
import { Instagram, Send, Mail, Phone, MessageCircle } from "lucide-react";
import ClientButtons from '@/features/footer/ClientButtons';
import SocialLink from '@/features/footer/SocialLink';
import AnimatedHeart from '@/features/footer/AnimatedHeart';

export const Footer = () => {
  return (
    <footer role="contentinfo" className="relative bg-[#0B1120] border-t border-white/5 overflow-hidden">
      
      {/* ФОН */}
      <div className="absolute inset-0 pointer-events-none z-0">
         <div className="absolute bottom-0 left-0 w-full h-[200px] bg-teal-900/10 blur-[80px]" />
      </div>

      {/* КОНТЕНТ */}
      <div className="container relative z-10 mx-auto px-5 pt-8 pb-[calc(20px+env(safe-area-inset-bottom))]">
        
        {/* Основная сетка */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mb-8">
          
          {/* БЛОК 1: БРЕНД И КОНТАКТЫ */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                Турклуб «Эва»
              </h2>
              <p className="text-slate-400 text-xs leading-snug max-w-sm">
                Создаем маршруты, в которые хочется возвращаться. <br className="hidden md:block"/>
                Походы, где важны не километры, а люди рядом.
              </p>
            </div>

            {/* Контакты */}
            <div className="flex flex-col gap-2 mt-1">
              <a href="tel:+37377770141" className="inline-flex items-center gap-3 text-white hover:text-teal-400 transition-colors group">
                <Phone size={18} className="text-teal-400 shrink-0" />
                <span className="text-lg font-bold tracking-tight">+373 777 70141</span>
              </a>

              <a href="mailto:info@evatur.club" className="inline-flex items-center gap-3 text-white hover:text-teal-400 transition-colors text-sm font-medium">
                 <Mail size={18} className="text-slate-400 group-hover:text-white shrink-0" />
                 <span>info@evatur.club</span>
              </a>
            </div>

            {/* Соцсети */}
            <div className="flex gap-3">
              <SocialLink href="https://instagram.com/evaturclub" icon={<Instagram size={18} />} label="Instagram" />
              <SocialLink href="https://t.me/evaturclub" icon={<Send size={18} />} label="Telegram" />
              <SocialLink href="https://wa.me/..." icon={<MessageCircle size={18} />} label="WhatsApp" />
            </div>
          </div>

          {/* БЛОК 2: НАВИГАЦИЯ */}
          <div className="md:col-span-4">
             <nav className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                 <Link href="/offer" className="text-white hover:text-teal-400 font-bold text-sm transition-colors">
                    Оферта
                </Link> 
                <Link href="/fun" className="text-white hover:text-teal-400 font-bold text-sm transition-colors flex items-center gap-1">
                    Фан-сектор 🎲
                </Link>
                               <Link href="/faq" className="text-white hover:text-teal-400 font-bold text-sm transition-colors">
                 FAQ    
                </Link>
                 <Link href="/blog" className="text-white hover:text-teal-400 font-bold text-sm transition-colors">
                    Блог клуба
                </Link>
                <Link href="/directions" className="text-white hover:text-teal-400 font-bold text-sm transition-colors">
                    Направления Клуба
                </Link>
               
                <Link href="/privacy" className="text-white hover:text-teal-400 font-bold text-sm transition-colors col-span-2 md:col-span-1">
                    Политика конфиденциальности 
                </Link>
             </nav>
          </div>

          {/* БЛОК 3: CTA (Кнопки) */}
          <div className="md:col-span-3 flex flex-col items-start md:items-end gap-4 mt-2 md:mt-0">
             <div className="w-full md:w-auto">
                <ClientButtons />
             </div>
          </div>
        </div>

        {/* НИЖНИЙ КОЛОНТИТУЛ (БЕЛЫЙ ТЕКСТ) */}
        <div className="border-t border-white/10 pt-5 flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">
           <p className="text-[12px] text-white font-bold uppercase tracking-wider">
             © {new Date().getFullYear()} Турклуб «Эва» • ИП САНДУ Р.С.
           </p>
           
           <p className="text-[12px] text-white font-normal flex items-center gap-1">
             <span>Сделано с</span>
             <AnimatedHeart />
             <span>для людей, любящих природу</span>
           </p>
        </div>
      </div>
    </footer>
  );
};