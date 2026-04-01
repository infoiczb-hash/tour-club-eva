'use client';

import { useState, useTransition } from 'react';
import { ArrowLeftRight, X, Loader, CheckCircle } from 'lucide-react';
import { transferBookingSpot } from '@/features/account/actions/transferSpot';

interface TransferSpotButtonProps {
  bookingId: string;
  tourTitle: string;
  tourDate: string;
}

export default function TransferSpotButton({
  bookingId,
  tourTitle,
  tourDate,
}: TransferSpotButtonProps) {
  const [isOpen, setIsOpen]       = useState(false);
  const [phone, setPhone]         = useState('');
  const [name, setName]           = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setIsOpen(true);
    setError('');
    setPhone('');
    setName('');
    setSuccess(false);
  }

  function handleClose() {
    if (isPending) return;
    setIsOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
      setError('Введите корректный номер телефона');
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      setError('Введите имя (минимум 2 символа)');
      return;
    }

    startTransition(async () => {
      const result = await transferBookingSpot({
        bookingId,
        newPhone: phone.trim(),
        newName: name.trim(),
      });

      if (!result.success) {
        setError(result.error ?? 'Что-то пошло не так');
        return;
      }

      setSuccess(true);
      setTimeout(() => setIsOpen(false), 2000);
    });
  }

  const dateFormatted = new Date(tourDate).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long',
  });

  return (
    <>
      {/* Кнопка передачи */}
      <button
        onClick={handleOpen}
        className="px-3 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-xl transition-all"
        title="Передать место"
      >
        <ArrowLeftRight size={13} />
        <span className="hidden sm:inline">Передать</span>
      </button>

      {/* Модалка */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Оверлей */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Карточка */}
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">

            {/* Закрыть */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-300 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {success ? (
              /* Успех */
              <div className="text-center py-4">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-bold">Место передано!</p>
                <p className="text-sm text-slate-300 mt-1">
                  Новый участник получит подтверждение.
                </p>
              </div>
            ) : (
              /* Форма */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-base font-black text-white mb-1">
                    Передать место
                  </h3>
                  <p className="text-xs text-slate-300">
                    {tourTitle} · {dateFormatted}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Имя нового участника
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Имя Фамилия"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                      disabled={isPending}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Телефон нового участника
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+373 777 00 000"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                      disabled={isPending}
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-400">{error}</p>
                  )}
                </div>

                <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-3">
                  <p className="text-xs text-amber-300 leading-relaxed">
                    После передачи ваша бронь будет отменена.
                    Возврат предоплаты — согласно условиям отмены.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all"
                >
                  {isPending ? (
                    <Loader size={15} className="animate-spin" />
                  ) : (
                    <>
                      <ArrowLeftRight size={14} />
                      Передать место
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
