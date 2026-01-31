import React from 'react';
import { motion } from "framer-motion";
import {
  Instagram,
  MessageCircle,
  Mail,
  Phone,
  Compass,
  ArrowUpRight
} from "lucide-react";

// Объединенное меню (Убрали дубли кнопок, оставили суть)
const menuItems = [
  { name: "Пешие туры", href: "/tours/hiking" },
  { name: "Сплавы на байдарках", href: "/tours/rafting" },
  { name: "Горные восхождения", href: "/tours/mountains" },
  { name: "Детские лагеря", href: "/kids" },
  { name: "Наши гиды", href: "/guides" },
  { name: "Блог и истории", href: "/blog" },
];

const socials = [
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://www.instagram.com/evaturclub/",
  },
  {
    name: "Telegram",
    icon: MessageCircle,
    href: "https://t.me/evaturclub",
  },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#050807] text-slate-300">
      
      {/* 1. TOPOGRAPHIC PATTERN BACKGROUND */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415-.828-.828-.828.828-1.415-1.415.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M22.485 0l.83.828-1.415 1.415-.828-.828-.828.828-1.415-1.415.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M0 22.485l.828.83-1.415 1.415-.828-.828-.828.828L-2.83 22.485l.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M0 54.627l.828.83-1.415 1.415-.828-.828-.828.828L-2.83 54.627l.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M54.627 60l.83-.828-1.415-1.415-.828.828-.828-.828-1.415 1.415.828.828-.828.828 1.415 1.415.828-.828.828.828 1.415-1.415-.828-.828M22.485 60l.83-.828-1.415-1.415-.828.828-.828-.828-1.415 1.415.828.828-.828.828 1.415 1.415.828-.828.828.828 1.415-1.415-.828-.828M0 32.485l.828-.83 1.415 1.415-.828.828.828.828-1.415 1.415-.828-.828-.828.828-1.415-1.415.828-.828-.828-.828 1.415-1.415.828.828M0 0l.828-.83 1.415 1.415-.828.828.828.828-1.415 1.415-.828-.828-.828.828-1.415-1.415.828-.828-.828-.828 1.415-1.415.828.828' fill='%2322c55e' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`
           }} 
      />

      {/* 2. GIANT BACKGROUND TEXT */}
      <div className="absolute bottom-[-5%] left-0 right-0 overflow-hidden pointer-events-none select-none z-0">
        <h1 className="text-[18vw] font-condensed font-bold text-white/[0.02] text-center leading-none tracking-tighter">
          EVA CLUB
        </h1>
      </div>

      {/* GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050807] via-transparent to-transparent z-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} 
          className="grid gap-16 md:grid-cols-2 lg:grid-cols-12"
        >
          {/* LEFT SIDE: Brand, CTA, Contacts (Takes 6 columns now) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <h3 className="font-condensed text-4xl uppercase font-bold tracking-tight text-white mb-6">
                Турклуб «Эва»
              </h3>

              <p className="max-w-md text-slate-400 leading-relaxed text-lg font-light">
                Походы, сплавы и путешествия, где важны не километры,
                а люди рядом. Создаём маршруты и сообщество,
                в которое хочется возвращаться.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="/start"
                  className="group relative inline-flex items-center gap-3 rounded-full
                             bg-teal-600 px-8 py-4
                             text-sm font-bold text-white uppercase tracking-wider
                             transition-all duration-300
                             hover:bg-teal-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]
                             hover:-translate-y-1"
                >
                  <Compass className="h-5 w-5 transition-transform group-hover:rotate-45" />
                  <span>Впервые с нами?</span>
                </a>

                <a
                  href="/tours"
                  className="group inline-flex items-center gap-2 rounded-full
                             border border-white/10 bg-white/5
                             px-8 py-4
                             text-sm font-bold text-white uppercase tracking-wider
                             transition-all duration-300
                             hover:border-teal-500/50 hover:bg-white/10"
                >
                  Все туры
                  <ArrowUpRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>

            {/* Contacts & Socials Group */}
            <div className="mt-16 flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-16">
              <div className="space-y-4 border-l-2 border-white/10 pl-6">
                <a href="tel:+37377770141" className="block text-white/80 hover:text-teal-400 transition-colors font-mono text-sm">
                  +373 777 70141
                </a>
                <a href="mailto:info@evatur.club" className="block text-white/80 hover:text-teal-400 transition-colors font-mono text-sm">
                  info@evatur.club
                </a>
              </div>

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">
                   Мы живём здесь
                </p>
                <div className="flex gap-3">
                  {socials.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 transition-all hover:bg-teal-500 hover:text-white hover:border-teal-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/20"
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Single Menu Column (Takes remaining space, aligned right on desktop) */}
          <div className="lg:col-span-6 lg:flex lg:justify-end">
             <div className="lg:w-64"> {/* Fixed width container for better alignment */}
                <h4 className="font-condensed text-lg font-bold uppercase tracking-widest text-white/90 mb-8 border-b border-white/10 pb-4 inline-block pr-12">
                  Меню
                </h4>
                <ul className="space-y-5">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="group flex items-center gap-3 text-base text-slate-400 transition-colors hover:text-white">
                        <span className="h-px w-3 bg-slate-700 transition-all group-hover:w-6 group-hover:bg-teal-500"></span>
                        <span className="uppercase tracking-wide text-sm font-medium">{item.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
             </div>
          </div>

        </motion.div>

        {/* Bottom Copyright */}
        <div className="mt-24 border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30 font-mono uppercase tracking-tight">
          <p>© 2026 Турклуб «Эва»</p>
          <p className="text-center md:text-right text-white/50">
            Сделано с ❤️ для людей, которые любят природу
          </p>
          <p>ИП Санду Р.С.</p>
        </div>
      </div>
    </footer>
  )
}
