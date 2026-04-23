// СТАЛО: src/features/account/components/PaymentActionBlock.tsx
'use client';

import React, { useState } from 'react';
import { Send, Link as LinkIcon, AlertCircle, RefreshCw, CheckCircle, CreditCard, QrCode, Banknote, Globe, Eye, Upload, Loader } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { updatePaymentMethodAction } from '../actions/updatePaymentMethod';
import { uploadClientReceiptAction } from '../actions/uploadReceipt'; // ✅ Подключаем наш экшен

interface PaymentActionBlockProps {
  bookingId: string;
  shortId: number;
  status: string;
  paymentMethod: string;
  totalPrice: number;
  amountPaid: number;
  currency: string;
  receiptUrl?: string | null;
  rejectReason?: string | null;
  biletpmrLink?: string | null;
  apbQrLink?: string | null;
  apbQrImage?: string | null;
}

export const PaymentActionBlock: React.FC<PaymentActionBlockProps> = ({
  bookingId, shortId, status, paymentMethod, totalPrice, amountPaid, currency,
  receiptUrl, rejectReason, biletpmrLink, apbQrLink, apbQrImage
}) => {
  const [isChangingMethod, setIsChangingMethod] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const botDeepLink = `https://t.me/authevaclub_bot?start=${shortId}`;
  const managerLink = `https://t.me/romansvtirase`;
  const amountToPay = totalPrice - amountPaid;

  const defaultApbImage = process.env.NEXT_PUBLIC_DEFAULT_APB_IMAGE || "/images/default-apb-qr.png";
  const finalApbImage = apbQrImage || defaultApbImage;
  const finalApbLink = apbQrLink || process.env.NEXT_PUBLIC_DEFAULT_APB_LINK || "#";

  const isConfirmed = status === 'confirmed';
  const isModeration = status === 'moderation';
  const isRejected = status === 'rejected';

  // Обработчик загрузки файла с сайта
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadClientReceiptAction(bookingId, formData);
    setIsUploading(false);

    if (!res.success) {
      alert(res.error || 'Ошибка при загрузке чека');
    }
  };

  const handleChangeMethod = async (newMethod: string) => {
    setIsLoading(true);
    await updatePaymentMethodAction(bookingId, newMethod);
    setIsChangingMethod(false);
    setIsLoading(false);
  };

  // Если всё оплачено
  if (isConfirmed) {
    return (
      <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
        <CheckCircle className="text-emerald-500 w-8 h-8" />
        <span className="text-emerald-400 font-bold text-sm uppercase tracking-widest">Билет оплачен</span>
        {receiptUrl && (
          <a href={receiptUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 text-xs text-emerald-500/70 hover:text-emerald-400 transition-colors">
            <Eye size={14} /> Посмотреть чек
          </a>
        )}
      </div>
    );
  }

  // Если на проверке
  if (isModeration) {
    return (
      <div className="w-full bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5 text-center flex flex-col items-center">
        <RefreshCw className="text-sky-400 w-8 h-8 mb-3 animate-spin-slow" />
        <h3 className="text-sky-400 font-bold text-sm uppercase tracking-widest mb-2">Чек на проверке</h3>
        <p className="text-xs text-sky-200/70 mb-4 max-w-xs">
          Мы получили ваш скриншот. Менеджер проверит его в ближайшее время, и статус билета обновится автоматически.
        </p>
        {receiptUrl && (
          <a href={receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-sky-500/20 text-sky-400 rounded-lg text-xs font-bold transition-colors hover:bg-sky-500/30">
            <Eye size={14} /> Открытый чек
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Алерт об ошибке */}
      {isRejected && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-rose-400 font-bold text-sm mb-1">Оплата не подтверждена</h4>
            <p className="text-xs text-rose-200/70">{rejectReason || 'Пожалуйста, проверьте скриншот и отправьте его заново.'}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 shadow-lg">
        {/* Шапка блока */}
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">К оплате: <span className="text-white">{amountToPay} {currency}</span></span>
          <button 
            onClick={() => setIsChangingMethod(!isChangingMethod)}
            className="text-[12px] uppercase font-bold text-teal-500 hover:text-teal-400 transition-colors"
          >
            {isChangingMethod ? 'Отмена' : 'Изменить способ'}
          </button>
        </div>

        {/* Выбор нового метода */}
        {isChangingMethod ? (
          <div className="grid grid-cols-2 gap-2 mb-4 animate-in fade-in">
             <button onClick={() => handleChangeMethod('biletpmr')} disabled={isLoading} className="p-3 rounded-xl border border-white/5 bg-slate-950 hover:border-teal-500/50 flex flex-col gap-1 items-start transition-all disabled:opacity-50">
               <CreditCard size={14} className="text-teal-500" />
               <span className="text-xs font-bold text-slate-300">BiletPMR</span>
             </button>
             <button onClick={() => handleChangeMethod('qr')} disabled={isLoading} className="p-3 rounded-xl border border-white/5 bg-slate-950 hover:border-teal-500/50 flex flex-col gap-1 items-start transition-all disabled:opacity-50">
               <QrCode size={14} className="text-teal-500" />
               <span className="text-xs font-bold text-slate-300">Клевер QR.</span>
             </button>
             <button onClick={() => handleChangeMethod('cash')} disabled={isLoading} className="p-3 rounded-xl border border-white/5 bg-slate-950 hover:border-teal-500/50 flex flex-col gap-1 items-start transition-all disabled:opacity-50">
               <Banknote size={14} className="text-teal-500" />
               <span className="text-xs font-bold text-slate-300">Наличные</span>
             </button>
             <button onClick={() => handleChangeMethod('foreign')} disabled={isLoading} className="p-3 rounded-xl border border-white/5 bg-slate-950 hover:border-teal-500/50 flex flex-col gap-1 items-start transition-all disabled:opacity-50">
               <Globe size={14} className="text-teal-500" />
               <span className="text-xs font-bold text-slate-300">Иностранцы</span>
             </button>
          </div>
        ) : (
          /* Инструкции в зависимости от выбранного метода */
          <div className="space-y-4 animate-in fade-in">
            {paymentMethod === 'biletpmr' && (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">Оплатите билеты онлайн через систему biletPmr. После оплаты загрузите скрин-билета.</p>
                <div className="flex flex-col gap-2 mt-2">
                  {biletpmrLink && (
                    <Link href={biletpmrLink} target="_blank" className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <LinkIcon size={16} /> Перейти к оплате
                    </Link>
                  )}
                  {/* ДВЕ АЛЬТЕРНАТИВНЫЕ КНОПКИ ЗАГРУЗКИ */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <Link href={botDeepLink} target="_blank" className="flex-1 py-3.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg active:scale-95">
                      <Send size={16} /> В Telegram
                    </Link>
                    <label className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-600 shadow-lg active:scale-95">
                      {isUploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                      <span>{isUploading ? 'Загрузка...' : 'Загрузить чек'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>
              </>
            )}

            {paymentMethod === 'qr' && (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">Отсканируйте QR-код. После перевода <strong>обязательно</strong> отправьте скриншот чека.</p>
                <div className="flex justify-center bg-white p-2 rounded-xl w-fit mx-auto">
                  <Image src={finalApbImage} alt="QR" width={120} height={120} className="rounded-lg object-contain" />
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <Link href={finalApbLink} target="_blank" className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <LinkIcon size={16} /> Ссылка (Клевер)
                  </Link>
                  {/* ДВЕ АЛЬТЕРНАТИВНЫЕ КНОПКИ ЗАГРУЗКИ */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <Link href={botDeepLink} target="_blank" className="flex-1 py-3.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg active:scale-95">
                      <Send size={16} /> В Telegram
                    </Link>
                    <label className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-600 shadow-lg active:scale-95">
                      {isUploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                      <span>{isUploading ? 'Загрузка...' : 'Загрузить чек'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>
              </>
            )}

            {paymentMethod === 'cash' && (
              <>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Оплата гиду на месте (без сдачи). Если оплатили наличкой через терминал АПБ (ТурКлуб "Эва"), отправьте нам квитанцию.
                </p>
                {/* ДВЕ АЛЬТЕРНАТИВНЫЕ КНОПКИ ЗАГРУЗКИ */}
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <Link href={botDeepLink} target="_blank" className="flex-1 py-3.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg active:scale-95">
                    <Send size={16} /> В Telegram
                  </Link>
                  <label className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-600 shadow-lg active:scale-95">
                    {isUploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span>{isUploading ? 'Загрузка...' : 'Загрузить чек'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                </div>
              </>
            )}

            {paymentMethod === 'foreign' && (
              <>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">Для перевода свяжитесь напрямую с нашими менеджерами.</p>
                <Link href={managerLink} target="_blank" className="w-full py-3.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors">
                  Написать менеджеру (Telegram)
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};