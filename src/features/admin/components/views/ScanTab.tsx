// src/features/admin/components/views/ScanTab.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { 
  Camera, XCircle, CheckCircle2, User, Ticket, 
  CreditCard, Loader2, MapPin, Phone, Zap, ArrowRight, ScanLine, Crown
} from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { processScanAction, checkInBookingAction, type ScanResult, type ScannedBookingDTO, type ScannedMemberDTO } from '@/features/admin/actions/scanner';
import { clsx } from 'clsx';

type ScannerState = 'SCANNING' | 'LOADING' | 'RESULT' | 'ERROR';

export default function ScanTab() {
  const { showToast } = useToast();
  
  // Состояния (State Machine)
const [currentState, setCurrentState] = useState<ScannerState>('SCANNING');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Для чекина (локальный стейт, чтобы не перезапрашивать БД)
  const [isCheckInLoading, setIsCheckInLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Рефы для работы с видео и ZXing
 const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

 // ─── ПОДХВАТ ПАРАМЕТРОВ ИЗ URL (НОВЫЙ БЛОК) ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const b = params.get('b');
    const m = params.get('m');
    
    if (b || m) {
      const rawText = b ? `?b=${b}` : `?m=${m}`;
      
      // Сначала убеждаемся, что функции доступны
      // Останавливаем камеру, если она уже начала запуск
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
      
      // Запускаем процесс обработки данных из ссылки
      handleProcessQr(rawText);
      
      // Очищаем URL, чтобы при обновлении страницы сканер не срабатывал повторно
      const newUrl = window.location.pathname + '?tab=scan';
      window.history.replaceState({}, '', newUrl);
    }
  }, []); // Выполняется один раз при монтировании таба

  // ─── ЗАПУСК КАМЕРЫ ───
  const startScanning = useCallback(async () => {
    setCurrentState('SCANNING');
    setScanResult(null);
    setErrorMessage('');
    setIsCheckedIn(false);

    try {
      const codeReader = new BrowserQRCodeReader();
      // Передаем undefined как deviceId, чтобы ZXing сам выбрал заднюю камеру смартфона
      const controls = await codeReader.decodeFromVideoDevice(
        undefined, 
        videoRef.current!, 
        (result, error, controls) => {
          if (result) {
            // Как только поймали код — стопаем камеру и идем в БД
            controls.stop();
            handleProcessQr(result.getText());
          }
          if (error && error.name !== 'NotFoundException') {
            console.warn('QR Scan Warning:', error);
          }
        }
      );
      controlsRef.current = controls;
    } catch (error) {
      console.error('Camera error:', error);
      setCurrentState('ERROR');
      setErrorMessage('Нет доступа к камере. Проверьте разрешения браузера.');
    }
  }, []);

  // ─── ОСТАНОВКА КАМЕРЫ ───
  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
  }, []);

  // Очистка при размонтировании компонента
  useEffect(() => {
    startScanning();
    return () => stopScanning();
  }, [startScanning, stopScanning]);

  // ─── ОБРАБОТКА РЕЗУЛЬТАТА ───
  const handleProcessQr = async (qrText: string) => {
    setCurrentState('LOADING');
    
    // Включаем звук успешного сканирования (опционально)
    try {
        const audio = new Audio('/sounds/beep.mp3'); // Если захочешь добавить звук
        audio.play().catch(() => {});
    } catch (e) {}

    const result = await processScanAction(qrText);
    
    if (result.success) {
      setScanResult(result);
      if (result.type === 'booking') {
        setIsCheckedIn(result.data.checkedIn);
      }
      setCurrentState('RESULT');
    } else {
      setErrorMessage(result.error);
      setCurrentState('ERROR');
    }
  };

  // ─── ЭКШЕН: ОТМЕТИТЬ ПРИСУТСТВИЕ ───
  const handleCheckIn = async (bookingId: string) => {
    setIsCheckInLoading(true);
    const res = await checkInBookingAction(bookingId) as { success: boolean, checkedIn?: boolean, error?: string };
    
    if (res.success) {
      setIsCheckedIn(res.checkedIn || false);
      showToast(res.checkedIn ? 'Присутствие отмечено!' : 'Отметка снята', 'success');
      // Автоматически возвращаемся к сканированию после успешной отметки (ускоряет работу)
      if (res.checkedIn) {
         setTimeout(() => startScanning(), 1500);
      }
    } else {
      showToast(res.error || 'Ошибка при чекине', 'error');
    }
    setIsCheckInLoading(false);
  };

  // ─── UI РЕНДЕРЫ ПО СОСТОЯНИЯМ ───
  
  return (
<div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 pb-24 pt-4 md:pt-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <ScanLine size={28} className="text-teal-500" />
            Сканер билетов
          </h1>
          <p className="text-sm text-slate-700 mt-1">
            Наведите камеру на QR-код участника (билет или клубная карта)
          </p>
        </div>
      </div>

   <div className={clsx(
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col relative",
  currentState === 'RESULT' 
    ? "overflow-visible min-h-0" 
    : "overflow-hidden min-h-[50vh] md:min-h-[500px]"
)}>
        
        {/* 1. STATE: SCANNING */}
        <div className={clsx("absolute inset-0 bg-black flex items-center justify-center transition-opacity duration-300 z-10", currentState === 'SCANNING' ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
           <video 
             ref={videoRef} 
             className="w-full h-full object-cover" 
             muted 
             playsInline 
           />
           {/* Красивая рамка сканера поверх видео */}
           <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute top-0 left-0 right-0 h-1/4 bg-black/50 backdrop-blur-sm" />
              <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-black/50 backdrop-blur-sm" />
              <div className="absolute top-1/4 bottom-1/4 left-0 w-1/6 bg-black/50 backdrop-blur-sm" />
              <div className="absolute top-1/4 bottom-1/4 right-0 w-1/6 bg-black/50 backdrop-blur-sm" />
              
              {/* Уголки */}
              <div className="absolute top-1/4 left-1/6 w-10 h-10 border-t-4 border-l-4 border-teal-500 rounded-tl-xl" style={{ left: '16.66%' }} />
              <div className="absolute top-1/4 right-1/6 w-10 h-10 border-t-4 border-r-4 border-teal-500 rounded-tr-xl" style={{ right: '16.66%' }} />
              <div className="absolute bottom-1/4 left-1/6 w-10 h-10 border-b-4 border-l-4 border-teal-500 rounded-bl-xl" style={{ left: '16.66%' }} />
              <div className="absolute bottom-1/4 right-1/6 w-10 h-10 border-b-4 border-r-4 border-teal-500 rounded-br-xl" style={{ right: '16.66%' }} />
              
              {/* Бегающая линия */}
              <div className="absolute left-1/6 right-1/6 h-0.5 bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.8)] animate-[scan_2s_ease-in-out_infinite]" style={{ left: '16.66%', right: '16.66%' }} />
           </div>
        </div>

        {/* 2. STATE: LOADING */}
        <div className={clsx("absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-300 z-20 text-white", currentState === 'LOADING' ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
           <Loader2 size={48} className="animate-spin text-teal-500 mb-4" />
           <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Проверка базы...</p>
        </div>

        {/* 3. STATE: ERROR */}
        <div className={clsx("absolute inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300 z-20", currentState === 'ERROR' ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
            <XCircle size={64} className="text-rose-500 mb-4" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2">Ошибка сканирования</h3>
            <p className="text-slate-800 dark:text-slate-700 font-medium mb-8 max-w-sm">{errorMessage}</p>
            <button 
              onClick={startScanning} 
              className="px-8 py-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Попробовать снова
            </button>
             {/*   НОВОЕ */}
    <button 
      onClick={startScanning}
      className="mt-3 w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
    >
      Следующий <ArrowRight size={14}/>
    </button>
    </div>

     {/* 4. STATE: RESULT */}
       <div className={clsx(
  "transition-opacity duration-300",
  currentState === 'RESULT' 
    ? 'opacity-100 relative p-4 md:p-8 bg-slate-50 dark:bg-slate-950 rounded-3xl' 
    : 'opacity-0 pointer-events-none absolute inset-0'
)}>
           {scanResult?.success && scanResult.type === 'booking' && (
              <BookingResultCard 
                 data={scanResult.data as ScannedBookingDTO} 
                 isCheckedIn={isCheckedIn}
                 isCheckInLoading={isCheckInLoading}
                 onCheckIn={() => handleCheckIn((scanResult.data as ScannedBookingDTO).id)}
                 onNext={startScanning}
              />
           )}

           {scanResult?.success && scanResult.type === 'member' && (
              <MemberResultCard 
                 data={scanResult.data as ScannedMemberDTO} 
                 onNext={startScanning}
              />
           )}

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { top: 25%; opacity: 0; }
          10% { opacity: 1; }
          50% { top: 75%; }
          90% { opacity: 1; }
        }
      `}} />
    </div>
  );
}

// ─── КАРТОЧКА БИЛЕТА (ПОСЛЕ СКАНИРОВАНИЯ) ───
function BookingResultCard({ data, isCheckedIn, isCheckInLoading, onCheckIn, onNext }: { data: ScannedBookingDTO, isCheckedIn: boolean, isCheckInLoading: boolean, onCheckIn: () => void, onNext: () => void }) {
  const isPaid = data.status === 'confirmed';
  
  return (
    <div className="w-full max-w-md mx-auto flex flex-col h-full animate-in zoom-in-95 duration-300">
      
      {/* Статус-плашка */}
      <div className={clsx(
        "p-4 rounded-t-3xl border-x border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2",
        isPaid ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
      )}>
         {isPaid ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
         <h2 className="text-lg font-black uppercase tracking-wider">
           {isPaid ? "Оплачено" : "Не оплачено"}
         </h2>
      </div>

      {/* Тело билета */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-3xl p-6 shadow-xl relative z-10 flex-1">
          
          <div className="text-center mb-6">
              <p className="text-[12px] font-bold text-slate-700 uppercase tracking-widest mb-1">Бронь #{data.shortId || '---'}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{data.tour.title}</h3>
              <p className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-2 flex items-center justify-center gap-1.5">
                 <MapPin size={14}/> {data.tourDate ? new Date(data.tourDate.startDate).toLocaleDateString('ru-RU') : 'Открытая дата'}
              </p>
          </div>

          <div className="space-y-4 border-t border-b border-slate-100 dark:border-slate-800 py-6 mb-6">
             <div className="flex justify-between items-center">
                 <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><User size={16}/> Клиент:</span>
                 <span className="text-sm font-black text-slate-900 dark:text-white">{data.userName}</span>
             </div>
             <div className="flex justify-between items-center">
                 <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Phone size={16}/> Телефон:</span>
                 <span className="text-sm font-bold text-slate-900 dark:text-white">{data.userPhone}</span>
             </div>
             <div className="flex justify-between items-center">
                 <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Ticket size={16}/> Билетов:</span>
                 <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                   {data.totalTickets} чел.
                 </span>
             </div>
             <div className="flex justify-between items-center pt-2">
                 <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><CreditCard size={16}/> Итого:</span>
                 <span className="text-sm font-black text-slate-900 dark:text-white">{data.totalPrice} {data.currency}</span>
             </div>
          </div>

          {/* КНОПКА ЧЕКИНА */}
          <button
            onClick={onCheckIn}
            disabled={isCheckInLoading || !isPaid}
            className={clsx(
              "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-lg mb-4",
              !isPaid ? "bg-slate-100 text-slate-700 border border-slate-200 cursor-not-allowed" :
              isCheckedIn ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-amber-500/20" : "bg-teal-600 hover: bg-teal-500 text-slate-950  shadow-teal-500/20 active:scale-95"
            )}
          >
            {isCheckInLoading ? <Loader2 className="animate-spin" size={20} /> : 
             !isPaid ? 'Доступ запрещен' :
             isCheckedIn ? 'Отменить посадку' : 'Отметить посадку'}
          </button>

          <button onClick={onNext} className="w-full py-3 text-xs font-bold text-slate-700 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-800 rounded-xl">
             Следующий <ArrowRight size={14}/>
          </button>
      </div>
    </div>
  );
}

// ─── КАРТОЧКА КЛУБНИКА (ПОСЛЕ СКАНИРОВАНИЯ) ───
function MemberResultCard({ data, onNext }: { data: ScannedMemberDTO, onNext: () => void }) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col h-full animate-in zoom-in-95 duration-300">
      <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-slate-800 flex-1">
          
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10">
             <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-amber-500 flex items-center justify-center overflow-hidden mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                {data.avatarUrl ? <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User size={40} className="text-slate-700" />}
             </div>
             
             <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs  font-bold uppercase tracking-widest mb-3">
               <Crown size={12} /> Член клуба
             </div>

             <h2 className="text-3xl font-black text-white leading-tight mb-2">{data.name || 'Без имени'}</h2>
             <p className="text-slate-700 font-mono text-sm mb-8">{data.phone}</p>

             <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex flex-col items-center">
                   <p className="text-xs  font-bold text-slate-700 uppercase tracking-widest mb-1">Статус</p>
                   <p className="text-lg font-black text-amber-400 text-center">{data.level}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex flex-col items-center">
                   <p className="text-xs  font-bold text-slate-700 uppercase tracking-widest mb-1">Туров</p>
                   <p className="text-2xl font-black text-white">{data.totalTours}</p>
                </div>
                <div className="col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex flex-col items-center">
                   <p className="text-xs  font-bold text-slate-700 uppercase tracking-widest mb-1">Доступные бонусы</p>
                   <p className="text-3xl font-black text-emerald-400 flex items-center gap-2"><Zap size={20} className="text-emerald-500"/> {data.balance} ₽</p>
                </div>
             </div>

             <button onClick={onNext} className="w-full py-5 bg-white hover:bg-slate-200 text-slate-900 font-black uppercase tracking-widest text-sm rounded-2xl transition-all active:scale-95 shadow-xl">
                Готово, сканировать дальше
             </button>
          </div>
      </div>
    </div>
  );
}