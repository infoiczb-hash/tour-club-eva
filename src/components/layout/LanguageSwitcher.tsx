"use client";

import React from 'react';

const Languages = { RU: 'ru', EN: 'en', RO: 'ro' } as const;
type LangKey = typeof Languages[keyof typeof Languages];

interface LanguageSwitcherProps {
  currentLang: string;
  onChange: (lang: string) => void;
}

export default function LanguageSwitcher({ currentLang, onChange }: LanguageSwitcherProps) {
  return (
    <div className="flex gap-1 bg-white/20 backdrop-blur rounded-xl p-1">
      {Object.values(Languages).map(lang => (
        <button 
          key={lang} 
          onClick={() => onChange(lang)} 
          className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${currentLang === lang ? 'bg-white text-teal-600 shadow-lg' : 'text-white hover:bg-white/10'}`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}