"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Phone, ArrowRight, Instagram, Send } from "lucide-react";
import { usePathname } from 'next/navigation';
import { useModalStore } from '@/shared/store/useModalStore';

interface NavLink {
  name: string;
  href: string;
}

export default function HeaderClient({ navLinks }: { navLinks: NavLink[] }) {
  // Новые стейты для умного хедера
  const [isVisible, setIsVisible] = useState(true); // Виден ли хедер сейчас
  const [isAtTop, setIsAtTop] = useState(true);     // Находится ли юзер в самом верху (для прозрачности)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openContactModal = useModalStore((state) => state.openContactModal);
  const pathname = usePathname();

  // Оптимизированный слушатель скролла
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // 1. Проверяем, на самом ли мы верху (первые 50px)
          setIsAtTop(currentScrollY < 50);

          // 2. Логика умного скрытия/появления
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Скроллим вниз — прячем хедер
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            // Скроллим вверх — показываем хедер
            setIsVisible(true);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Проверка при монтировании (если юзер обновил страницу где-то в середине)
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Блокировка скролла при открытом меню
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsVisible(true); // Принудительно показываем хедер, если открыли меню
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
          ${!isVisible ? "-translate-y-full" : "translate-y-0"} 
          ${isAtTop
            ? "py-3 md:py-6 bg-gradient-to-b from-slate-950/80 to-transparent border-transparent" // Прозрачный на самом верху (с легким градиентом сверху для читаемости лого)
            : "py-2 md:py-4 bg-slate-950/90 backdrop-blur-md border-b border-white/10 shadow-lg" // Максимально компактный при скролле
          }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">

          {/* ЛОГОТИП */}
          <Link
            href="/"
            className="relative z-50 group"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex flex-col leading-none">
              {/* Уменьшили размер шрифта на мобилках: text-xl вместо text-2xl */}
              <span className="font-black text-xl md:text-2xl tracking-tighter text-white group-hover:text-teal-400 transition-colors">
                ЭВА
              </span>
              <span className="text-[9px] md:text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase group-hover:text-white/80 transition-colors">
                Турклуб
              </span>
            </div>
          </Link>

          {/* ДЕСКТОП МЕНЮ */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* БУРГЕР */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            // Убрали лишние p-2, уменьшили иконку до 26
            className="md:hidden relative z-50 text-white p-1 outline-none"
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

      {/* МОБИЛЬНОЕ МЕНЮ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950 flex flex-col px-6 pt-16 pb-6 h-[100dvh] transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Навигационные ссылки */}
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 py-4">
          {navLinks.map((link, i) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ transitionDelay: `${i * 50}ms` }}
              className={`group flex items-baseline gap-4 text-4xl sm:text-5xl font-black text-white hover:text-teal-400 tracking-tight transition-all duration-300 ${
                isMobileMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
              }`}
            >
              <span className="text-sm sm:text-base font-bold text-slate-700 tracking-widest group-hover:text-teal-500/50 transition-colors">
                0{i + 1}
              </span>
              {link.name}
            </Link>
          ))}
        </div>

        {/* Нижняя часть */}
        <div
          className={`flex-shrink-0 flex flex-col gap-4 transition-all duration-500 delay-300 ${
            isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              openContactModal(undefined, 'TOUR'); 
            }}
            className="w-full py-4 bg-teal-500 text-slate-950 font-bold uppercase tracking-widest text-sm text-center rounded-xl hover:bg-teal-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Связаться с нами
            <ArrowRight size={18} />
          </button>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex flex-col gap-2">
              <a href="tel:+37377770141" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                <Phone size={14} /> +373 777 70141
              </a>
              <a href="mailto:info@evatur.club" className="text-sm text-slate-400 hover:text-white transition-colors">
                info@evatur.club
              </a>
            </div>

            <div className="flex gap-3">
              <a
                href="https://t.me/evaturclub"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-teal-500 hover:border-teal-500 transition-all"
              >
                <Send size={16} className="-ml-0.5" />
              </a>
              <a
                href="https://instagram.com/evaturclub"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-teal-500 hover:border-teal-500 transition-all"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}