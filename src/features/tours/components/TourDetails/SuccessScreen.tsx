import React from 'react';
import { CheckCircle, QrCode, Link as LinkIcon, Send } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SuccessScreenProps {
  shortId: number;
  totalPrice: number;
  currency: string;
  phone: string;
  biletpmrLink?: string | null;
  apbQrLink?: string | null;
  apbQrImage?: string | null;
  onClose: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  shortId,
  totalPrice,
  currency,
  phone,
  biletpmrLink,
  apbQrLink,
  apbQrImage,
  onClose
}) => {
  // Хардкодим резервные ссылки АПБ (на случай если в туре пусто)
  const defaultApbLink = process.env.NEXT_PUBLIC_DEFAULT_APB_LINK || "https://qrpay.apb.online/...";
  const defaultApbImage = process.env.NEXT_PUBLIC_DEFAULT_APB_IMAGE || "/images/default-apb-qr.png";

  const finalApbLink = apbQrLink || defaultApbLink;
  const finalApbImage = apbQrImage || defaultApbImage;

  return (
    <div className="flex flex-col items-center text-center py-6 px-2 animate-in fade-in duration-500">
      
      {/* 1. Заголовок и номер */}
      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20">
        <CheckCircle size={32} />
      </div>
      <h3 className="text-2xl font-black text-white uppercase mb-1">Места забронированы!</h3>
      <p className="text-slate-400 text-sm mb-6">Бронь <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">#{shortId}</span></p>

      {/* 2. Блок оплаты */}
      <div className="w-full bg-slate-950/50 border border-teal-500/30 rounded-2xl p-5 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500/0 via-teal-500/50 to-teal-500/0"></div>
        
        <p className="text-xs text-slate-400 uppercase font-bold mb-2">К оплате:</p>
        <p className="text-3xl font-black text-teal-400 mb-6">{totalPrice} {currency}</p>

        {/* QR Код АПБ */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-2 rounded-xl mb-3">
            <Image 
              src={finalApbImage} 
              alt="QR Code APB" 
              width={140} 
              height={140} 
              className="rounded-lg"
              unoptimized // Если картинка с внешнего URL
            />
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-bold">Отсканируйте в приложении АПБ</p>
        </div>

        {/* Кнопки ссылок */}
        <div className="flex flex-col gap-3">
          {biletpmrLink && (
            <Link href={biletpmrLink} target="_blank" className="w-full py-3 bg-[#E30613]/10 hover:bg-[#E30613]/20 border border-[#E30613]/30 text-[#E30613] text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-colors">
              <LinkIcon size={16} /> Оплатить через Bilet PMR
            </Link>
          )}
          <Link href={finalApbLink} target="_blank" className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-colors">
             <QrCode size={16} /> Оплатить по ссылке АПБ
          </Link>
        </div>
      </div>

      {/* 3. Инструкция и Telegram (Наш Deep Link) */}
      <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 mb-6 text-left">
        <p className="text-sm text-blue-100 mb-4 leading-relaxed">
          ⚠️ <strong className="text-white">Важно:</strong> После оплаты нажмите кнопку ниже, чтобы запустить нашего бота и отправить чек менеджеру. Там же придет время и место сбора!
        </p>
        <Link 
          href={`https://t.me/authevaclub_bot?start=${shortId}`} 
          target="_blank"
          className="w-full py-3.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        >
          <Send size={18} /> Отправить чек в Telegram
        </Link>
      </div>

      <button onClick={onClose} className="text-slate-500 text-sm hover:text-white transition-colors underline underline-offset-4">
        Закрыть окно (Я заскринил)
      </button>

    </div>
  );
};