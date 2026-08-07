"use client";

import { useState } from "react";
import { Copy, Share2, Check, Gift, AlertTriangle } from "lucide-react";

interface ReferralCardProps {
  promoCode: string;
  rewardAmount?: number;
  friendReward?: number;
}

export default function ReferralCard({
  promoCode, 
  rewardAmount = 10,
  friendReward = 10 
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const shareText = `Присоединяйся к нашему тур-клубу! Используй мой промокод ${promoCode} при бронировании и получи скидку ${friendReward} ₽ на первое приключение.`;

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      showToast();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Не удалось скопировать промокод", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Мой промокод Evatur",
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Ошибка при шаринге", err);
        }
      }
    } else {
      // Фолбэк, если Web Share API не поддерживается (например, десктоп без поддержки)
      handleCopy();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-ui-panel/80 backdrop-blur-xl border border-ui-border p-6 md:p-8 shadow-2xl">
      {/* Декоративный фоновый градиент */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Gift size={14} />
            Реферальная программа
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-ui-text">
            Приглашайте друзей в первый тур с нами
          </h3>
          <p className="text-ui-muted text-sm leading-relaxed max-w-md">
            Поделитесь промокодом. Друг получит скидку <span className="text-ui-text font-medium">{friendReward} ₽</span> на первый тур, а мы начислим <span className="text-ui-accent font-medium">{rewardAmount} ₽</span> на ваш баланс после его поездки.
          </p>
          
          {/* Стилизованный блок предупреждения о приостановке программы */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl max-w-md mt-2">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                Внимание
              </span>
              <p className="text-amber-400/90 text-sm font-medium leading-relaxed">
                Эта бонусная программа временно не работает. Ориентировочное время возобновления программы: 20.08.2026
              </p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto bg-ui-bg/60 rounded-2xl p-4 border border-ui-border/50 flex flex-col gap-3">
          <div className="text-center">
            <p className="text-xs text-ui-muted uppercase tracking-widest mb-1">Ваш промокод</p>
            <p className="text-2xl font-mono font-bold text-ui-text tracking-widest">{promoCode}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 bg-ui-border/50 hover:bg-ui-border text-ui-text py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
            >
              {copied ? <Check size={16} className="text-teal-400" /> : <Copy size={16} />}
              {copied ? "Скопирован" : "Копировать"}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-slate-950 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors shadow-[0_0_15px_rgba(13,148,136,0.3)]"
            >
              <Share2 size={16} />
              Поделиться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}