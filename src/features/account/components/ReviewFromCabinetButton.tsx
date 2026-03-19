'use client';

import { useState, useTransition } from 'react';
import { Star, X, Loader, CheckCircle } from 'lucide-react';
import { submitReviewFromCabinet } from '@/features/account/actions/submitReview';

interface ReviewFromCabinetButtonProps {
  tourId: string;
  tourTitle: string;
  memberName: string;
}

export default function ReviewFromCabinetButton({
  tourId,
  tourTitle,
  memberName,
}: ReviewFromCabinetButtonProps) {
  const [isOpen, setIsOpen]   = useState(false);
  const [text, setText]       = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setIsOpen(true);
    setError('');
    setText('');
    setSuccess(false);
  }

  function handleClose() {
    if (isPending) return;
    setIsOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (text.trim().length < 10) {
      setError('Напишите чуть больше — минимум 10 символов');
      return;
    }

    startTransition(async () => {
      const result = await submitReviewFromCabinet({ tourId, text: text.trim() });

      if (!result.success) {
        setError(result.error ?? 'Не удалось отправить отзыв');
        return;
      }

      setSuccess(true);
      setTimeout(() => setIsOpen(false), 2000);
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
      >
        <Star size={12} />
        <span>Отзыв</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Оверлей */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Карточка */}
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {success ? (
              <div className="text-center py-4">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-bold">Спасибо за отзыв!</p>
                <p className="text-sm text-slate-400 mt-1">
                  Ваш отзыв будет опубликован после модерации.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={16} className="text-amber-400" />
                    <h3 className="text-base font-black text-white">Оставить отзыв</h3>
                  </div>
                  <p className="text-xs text-slate-400">{tourTitle}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Ваш отзыв
                  </label>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Расскажите как прошёл тур, что понравилось..."
                    rows={4}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all resize-none"
                    disabled={isPending}
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-1">
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <span className="text-xs text-slate-600 ml-auto">{text.length}/500</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || text.trim().length < 10}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-2.5 rounded-xl transition-all"
                >
                  {isPending ? (
                    <Loader size={15} className="animate-spin" />
                  ) : (
                    <>
                      <Star size={14} />
                      Отправить отзыв
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-600 text-center">
                  Отзыв появится на сайте после модерации. Имя: {memberName || 'Участник'}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
