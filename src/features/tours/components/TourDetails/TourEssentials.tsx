"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Download, 
  Backpack, 
  Wallet, 
  ShieldCheck, 
  ChevronDown 
} from 'lucide-react';

/**
 * Безопасный парсер для текста.
 * Заменяет **текст** на жирный шрифт и -> на стрелочки.
 */
const FormattedEssentialsText = ({ text }: { text: string | null | undefined }) => {
  if (!text) return null;
  
  const paragraphs = text.split(/\n+/).filter(p => p.trim() !== '');
  
  return (
    <div className="space-y-3">
      {paragraphs.map((para, idx) => {
        const withArrows = para.replace(/->/g, '→');
        const parts = withArrows.split(/(\*\*.*?\*\*)/g);
        
        return (
          <p key={idx} className="text-slate-300 text-sm leading-relaxed">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={i} className="text-white font-black">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

interface TourEssentialsProps {
  included: string[];
  additionalExpenses: string[];
  documents?: any[];
  checklist?: string | null;
}

export default function TourEssentials({ 
  included, 
  additionalExpenses, 
  documents = [], 
  checklist 
}: TourEssentialsProps) {
  
  const [includedOpen, setIncludedOpen] = useState(true);
  const [excludedOpen, setExcludedOpen] = useState(false);

  return (
    <section className="scroll-mt-24" id="essentials">
      
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20">
          <Wallet size={20} aria-hidden="true" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
          Условия и подготовка
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8 items-start">
        
        {/* Аккордеон: Что включено */}
        <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
          includedOpen 
            ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
            : 'bg-slate-900/40 border-white/5 hover:border-emerald-500/20'
        }`}>
          <button 
            onClick={() => setIncludedOpen(!includedOpen)}
            aria-expanded={includedOpen}
            aria-controls="included-list"
            className="w-full flex items-center justify-between p-5 text-left focus:outline-none group"
          >
            <h3 className="text-emerald-400 font-black uppercase tracking-widest text-[13px] flex items-center gap-2">
              <CheckCircle size={16} aria-hidden="true" />
              Что включено
              <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px]">
                {included?.length || 0}
              </span>
            </h3>
            <ChevronDown 
              size={18}
              aria-hidden="true"
              className={`text-emerald-500/50 transition-transform duration-300 ${
                includedOpen ? 'rotate-180 text-emerald-400' : 'group-hover:text-emerald-400'
              }`} 
            />
          </button>
          
          <div
            id="included-list"
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              includedOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              {included && included.length > 0 && (
                <ul className="px-5 pb-5 space-y-3">
                  {included.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Аккордеон: Дополнительные расходы */}
        <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
          excludedOpen 
            ? 'bg-rose-500/5 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.05)]' 
            : 'bg-slate-900/40 border-white/5 hover:border-rose-500/20'
        }`}>
          <button 
            onClick={() => setExcludedOpen(!excludedOpen)}
            aria-expanded={excludedOpen}
            aria-controls="excluded-list"
            className="w-full flex items-center justify-between p-5 text-left focus:outline-none group"
          >
            <h3 className="text-rose-400 font-black uppercase tracking-widest text-[13px] flex items-center gap-2">
              <XCircle size={16} aria-hidden="true" />
              Дополнительно
              <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px]">
                {additionalExpenses?.length || 0}
              </span>
            </h3>
            <ChevronDown 
              size={18}
              aria-hidden="true"
              className={`text-rose-500/50 transition-transform duration-300 ${
                excludedOpen ? 'rotate-180 text-rose-400' : 'group-hover:text-rose-400'
              }`} 
            />
          </button>
          
          <div
            id="excluded-list"
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              excludedOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              {additionalExpenses && additionalExpenses.length > 0 && (
                <ul className="px-5 pb-5 space-y-3">
                  {additionalExpenses.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.8)]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Снаряжение и документы */}
      <div className="grid md:grid-cols-2 gap-4">
        
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-teal-400 font-black uppercase tracking-widest text-[13px] flex items-center gap-2 mb-4">
            <Backpack size={16} aria-hidden="true" /> Снаряжение
          </h3>
          {checklist ? (
            <FormattedEssentialsText text={checklist} />
          ) : (
            <p className="text-slate-400 text-sm italic">
              Специальное снаряжение не требуется. Достаточно удобной одежды по погоде.
            </p>
          )}
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-teal-400 font-black uppercase tracking-widest text-[13px] flex items-center gap-2 mb-4">
            <ShieldCheck size={16} aria-hidden="true" /> Документы
          </h3>
          
          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc: any, i: number) => (
                <Link 
                  key={i} 
                  href={doc.url || '#'} 
                  target="_blank"
                  className="group flex items-center justify-between p-3 bg-white/5 hover:bg-teal-500/10 border border-white/5 hover:border-teal-500/30 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-teal-400 transition-colors shrink-0">
                      <FileText size={16} aria-hidden="true" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Файл</span>
                      <span className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                        {doc.title || `Документ ${i + 1}`}
                      </span>
                    </div>
                  </div>
                  <Download size={16} className="text-slate-600 group-hover:text-teal-500 transition-colors shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic">
              Для этого тура специальные документы не требуются.
            </p>
          )}
        </div>
        
      </div>
    </section>
  );
}