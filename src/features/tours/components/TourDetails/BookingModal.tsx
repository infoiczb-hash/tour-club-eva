// src/features/tours/components/TourDetails/BookingModal.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, FormProvider, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Tour } from '@/features/tours/types';
import { getMyProfileAction } from '@/features/account/actions/getProfile';
import { bookingFormSchema, type BookingFormValues } from './booking.schema';
import { SuccessScreen } from './SuccessScreen';

const formatDateForDropdown = (d: any) => {
  const dateVal = d.startDate || d.start || d.date;
  if (!dateVal) return '';
  const dateObj = new Date(dateVal);
  const str = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${str}${d.time ? ` в ${d.time}` : ''}`;
};

const StepLoader = () => (
  <div className="flex flex-col items-center justify-center py-24 text-slate-500 animate-in fade-in">
    <Loader2 className="animate-spin mb-4" size={32} />
    <span className="text-[10px] font-black uppercase tracking-widest">Загрузка модуля...</span>
  </div>
);

const Step1Cart = dynamic(() => import('./Step1Cart'), { loading: () => <StepLoader /> });
const Step2Guests = dynamic(() => import('./Step2Guests'), { loading: () => <StepLoader /> });
const Step3Checkout = dynamic(() => import('./Step3Checkout'), { loading: () => <StepLoader /> });
const StepWaitlist = dynamic(() => import('./StepWaitlist'), { loading: () => <StepLoader /> });

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  initialDate?: string;
  initialDateId?: string;
}

export type WizardStep = 'cart' | 'guests' | 'checkout' | 'success' | 'waitlist';

export default function BookingModal({ isOpen, onClose, tour, initialDate, initialDateId }: BookingModalProps) {
  const [step, setStep] = useState<WizardStep>('cart');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); 
  const [userBalance, setUserBalance] = useState(0);
  const [successData, setSuccessData] = useState<any>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  const methods = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema) as unknown as Resolver<BookingFormValues>,
    mode: 'onChange',
    defaultValues: {
      tourDateId: initialDateId || null,
      tourDateStr: initialDate || '',
      ticketsAdult: 1,
      ticketsChild: 0,
      ticketsMember: 0,
      ticketsFamily: 0,
      cartV2: {},
      guests: [],
      comment: '',
      hasChildUnder7: false,
      hasDog: false,
      paymentMethod: 'online_card',
      useBonuses: false,
      promoCode: '',
      agreedOffer: false,
      agreedPrivacy: false,
      agreedRules: false,
    }
  });

  const handleSafeClose = useCallback(() => {
    const hasUnsavedChanges = Object.keys(methods.formState.dirtyFields).length > 0;
    
    if (hasUnsavedChanges && (step === 'guests' || step === 'checkout')) {
      if (!window.confirm('У вас есть несохраненные данные. Точно хотите закрыть?')) {
        return;
      }
    }
    onClose();
  }, [methods.formState.dirtyFields, step, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsAuthLoading(true);

      const sourceDates = (tour.tourDates && tour.tourDates.length > 0) ? tour.tourDates : (tour.dates || []);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const validDates = sourceDates.filter((d: any) => {
        const dateVal = d.startDate || d.start || d.date;
        return dateVal ? new Date(dateVal) >= now : true;
      });

      if (initialDate && initialDateId) {
        methods.setValue('tourDateId', initialDateId);
        methods.setValue('tourDateStr', initialDate);
      } else if (validDates.length > 0) {
        const firstFree = validDates.find((d: any) => (d.spotsLeft ?? d.capacity ?? 0) > 0);
        const defaultDate = firstFree || validDates[0];

        methods.setValue('tourDateId', defaultDate.id || null);
        methods.setValue('tourDateStr', formatDateForDropdown(defaultDate));
      } else {
        methods.setValue('tourDateId', null);
        methods.setValue('tourDateStr', 'Открытая дата (по согласованию)');
      }

      getMyProfileAction()
        .then((profile) => {
          if (profile) {
            setIsLoggedIn(true);
            setUserBalance(profile.balance || 0);
            methods.setValue('guests.0.name', profile.name || '');
            methods.setValue('guests.0.phone', profile.phone || '');
            methods.setValue('social', profile.email || profile.telegram || profile.instagram || '');
            methods.setValue('guests.0.jacket', profile.lifeJacketSize || '');
          } else {
            setIsLoggedIn(false);
            setUserBalance(0);
          }
        })
        .catch(() => {
          setIsLoggedIn(false);
          setUserBalance(0);
        })
        .finally(() => {
          setIsAuthLoading(false); 
        });

    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setStep('cart');
        methods.reset();
        setSuccessData(null);
        setIsLoggedIn(false);
        setUserBalance(0);
        setIsAuthLoading(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, methods, initialDate, initialDateId, tour]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSafeClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSafeClose]);

  // 🚀 SENIOR FIX: Умные заголовки шагов в зависимости от типа тура
  const getStepTitle = () => {
    const categorySlug = tour.category?.slug?.toLowerCase() || '';
    const isKidsTour = ['kids', 'academy', 'children', 'детск'].some(k => categorySlug.includes(k));
    const isWaterTour = ['sup', 'kayaking', 'kayak', 'water', 'rafting'].some(k => categorySlug.includes(k));

    switch (step) {
      case 'cart': return 'Выбор тарифа';
      case 'guests': 
        if (isKidsTour) return 'Данные заказчика и участников';
        if (isWaterTour) return 'Данные экипажа';
        return 'Данные участников';
      case 'checkout': return 'Оплата билета';
      case 'waitlist': return 'Мест нет';
      case 'success': return 'ЗАЯВКА ПОЛУЧЕНА!';
      default: return 'Оформление';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div onClick={handleSafeClose} className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" />
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div ref={modalRef} role="dialog" aria-modal="true" className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-300">
          
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5 shrink-0">
            <div className="flex items-center gap-3">
              {(step === 'guests' || step === 'checkout') && (
                <button onClick={() => setStep(step === 'checkout' ? 'guests' : 'cart')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                  <ArrowLeft size={16} />
                </button>
              )}
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wide leading-none mb-1">{getStepTitle()}</h3>
                <p className="text-xs text-teal-400 font-bold truncate max-w-[250px]">{tour.title}</p>
              </div>
            </div>
            <button onClick={handleSafeClose} aria-label="Закрыть" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 relative">
            <FormProvider {...methods}>
              {step === 'cart' && (
              <Step1Cart 
                  tour={tour} 
                  onNext={() => setStep('guests')} 
                  onSoldOut={() => setStep('waitlist')} 
                  onClose={onClose} 
                  isLoggedIn={isLoggedIn && !isAuthLoading}
                />
              )}
              {step === 'guests' && <Step2Guests tour={tour} onNext={() => setStep('checkout')} />}
              {step === 'checkout' && <Step3Checkout tour={tour} isLoggedIn={isLoggedIn} userBalance={userBalance} onSuccess={(data) => { setSuccessData(data); setStep('success'); }} />}
              {step === 'waitlist' && <StepWaitlist tour={tour} onClose={onClose} onBack={() => setStep('cart')} />}
            </FormProvider>

            {step === 'success' && successData && (
              <SuccessScreen
                bookingId={successData.bookingId} 
                shortId={successData.shortId}
                totalPrice={successData.totalPrice} 
                currency={tour.currency ?? 'RUB'}
                biletpmrLink={successData.biletpmrLink}
                apbQrLink={successData.apbQrLink}
                apbQrImage={successData.apbQrImage}
                paymentMethod={successData.paymentMethod}
                redirectUrl={successData.redirectUrl} 
                onClose={onClose}
              />
            )}
          </div>

        </div>
      </div>
    </>
  );
}