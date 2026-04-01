"use client";

import React, { useState, useEffect } from "react";
import { Share2, Check, Copy, Send, MessageCircle } from "lucide-react";

interface ArticleShareProps {
  title: string;
  slug: string;
}

export default function ArticleShare({ title, slug }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.href);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareWhatsapp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(title)} ${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6 border-t border-white/10 mt-8">
      <span className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
        <Share2 size={16} aria-hidden="true" /> Поделиться:
      </span>

      <div className="flex items-center gap-2" role="group" aria-label="Кнопки для шаринга статьи">

        {/* FIX: title → aria-label. title не озвучивается screen readers как название кнопки */}
        <button
          onClick={shareTelegram}
          aria-label="Поделиться в Telegram"
          className="w-10 h-10 rounded-full bg-[#2AABEE]/10 text-[#2AABEE] flex items-center justify-center hover:bg-[#2AABEE] hover:text-white transition-all border border-[#2AABEE]/20"
        >
          <Send size={18} className="-ml-0.5 mt-0.5" aria-hidden="true" />
        </button>

        <button
          onClick={shareWhatsapp}
          aria-label="Поделиться в WhatsApp"
          className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/20"
        >
          <MessageCircle size={18} aria-hidden="true" />
        </button>

        <button
          onClick={handleCopy}
          aria-label={copied ? 'Ссылка скопирована' : 'Скопировать ссылку на статью'}
          aria-live="polite"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
            copied
              ? "bg-green-500 text-white border-green-500"
              : "bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700 hover:text-white"
          }`}
        >
          {copied
            ? <Check size={18} aria-hidden="true" />
            : <Copy size={18} aria-hidden="true" />
          }
        </button>

      </div>
    </div>
  );
}