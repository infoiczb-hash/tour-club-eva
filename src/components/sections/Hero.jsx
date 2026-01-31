import React from 'react';
import { Sparkles, Settings, X } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';

const Hero = ({ isAdmin, t, language, setLanguage, setShowLogin, setViewMode }) => {
  return (
    <section className="relative h-[75vh] min-h-[500px] w-full overflow-hidden bg-slate-900">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070" 
          alt="Outdoor club" 
          className="h-full w-full object-cover opacity-60 scale-105"
        />
        {/* Градиент в цвет #f8fafc из твоего index.css */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-transparent to-black/30" />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-2xl">
             <Sparkles size={24} className="text-white" />
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLang={language} onChange={setLanguage} />
            <button 
              onClick={() => isAdmin ? setViewMode('grid') : setShowLogin(true)}
              className="p-2 rounded-lg bg-white/10 backdrop-blur-md hover:bg-white/20 transition border border-white/10 text-white"
            >
              {isAdmin ? <X size={18}/> : <Settings size={18}/>}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex flex-col justify-center">
        <div className="max-w-3xl">
          <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-[0.3em] text-teal-400 uppercase bg-teal-400/10 backdrop-blur-sm border border-teal-400/20 rounded">
            Adventure awaits
          </span>
          <h1 className="text-6xl md:text-8xl font-condensed text-white leading-[0.85] tracking-tighter uppercase drop-shadow-2xl">
            {isAdmin ? t.admin.title : t.header.title}
          </h1>
          {!isAdmin && (
            <p className="mt-6 text-xl md:text-2xl text-white/90 font-light max-w-xl leading-relaxed">
              {t.header.subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
