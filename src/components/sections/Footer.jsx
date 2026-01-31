import React from 'react';
import { motion } from "framer-motion";
import {
  Instagram,
  MessageCircle,
  Compass,
  ArrowUpRight
} from "lucide-react";

// Меню
const menuItems = [
  { name: "Пешие туры", href: "/tours/hiking" },
  { name: "Сплавы", href: "/tours/rafting" }, // Сократил текст для компактности
  { name: "Восхождения", href: "/tours/mountains" },
  { name: "Детские лагеря", href: "/kids" },
  { name: "Наши гиды", href: "/guides" },
  { name: "Блог", href: "/blog" },
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
    <footer className="relative overflow-hidden bg-[#050807] text-slate-300 border-t border-white/5">
      
      {/* BACKGROUND TEXT (Уменьшили размер и прозрачность, чтобы не давил) */}
      <div className="absolute bottom-[-10px] left-0 right-0 overflow-hidden pointer-events-none select-none z-0">
        <h1 className="text-[12vw] font-condensed font-bold text-white/[0.03] text-center leading-none tracking-tighter">
          EVA CLUB
        </h1>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12"> {/* py-12 вместо py-20 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }} 
          className="grid gap-8 lg:grid-cols-12 items-start" 
        >
          {/* LEFT SIDE: Compact Brand & Actions (7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Header + Desc */}
            <div className="mb-6">
                <h3 className="font-condensed text-3xl uppercase font-bold tracking-tight text-white mb-2">
                Турклуб «Эва»
                </h3>
                <p className="max-w-lg text-slate-400 text-sm leading-relaxed">
                Походы, сплавы и путешествия, где важны не километры, а люди рядом. 
                </p>
            </div>

            {/* Buttons Row (Compact) */}
            <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/start"
                  className="group inline-flex items-center gap-2 rounded-lg
                             bg-teal-600 px-5 py-2.5
                             text-xs font-bold text-white uppercase tracking-wider
                             transition-all hover:bg-teal-500 hover:-translate-y-0.5"
                >
                  <Compass className="h-4 w-4" />
                  <span>Впервые с нами?</span>
                </a>

                <a
                  href="/tours"
                  className="group inline-flex items-center gap-2 rounded-lg
                             border border-white/10 bg-white/5
                             px-5 py-2.5
                             text-xs font-bold text-white uppercase tracking-wider
                             transition-all hover:bg-white/10 hover:border-white/20"
                >
                  Все туры
                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                </a>
            </div>

             {/* Contacts & Socials (Horizontal Layout) */}
             <div className="mt-8 flex flex-wrap items-center gap-8 border-t border-white/5 pt-6">
                <div className="flex flex-col gap-1">
                    <a href="tel:+37377770141" className="text-white/80 hover:text-teal-400 transition-colors font-mono text-xs">
                    +373 777 70141
                    </a>
                    <a href="mailto:info@evatur.club" className="text-white/80 hover:text-teal-400 transition-colors font-mono text-xs">
                    info@evatur.club
                    </a>
                </div>

                <div className="flex gap-2">
                  {socials.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 border border-white/10 text-white/60 transition-all hover:bg-teal-600 hover:text-white hover:border-teal-500"
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
            </div>
          </div>

          {/* RIGHT SIDE: Menu (5 columns) */}
          <div className="lg:col-span-5 lg:flex lg:justify-end">
             <div className="lg:w-auto"> 
                <h4 className="font-condensed text-sm font-bold uppercase tracking-widest text-white/50 mb-4 text-left lg:text-right">
                  Меню
                </h4>
                {/* Grid layout for links to save vertical space */}
                <ul className="grid grid-cols-2 gap-x-8 gap-y-3 lg:text-right">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm text-slate-400 transition-colors hover:text-white hover:underline decoration-teal-500 decoration-2 underline-offset-4">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
             </div>
          </div>

        </motion.div>

        {/* Bottom Copyright (Very compact) */}
        <div className="mt-10 border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] text-white/20 font-mono uppercase">
          <p>© 2026 Турклуб «Эва»</p>
          <p className="text-center md:text-right">
            Сделано с ❤️ для людей, которые любят природу
          </p>
          <p>ИП Санду Р.С.</p>
        </div>
      </div>
    </footer>
  )
}
