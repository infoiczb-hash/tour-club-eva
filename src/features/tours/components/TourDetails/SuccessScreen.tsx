import React from 'react';
import { CheckCircle, QrCode, Link as LinkIcon, Send, Globe, MessageCircle, Banknote, Bot } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SuccessScreenProps {
  shortId: number;
  totalPrice: number;
  currency: string;
  paymentMethod: string;
  isGuest?: boolean; // Сделали опциональным, чтобы модалка не ругалась
  phone?: string;    // ✅ Добавили телефон, чтобы принять его из модалки
  biletpmrLink?: string | null;
  apbQrLink?: string | null;
  apbQrImage?: string | null;
  onClose: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  shortId,
  totalPrice,
  currency,
  paymentMethod,
  isGuest,
  biletpmrLink,
  apbQrLink,
  apbQrImage,
  onClose
}) => {
  const defaultApbImage = process.env.NEXT_PUBLIC_DEFAULT_APB_IMAGE || "/images/default-apb-qr.png";
  const finalApbImage = apbQrImage || defaultApbImage;
  
  // Ссылка на бота с зашитым номером брони (Deep Link)
  const botDeepLink = `https://t.me/authevaclub_bot?start=${shortId}`;
  // Ссылка на живого менеджера (для иностранцев)
  const managerLink = process.env.NEXT_PUBLIC_MANAGER_TG || "https://t.me/evaturclub";

  // 🌍 СЦЕНАРИЙ 5: Иностранный гость (Молдова и др.)
  if (paymentMethod === 'transfer_md') {
    return (
      <div className="flex flex-col items-center text-center py-6 px-2 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
          <Globe size={32} />
        </div>
        <h3 className="text-2xl font-black text-white uppercase mb-1">Рады приветствовать!</h3>
        <p className="text-slate-400 text-sm mb-6">Бронь <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">#{shortId}</span></p>
        
        <div className="w-full bg-slate-950/50 border border-blue-500/30 rounded-2xl p-5 mb-6 text-left">
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Для гостей из других стран у нас индивидуальный подход. Наш менеджер свяжется с вами, чтобы подобрать удобный способ оплаты (в леях или другой валюте), а также ответит на все вопросы по границе и связи.
          </p>
          <Link href={managerLink} target="_blank" className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20">
            <MessageCircle size={18} /> Связаться с менеджером
          </Link>
        </div>
        <button onClick={onClose} className="text-slate-500 text-sm hover:text-white transition-colors underline underline-offset-4">Закрыть окно</button>
      </div>
    );
  }

  // 🤖 СЦЕНАРИЙ 1: ГОСТЬ (Не привязан Telegram)
  if (isGuest) {
    return (
      <div className="flex flex-col items-center text-center py-6 px-2 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-500 mb-4 border border-teal-500/20">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-2xl font-black text-white uppercase mb-1">Заявка создана!</h3>
        <p className="text-slate-400 text-sm mb-6">Бронь <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">#{shortId}</span></p>
        
        <div className="w-full bg-slate-950/50 border border-teal-500/30 rounded-2xl p-6 mb-6">
          <Bot size={40} className="text-teal-500 mx-auto mb-4 opacity-80" />
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Ваш аккаунт еще не активирован. Чтобы получить билет, узнать реквизиты для оплаты и логистическую информацию, <strong>обязательно запустите нашего бота</strong>.
          </p>
          <Link href={botDeepLink} target="_blank" className="w-full py-4 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 animate-pulse">
            <Send size={18} /> Получить билет в Telegram
          </Link>
        </div>
        <button onClick={onClose} className="text-slate-500 text-sm hover:text-white transition-colors underline underline-offset-4">Закрыть окно</button>
      </div>
    );
  }

  // 👇 ДАЛЬШЕ ИДУТ СЦЕНАРИИ ДЛЯ АВТОРИЗОВАННЫХ (СВОИХ)

  return (
    <div className="flex flex-col items-center text-center py-6 px-2 animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20">
        <CheckCircle size={32} />
      </div>
      <h3 className="text-2xl font-black text-white uppercase mb-1">Места забронированы!</h3>
      <p className="text-slate-400 text-sm mb-4">Бронь <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">#{shortId}</span></p>

      {/* 🧾 СЦЕНАРИЙ 2: QR АГРОПРОМБАНК */}
      {paymentMethod === 'qr' && (
        <div className="w-full bg-slate-950/50 border border-indigo-500/30 rounded-2xl p-5 mb-6">
          <p className="text-xs text-slate-400 uppercase font-bold mb-2">К оплате:</p>
          <p className="text-3xl font-black text-indigo-400 mb-4">{totalPrice} {currency}</p>
          <div className="bg-white p-2 rounded-xl mb-4 inline-block">
            <Image src={finalApbImage} alt="QR Code APB" width={140} height={140} className="rounded-lg" unoptimized />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Отсканируйте QR в приложении АПБ. После перевода нажмите кнопку ниже, чтобы прикрепить скриншот чека.
          </p>
          <Link href={botDeepLink} target="_blank" className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-colors">
             <QrCode size={18} /> Я оплатил (Отправить чек)
          </Link>
        </div>
      )}

      {/* 💳 СЦЕНАРИЙ 3: BILET PMR */}
      {paymentMethod === 'biletpmr' && (
        <div className="w-full bg-slate-950/50 border border-[#E30613]/30 rounded-2xl p-5 mb-6">
          <p className="text-xs text-slate-400 uppercase font-bold mb-2">К оплате:</p>
          <p className="text-3xl font-black text-[#E30613] mb-4">{totalPrice} {currency}</p>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Оплатите билеты онлайн. Как только транзакция пройдет, статус билета в боте автоматически изменится на «Оплачено».
          </p>
          {biletpmrLink ? (
             <Link href={biletpmrLink} target="_blank" className="w-full py-3.5 bg-[#E30613] hover:bg-[#E30613]/80 text-white text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-colors">
               <LinkIcon size={18} /> Перейти к оплате
             </Link>
          ) : (
             <p className="text-sm text-red-400 font-bold">Ссылка на оплату временно недоступна</p>
          )}
        </div>
      )}

      {/* 💵 СЦЕНАРИЙ 4: НАЛИЧНЫЕ */}
      {paymentMethod === 'cash' && (
        <div className="w-full bg-slate-950/50 border border-emerald-500/30 rounded-2xl p-5 mb-6">
          <Banknote size={40} className="text-emerald-500 mx-auto mb-4 opacity-80" />
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Договорились! Подготовьте <strong>{totalPrice} {currency}</strong> без сдачи к дню тура (оплата гиду на месте). 
            <br/><br/>
            За сутки до выезда бот пришлет вам запрос на подтверждение участия — не пропустите!
          </p>
        </div>
      )}

      <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold uppercase rounded-xl transition-colors">
        Понятно, закрыть
      </button>
    </div>
  );
};