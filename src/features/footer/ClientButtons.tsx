"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, ArrowRight } from "lucide-react";

export default function ClientButtons() {
  return (
    <div className="flex flex-wrap justify-center md:justify-end gap-4">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/about"
          className="group inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-teal-700 shadow-lg shadow-teal-500/20"
        >
          <Compass className="h-4 w-4" />
          <span>Впервые с нами?</span>
        </Link>
      </motion.div>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/tour"
          className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/40"
        >
          <span>Все туры</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </div>
  );
}