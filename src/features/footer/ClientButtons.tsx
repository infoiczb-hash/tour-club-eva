import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export default function ClientButtons() {
  return (
    <div className="flex flex-row flex-nowrap items-center justify-start md:justify-end gap-2 sm:gap-4">
      
      <Link
        href="/about"
        className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-teal-700 px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all hover:bg-teal-600 hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/20 whitespace-nowrap"
      >
        <Compass className="h-4 w-4 shrink-0" />
        <span> О клубе</span>
      </Link>

      <Link
        href="/tour"
        className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 bg-white/5 px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/40 hover:scale-105 active:scale-95 whitespace-nowrap"
      >
        <span>Все туры</span>
        <ArrowRight className="h-4 w-4 shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>
      
    </div>
  );
}