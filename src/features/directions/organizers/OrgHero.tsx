"use client";

import { Users, ArrowRight } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';

export default function OrganizersHero() {
  const openContactModal = useModalStore((state) => state.openContactModal);

  return (
    <section className="relative min-h-[100svh] md:min-h-[85vh] flex items-center justify-center pt-28 md:pt-0 pb-12 md:pb-0 overflow-hidden">
  <div className="relative z-10 container mx-auto px-4 text-center max-w-5xl mt-8 md:mt-12">
        <div>
          {/* B2B Badge */}
          <div className="opacity-0 animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md rounded-full mb-8">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold tracking-[0.15em] text-indigo-300 uppercase">
              Для HR, руководителей и мастеров
            </span>
          </div>

          <h1 className="opacity-0 animate-fade-in-up [animation-delay:150ms] text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
            МЫ СОЗДАЕМ <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">СОБЫТИЯ</span>,<br />
            КОТОРЫЕ МЕНЯЮТ ЛЮДЕЙ И КОМАНДЫ
          </h1>

          <p className="opacity-0 animate-fade-in-up [animation-delay:300ms] text-lg md:text-xl text-slate-300 font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
            Организация сплавов, тимбилдингов и ретритов на природе. От 10 до 100+ человек. 
          </p>

          <div className="opacity-0 animate-fade-in-up [animation-delay:450ms] flex flex-col sm:flex-row justify-center gap-4">
             {/* ✅ Кнопка открытия модального окна */}
             <button 
               onClick={() => openContactModal('Организация мероприятия / Корпоратив', 'TOUR')}
               className="group w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] flex items-center justify-center gap-3"
             >
               <span>Обсудить задачу</span>
               <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </section>
  );
}