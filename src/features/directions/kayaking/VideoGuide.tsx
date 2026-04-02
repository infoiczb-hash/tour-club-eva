"use client";

import React, { useState } from "react";
import { Play, Video } from "lucide-react";
import Image from "next/image";

export default function VideoGuide() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = "WmzHFlL0jrg";
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <section className="py-8 md:py-16 bg-[#020617] relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">

        {/* HEADER */}
        <div className="text-left mb-8 md:mb-12 max-w-3xl animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
            <Video size={14} className="text-teal-400" />
            <span className="text-[12px] md:text-[14px] font-bold uppercase tracking-widest text-teal-400">Видео-гид</span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
            Теория <br className="hidden md:block" /><span className="text-teal-500">на практике</span>
          </h2>
          <p className="text-slate-300 text-[14px] md:text-base leading-relaxed font-medium">
            Посмотрите наш короткий инструктаж. Мы наглядно показываем, как правильно садиться в байдарку, держать весло и уверенно чувствовать себя на воде.
          </p>
        </div>

        {/* PLAYER */}
        <div
          className="relative w-full aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden group border border-white/10 shadow-2xl shadow-teal-900/20 bg-slate-900 isolate cursor-pointer animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both"
          onClick={() => setIsPlaying(true)}
        >
          {!isPlaying ? (
            <>
              <Image
                src={thumbnailUrl}
                alt="Видео-инструктаж по байдаркам"
                fill
                className="object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 1200px"
                unoptimized
              />
              <div className="absolute inset-0 bg-slate-950/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 bg-teal-500/90 backdrop-blur-md rounded-full flex items-center justify-center border border-teal-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_40px_rgba(20,184,166,0.4)]">
                    <Play size={36} className="text-slate-950 fill-slate-950 ml-2" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex flex-col items-start z-10 pointer-events-none">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[12px] md:text-[12px] font-bold uppercase tracking-widest rounded-lg mb-2 md:mb-3">
                  Основы управления
                </span>
                <h3 className="text-xl md:text-3xl font-black text-white drop-shadow-lg tracking-tight leading-tight">
                  Как управлять байдаркой?
                </h3>
              </div>
            </>
          ) : (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </section>
  );
}