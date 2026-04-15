// src/shared/ui/SwipeHint.tsx
"use client";

import { MoveRight } from "lucide-react";

export default function SwipeHint() {
  return (
    <div className="flex md:hidden items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-white/5 shadow-inner animate-pulse pointer-events-none w-fit">
      <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
        Листай вбок
      </span>
      <MoveRight size={14} className="text-teal-400 animate-pulse" />
    </div>
  );
}