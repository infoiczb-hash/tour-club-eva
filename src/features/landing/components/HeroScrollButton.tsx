"use client";

import { ArrowDown } from 'lucide-react';

export default function HeroScrollButton() {
  const handleScrollDown = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <button
      aria-label="Прокрутить вниз к турам"
      onClick={handleScrollDown}
      className="flex flex-col items-center gap-3 sm:gap-4 group cursor-pointer pointer-events-auto"
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-teal-500 group-hover:border-teal-500 transition-all duration-300 shadow-lg">
        <ArrowDown className="text-white group-hover:text-slate-900 animate-bounce w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
      </div>
    </button>
  );
}