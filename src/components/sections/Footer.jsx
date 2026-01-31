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
  { name: "Сплавы", href: "/tours/rafting" }, 
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
      
      {/* BACKGROUND TEXT */}
      <div className="absolute bottom-[-20px] left-0 right-0 overflow-hidden pointer-events-none select-none z-0">
        <h1 className="text-[18vw] font-condensed font-bold text-white/[0.03] text-center leading-none tracking-tighter">
          EVA CLUB
        </h1>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }} 
          className="grid gap-12 lg:grid-cols-12 items-start" 
        >
          {/* LEFT SIDE: Brand & Actions (7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Header + Desc */}
            <div className="mb-10">
                <h3 className="font-condensed text-5xl uppercase font-bold tracking-tight text-white mb-6">
                Турклуб «Эва»
                </h3>
                <p className="max-w-lg text-slate-400 text-lg leading-relaxed"> {/* Увеличили до text-lg */}
                Походы, сплавы и путешествия, где важны не километры, а люди рядом. 
                Создаём маршруты, в которые хочется возвращаться.
                </p>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-wrap items-center gap-4">
                <a
                  href="/start"
                  className="group inline-flex items-center gap-3 rounded-xl
                             bg-teal-600 px-8 py-4
                             text-base font-bold text-white uppercase tracking-wider
                             transition-all hover:bg-teal-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-900/20"
                >
                  <Compass className="h-6 w-6" />
                  <span>Впервые с нами?</span>
                </a>

                <a
                  href="/tours"
                  className="group inline-flex items-center gap-2 rounded-xl
                             border border-white/10 bg-white/5
                             px-8 py-4
                             text-base font-bold text-white uppercase tracking-wider
                             transition-all hover:bg-white/10 hover:border-white/20"
                >
                  Все туры
                  <ArrowUpRight className="h-5 w-5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
            </div>

             {/* Contacts & Socials */}
             <div className="mt-14 flex flex-col sm:flex-row sm:items-center gap-10 border-t border-white/10 pt-10">
                <div className="flex flex-col gap-2">
                    <a href="tel:+37377770141" className="text-white hover:text-teal-400 transition-colors font-mono text-2xl font-medium"> {/* Увеличили до text-2xl */}
                    +373 777 70141
                    </a>
                    <a href="mailto:info@evatur.club" className="text-white/60 hover:text-teal-400 transition-colors font-mono text-lg"> {/* Увеличили до text-lg */}
                    info@evatur.club
                    </a>
                </div>

                <div className="flex gap-3">
                  <span className="text-sm font-bold uppercase tracking-widest text-white/30 self-center mr-2 hidden sm:block">Мы здесь:</span>
                  {socials.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 transition-all hover:bg-teal-600 hover:text-white hover:border-teal-500 hover:-translate-y-1"
                    >
                      <social.icon className="h-6 w-6" />
                    </a>
                  ))}
                </div>
            </div>
          </div>

          {/* RIGHT SIDE: Menu (5 columns) */}
          <div className="lg:col-span-5 lg:flex lg:justify-end lg:pt-4">
             <div className="lg:w-auto"> 
                <h4 className="font-condensed text-base font-bold uppercase tracking-widest text-white/40 mb-8 text-left lg:text-right border-b border-white/10 pb-3 inline-block lg:w-full">
                  Меню
                </h4>
                {/* Grid layout */}
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-6 lg:text-right">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-lg text-slate-300 transition-colors hover:text-white hover:text-teal-400 font-medium"> {/* Увеличили до text-lg */}
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
             </div>
          </div>

        </motion.div>

        {/* Bottom Copyright - УВЕЛИЧИЛИ РАЗМЕР */}
        <div className="mt-24 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40 font-mono uppercase tracking-tight">
          <p className="hover:text-white/60 transition-colors">© 2026 Турклуб «Эва»</p>
          <p className="text-center md:text-right hover:text-white/60 transition-colors">
            Сделано с ❤️ для людей, которые любят природу
          </p>
          <p className="hover:text-white/60 transition-colors">ИП Санду Р.С.</p>
        </div>
      </div>
    </footer>
  )
}
