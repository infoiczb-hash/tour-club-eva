"use client";

import React from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, FileText, Download, Backpack, Wallet, ShieldCheck } from 'lucide-react';

interface TourEssentialsProps {
  included: string[];
  additionalExpenses: string[];
  documents?: any[];
  checklist?: string | null;
}

export default function TourEssentials({ 
  included, 
  additionalExpenses, 
  documents, 
  checklist 
}: TourEssentialsProps) {
  
  // 🔥 УБРАН margin-bottom
  return (
    <section className="scroll-mt-24" id="essentials">
      
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20">
           <Wallet size={20} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
           Условия и подготовка
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <h3 className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2">
            <CheckCircle size={14} /> Что включено
          </h3>
          <ul className="space-y-2.5">
            {included.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-snug">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
          <h3 className="text-rose-400 font-black uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2">
            <XCircle size={14} /> Дополнительно
          </h3>
          <ul className="space-y-2.5">
            {additionalExpenses.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-snug">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        
        <div className="flex flex-col">
          <h3 className="text-white font-bold uppercase text-base mb-4 flex items-center gap-2">
            <Backpack className="text-teal-500" size={18}/> Что взять с собой
          </h3>
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 flex-grow">
            <div 
              className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-line
                prose-ul:list-disc prose-li:marker:text-teal-500"
              dangerouslySetInnerHTML={{ __html: checklist || 'Список вещей уточняется...' }}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="text-white font-bold uppercase text-base mb-4 flex items-center gap-2">
            <ShieldCheck className="text-teal-500" size={18}/> Необходимые документы
          </h3>
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 flex-grow">
            {documents && documents.length > 0 ? (
              <div className="grid gap-2">
                {documents.map((doc, i) => (
                  <Link 
                    key={i} 
                    href={doc.url || '#'} 
                    target="_blank"
                    className="group flex items-center justify-between p-3 bg-white/5 hover:bg-teal-500/10 border border-white/5 hover:border-teal-500/30 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-teal-400 transition-colors shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Файл</span>
                        <span className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                          {doc.title || `Документ ${i + 1}`}
                        </span>
                      </div>
                    </div>
                    <Download size={16} className="text-slate-600 group-hover:text-teal-500 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Специальные документы не требуются</p>
            )}
            
            <div className="mt-4 p-3 rounded-lg bg-teal-500/5 border border-teal-500/10 text-xs text-slate-400 leading-snug">
              При заезде необходимо иметь при себе оригинал паспорта и полис ОМС.
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}