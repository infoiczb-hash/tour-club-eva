"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Phone, ArrowRight, Instagram, Send, User } from "lucide-react";
import { usePathname } from 'next/navigation';
import { useModalStore } from '@/shared/store/useModalStore';

interface NavLink {
  name: string;
  href: string;
}

interface UserProfile {
  name: string | null;
  phone: string | null;
}

export default function HeaderClient({ navLinks, user }: { navLinks: NavLink[], user: UserProfile | null }) {
  const [isVisible, setIsVisible] = useState(true); 
  const [isAtTop, setIsAtTop] = useState(true);     
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openContactModal = useModalStore((state) => state.openContactModal);
  const pathname = usePathname();

  // Генерируем инициалы для аватарки
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : <User size={16} />;

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          setIsAtTop(currentScrollY < 50);

          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            setIsVisible(true);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsVisible(true); 
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
            ? "py-3 md:py-6 bg-gradient-to-b from-slate-950/80 to-transparent border-transparent" 
            : "py-2 md:py-4 bg-slate-950/90 backdrop-blur-md border-b border-white/10 shadow-lg" 
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
              <span className="font-black text-xl md:text-2xl tracking-tighter text-white group-hover:text-teal-400 transition-colors">
                ЭВА
              </span>
              <span className="text-[9px] md:text-[12px] font-bold tracking-[0.3em] text-white/50 uppercase group-hover:text-white/80 transition-colors">
                Турклуб
              </span>
            </div>
          </Link>

          {/* ДЕСКТОП МЕНЮ */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-8">
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

            {/* Разделитель и Блок пользователя */}
            <div className="w-px h-6 bg-white/10" />

            {user ? (
               <Link href="/account" className="flex items-center gap-2.5 group">
                 <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors text-[12px] font-black">
                    {initials}
                 </div>
                 <span className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">Кабинет</span>
               </Link>
            ) : (
               <Link href="/login" className="text-sm font-bold text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5">
                 Войти
               </Link>
            )}
          </div>

          {/* БУРГЕР */}
          <div className="md:hidden flex items-center gap-4 relative z-50">
            {user && (
              <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-[12px] font-black">
                {initials}
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-1 outline-none"
              aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            >
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </header>

      {/* МОБИЛЬНОЕ МЕНЮ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950 flex flex-col px-6 pt-16 pb-6 h-[100dvh] transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
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

        <div
          className={`flex-shrink-0 flex flex-col gap-3 transition-all duration-500 delay-300 ${
            isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Кнопка Личного Кабинета для мобильных */}
          <Link
            href={user ? "/account" : "/login"}
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full py-4 bg-slate-900 border border-white/5 text-white font-bold uppercase tracking-widest text-sm text-center rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {user ? 'Личный кабинет' : 'Войти в кабинет'}
            <ArrowRight size={18} className="text-slate-300" />
          </Link>

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

          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-1">
            <div className="flex flex-col gap-2">
              <a href="tel:+37377770141" className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                <Phone size={14} /> +373 777 70141
              </a>
              <a href="mailto:info@evatur.club" className="text-sm text-slate-300 hover:text-white transition-colors">
                info@evatur.club
              </a>
            </div>

            <div className="flex gap-3">
              <a href="https://t.me/evaturclub" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-teal-500 hover:border-teal-500 transition-all">
                <Send size={16} className="-ml-0.5" />
              </a>
              <a href="https://instagram.com/evaturclub" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-teal-500 hover:border-teal-500 transition-all">
                <Instagram size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}