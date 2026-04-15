"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Info, CheckCircle2 } from "lucide-react";
import { LEVELS_CONFIG } from "@/lib/constants/levels";

export default function LevelsInfoModal() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const modalContent = isOpen && mounted ? (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/95 backdrop-blur-md z-10 shrink-0">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Уровни лояльности</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4">
          {LEVELS_CONFIG.map((level, index) => (
            <div key={index} className="p-5 rounded-2xl bg-slate-800/40 border border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${level.colorMode} shadow-sm`} />
                  <h3 className="font-bold text-white text-lg">{level.name}</h3>
                </div>
                <span className="text-xs font-bold tracking-widest px-3 py-1.5 rounded-lg bg-slate-950/50 text-slate-300 border border-white/5">
                  {level.toursLabel}
                </span>
              </div>
              <ul className="space-y-2.5">
                {level.benefits.map((benefit, bIndex) => (
                  <li key={bIndex} className="flex items-start gap-2.5 text-sm text-slate-300 leading-snug">
                    <CheckCircle2 size={16} className="text-teal-500 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-4 flex items-center justify-center w-full gap-2 py-3.5 px-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors border border-white/5 text-sm font-bold tracking-wide text-slate-300 hover:text-white"
      >
        <Info size={16} />
        <span>Система уровней и привилегии</span>
      </button>

      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}