"use client"; // Не забудь оставить эту строку, если используешь framer-motion!

import { motion } from "framer-motion";
import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export default function ClientButtons() {
  return (
    // Убрали flex-wrap, добавили flex-nowrap и выравнивание по центру/правому краю
    <div className="flex flex-row flex-nowrap items-center justify-start md:justify-end gap-2 sm:gap-4">
      
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/about"
          // Сделали px-4 для мобилок и px-6 для десктопа, чтобы точно влезли в один ряд
          className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-teal-600 px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all hover:bg-teal-700 shadow-lg shadow-teal-500/20 whitespace-nowrap"
        >
          <Compass className="h-4 w-4 shrink-0" />
          <span>Впервые с нами?</span>
        </Link>
      </motion.div>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/tour"
          className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 bg-white/5 px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/40 whitespace-nowrap"
        >
          <span>Все туры</span>
          <ArrowRight className="h-4 w-4 shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
      
    </div>
  );
}