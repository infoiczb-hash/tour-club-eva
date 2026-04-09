import React from 'react';
import { CheckCircle, QrCode, Link as LinkIcon, Send, Globe, MessageCircle, Banknote, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SuccessScreenProps {
  bookingId: string; // ✅ Добавлено для формирования ссылки в кабинет
  shortId: number;
  totalPrice: number;
  currency: string;
  paymentMethod: string;
  isGuest?: boolean;
  phone?: string;
  biletpmrLink?: string | null;
  apbQrLink?: string | null;
  apbQrImage?: string | null;
  onClose: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  bookingId, // ✅ Добавлено
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
  // Настройки для Клевера (QR). Берем из пропсов тура или дефолтные из ENV
  const defaultApbImage = process.env.NEXT_PUBLIC_DEFAULT_APB_IMAGE || "/images/default-apb-qr.png";
  const finalApbImage = apbQrImage || defaultApbImage;
  const finalApbLink = apbQrLink || process.env.NEXT_PUBLIC_DEFAULT_APB_LINK || "#";
  
  // Ссылки для связи
  const botDeepLink = `https://t.me/authevaclub_bot?start=${shortId}`;
  const managerLink = `https://t.me/romansvtirase`;

  return (
    <div className="flex flex-col items-center text-center p-2 sm:p-4">
      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
        <CheckCircle className="text-emerald-400 w-8 h-8" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Заявка #{shortId} принята!</h2>
      <p className="text-slate-300 mb-6 sm:mb-8 text-sm sm:text-base">Места за вами зарезервированы.</p>

      {/* 💳 СЦЕНАРИЙ 1: BILETPMR */}
      {paymentMethod === 'biletpmr' && (
        <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl p-5 mb-6 text-left shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-blue-400 w-6 h-6" />
            <h3 className="text-lg font-semibold text-white">Оплата онлайн (BiletPMR)</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Если Вам удобно оплатить на biletpmr, можно перейти по ссылке. Цена может отличаться (не применяются бонусные оплаты и промокод), так как это сторонний сервис оплаты. После оплаты вы можете отправить нам билет сюда, или ожидайте, пока мы проверим вручную.
          </p>
          
          <div className="flex flex-col gap-3">
            {biletpmrLink ? (
              <Link href={biletpmrLink} target="_blank" className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-colors">
                <LinkIcon size={18} /> Перейти к оплате
              </Link>
            ) : (
              <p className="text-sm text-red-400 font-bold mb-2 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                Ссылка на оплату временно недоступна
              </p>
            )}
            <Link href={botDeepLink} target="_blank" className="w-full py-3.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Send size={18} /> Отправить билет в Telegram
            </Link>
          </div>
        </div>
      )}

      {/* 📱 СЦЕНАРИЙ 2: QR КЛЕВЕР */}
      {paymentMethod === 'qr' && (
        <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl p-5 mb-6 text-left shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="text-emerald-400 w-6 h-6" />
            <h3 className="text-lg font-semibold text-white">Оплата Клевер (QR)</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            К оплате: <strong className="text-emerald-400 text-base">{totalPrice} {currency}</strong><br/>
            Отсканируйте QR-код через приложение вашего банка или перейдите по ссылке ниже. После оплаты <strong className="text-white">обязательно отправьте скриншот чека</strong> в нашего Telegram-бота!
          </p>
          
          <div className="flex flex-col items-center bg-white p-3 rounded-xl mb-5 w-fit mx-auto">
            <Image 
              src={finalApbImage} 
              alt="QR код Клевер" 
              width={180} 
              height={180} 
              className="rounded-lg object-contain" 
            />
          </div>
          
          <div className="flex flex-col gap-3">
            <Link href={finalApbLink} target="_blank" className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-colors">
              <LinkIcon size={18} /> Ссылка на оплату (Клевер)
            </Link>
            <Link href={botDeepLink} target="_blank" className="w-full py-3.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(42,171,238,0.3)]">
              <Send size={18} /> Отправить скриншот в Telegram
            </Link>
          </div>
        </div>
      )}

      {/* 💵 СЦЕНАРИЙ 3: НАЛИЧНЫЕ / ТЕРМИНАЛ */}
      {paymentMethod === 'cash' && (
        <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl p-5 mb-6 text-left shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Banknote className="text-emerald-400 w-6 h-6" />
            <h3 className="text-lg font-semibold text-white">Оплата наличными</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Договорились! Подготовьте <strong className="text-white">{totalPrice} {currency}</strong> без сдачи к дню тура (оплата гиду на месте).<br/><br/>
            За 3 дня и за сутки до выезда бот пришлет вам запрос на подтверждение участия — не пропустите! Рекомендуем выбрать другой способ оплаты или оплатить через платежные терминалы АПБ. Выберите там ТурКлуб &quot;Эва&quot;. Квитанцию отправьте нам в бот.
          </p>
          
          <Link href={botDeepLink} target="_blank" className="w-full py-3.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Send size={18} /> Отправить квитанцию из терминала
          </Link>
        </div>
      )}

    {/* 🌍 СЦЕНАРИЙ 4: INTERNATIONAL */}
      {paymentMethod === 'foreign' && (
        <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl p-5 mb-6 text-left shadow-lg">
          {/* ... содержимое блока ... */}
        </div>
      )}

      {/* 🔥 НОВЫЙ БЛОК: ВОВЛЕЧЕНИЕ В ЛИЧНЫЙ КАБИНЕТ ДЛЯ ГОСТЕЙ */}
      {isGuest && (
        <div className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 mb-6 text-left shadow-lg animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Сохраните ваш билет</h3>
          </div>
          
          <p className="text-[13px] text-indigo-100/90 leading-relaxed mb-5 font-medium">
            Вы оформили заявку как гость. Войдите в <strong>Личный кабинет</strong>, чтобы билет всегда был под рукой, начислялся кэшбэк за поездки, и вы могли настроить удобные уведомления.
          </p>

          <div className="flex flex-col gap-3">
            {/* ГЛАВНОЕ ДЕЙСТВИЕ: В ЛК */}
            <Link 
              href={`/login?next=/account/bookings/${bookingId}`} 
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-[0.98]"
            >
              <User size={16} /> Войти в кабинет
            </Link>

            <div className="relative py-2">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
               <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-2 text-slate-500 font-medium">ИЛИ БЕЗ РЕГИСТРАЦИИ</span></div>
            </div>

            {/* ВТОРОСТЕПЕННОЕ ДЕЙСТВИЕ: ПРОСТО В БОТ */}
            <Link 
              href={botDeepLink} 
              target="_blank" 
              className="w-full py-3.5 bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 border border-[#2AABEE]/30 text-[#2AABEE] text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <Send size={16} /> Получить билет в Telegram
            </Link>
          </div>
        </div>
      )}

      {/* КНОПКИ УПРАВЛЕНИЯ */}
      <div className="w-full flex flex-col gap-2 mt-2 border-t border-white/5 pt-4">
        {/* Кнопка Управление билетом (Только для авторизованных) */}
        {!isGuest && (
          <Link 
            href={`/account/bookings/${bookingId}`}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Banknote size={16} className="text-teal-500" /> Управление билетом
          </Link>
        )}

        <button 
          onClick={onClose}
          className="w-full py-3 text-slate-400 hover:text-slate-300 font-bold transition-colors text-[12px] uppercase tracking-[0.2em]"
        >
          Закрыть окно
        </button>
      </div>
    </div>
  );
};