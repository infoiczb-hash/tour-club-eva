'use client';

import { useState } from 'react';
import { Gift, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';

interface ReferralCardProps {
  name: string | null;
  userId: string;
}

export default function ReferralCard({ name, userId }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  // Генерируем красивый код вида: EVA-ALEX-9F2A
  const cleanName = name ? name.replace(/\s+/g, '').substring(0, 4).toUpperCase() : 'CLUB';
  const shortId = userId.substring(0, 4).toUpperCase();
  const promoCode = `EVA-${cleanName}-${shortId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      showToast('Промокод скопирован!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Не удалось скопировать', 'error');
    }
  };

  return (
    <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border border-violet-500/20 rounded-2xl p-5 relative overflow-hidden group">
      {/* Декоративный фон */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/20 blur-3xl rounded-full group-hover:bg-violet-500/30 transition-colors" />
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
            <Gift size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm mb-1">Подари приключение</h3>
            <p className="text-xs text-slate-300 font-medium">
              Поделись кодом с другом. Он получит скидку 5%, а ты — бонус от клуба!
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-3 px-4 py-2.5 bg-slate-950/50 hover:bg-slate-950/80 border border-violet-500/30 rounded-xl transition-all shrink-0"
        >
          <span className="font-mono font-black text-violet-300 tracking-wider">
            {promoCode}
          </span>
          {copied ? (
            <CheckCircle2 size={16} className="text-green-400" />
          ) : (
            <Copy size={16} className="text-violet-400" />
          )}
        </button>

      </div>
    </div>
  );
}