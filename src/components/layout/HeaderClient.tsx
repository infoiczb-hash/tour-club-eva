"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, Phone, ArrowRight, Instagram, Send } from "lucide-react"; // 🔥 Добавили иконки
import { cn } from "@/shared/lib/utils"; 

interface NavLink {
  name: string;
  href: string;
}

interface HeaderClientProps {
  navLinks: NavLink[];
}

export default function HeaderClient({ navLinks }: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  // Отслеживаем скролл для эффекта стекла
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > 50 && latest > previous) {
      setIsScrolled(true);
    } else if (latest < 50) {
      setIsScrolled(false);
    }
  });

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "py-4 bg-slate-950/80 backdrop-blur-md border-b border-white/10" 
            : "py-6 bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          
          {/* 1. ЛОГОТИП (Clean Tech) */}
          <Link 
            href="/" 
            className="relative z-50 group"
            onClick={() => setIsMobileMenuOpen(false)} // Закрываем меню при клике на лого
          >
            <div className="flex flex-col leading-none">
              <span className="font-black text-2xl tracking-tighter text-white group-hover:text-teal-400 transition-colors">
                ЭВА
              </span>
              <span className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase group-hover:text-white/80 transition-colors">
                Турклуб
              </span>
            </div>
          </Link>

          {/* 2. ДЕСКТОП МЕНЮ */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* 4. БУРГЕР (Мобильный) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden relative z-50 text-white p-2 outline-none"
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </motion.header>

      {/* 5. МОБИЛЬНОЕ МЕНЮ (Senior Gold Edition ✨) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-40 bg-slate-950/95 flex flex-col justify-between px-6 pb-10 pt-28 h-[100dvh]"
          >
            {/* Основные ссылки */}
            <div className="flex flex-col gap-6 mt-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }} // Выплывают слева, а не снизу
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex items-baseline gap-4 text-4xl sm:text-5xl font-black text-white hover:text-teal-400 tracking-tight transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-700 tracking-widest group-hover:text-teal-500/50 transition-colors">
                      0{i + 1}
                    </span>
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Нижний блок: CTA, Контакты и Соцсети */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-auto flex flex-col gap-6"
            >
              {/* Главная кнопка CTA -> ведет в contactHUB */}
              <Link
                href="/contactHUB" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-4 bg-teal-500 text-slate-950 font-bold uppercase tracking-widest text-sm text-center rounded-xl hover:bg-teal-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Связаться с нами
                <ArrowRight size={18} />
              </Link>

              {/* Утилитарный футер */}
              <div className="flex items-end justify-between border-t border-white/10 pt-6 pb-2">
                <div className="flex flex-col gap-2">
                  <a href="tel:+37377700000" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                    <Phone size={14} /> +373 777 00 000
                  </a>
                  <a href="mailto:info@evatur.club" className="text-sm text-slate-400 hover:text-white transition-colors">
                    info@evatur.club
                  </a>
                </div>
                
                {/* Соцсети */}
                <div className="flex gap-3">
                <a 
                    href="https://t.me/evaturclub" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-teal-500 hover:border-teal-500 transition-all"
                    aria-label="Наш Telegram"
                  >
                    <Send size={16} className="-ml-0.5" />
                  </a>

                  <a 
                    href="https://instagram.com/evaturclub" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-teal-500 hover:border-teal-500 transition-all"
                    aria-label="Наш Instagram"
                  >
                    <Instagram size={16} />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}