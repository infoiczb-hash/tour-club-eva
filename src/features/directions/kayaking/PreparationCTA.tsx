"use client";

import { useRef, useEffect, useState } from "react";
import { MessageCircle, Map, Sparkles } from "lucide-react";
import { useModalStore } from '@/shared/store/useModalStore';
import { useKayakTab } from "./KayakingTabProvider";
import Link from 'next/link';

function useInView(options = { threshold: 0.15, rootMargin: '-30px' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      options
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

export default function PreparationCTA() {
  const openContactModal = useModalStore((state) => state.openContactModal);
  const { setActiveTab } = useKayakTab();
  const blockView = useInView();

  return (
    <section className="py-10 md:py-14 bg-[#020617] relative overflow-hidden font-sans">
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div
          ref={blockView.ref}
          style={{ opacity: blockView.inView ? 1 : 0, transform: blockView.inView ? 'translateY(0)' : 'translateY(30px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
          className="relative p-8 md:p-16 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-teal-900/40 via-slate-900 to-[#020617] border border-teal-500/20 overflow-hidden text-center flex flex-col items-center shadow-2xl"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mb-8 relative z-10">
            <Sparkles size={32} strokeWidth={1.5} />
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6 relative z-10">
            Готовы <span className="text-teal-500">к сплаву?</span>
          </h2>
          <p className="text-base md:text-lg text-slate-300 font-medium max-w-2xl leading-relaxed mb-10 relative z-10">
            Теория пройдена, вещи собраны, правила изучены. Осталось самое приятное — дождаться весла в руках и ветра в волосах. Мы обещаем, это будет незабываемо.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto relative z-10">
           <Link
  href="/tour?category=kayaking"
  className="w-full sm:w-auto px-8 py-4 bg-teal-500 text-slate-950 font-black uppercase tracking-wider text-sm rounded-xl hover:bg-teal-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center gap-2"
>
  <Map size={18} />
  <span>Выбрать другой маршрут</span>
</Link>
            <button
              onClick={() => openContactModal('Сплавы на байдарках', 'TOUR')}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} className="text-slate-400" />
              <span>Остались сомнения? Напишите нам</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}