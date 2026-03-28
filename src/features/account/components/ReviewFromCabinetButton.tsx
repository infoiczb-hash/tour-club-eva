'use client';

import { useState, useTransition } from 'react';
import { Star, X, Loader, CheckCircle, Wallet } from 'lucide-react';
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
  const [rating, setRating]   = useState(0); // ✅ ДОБАВИЛИ: Состояние для звезд
  const [hoveredRating, setHoveredRating] = useState(0); // ✅ ДОБАВИЛИ: Для анимации наведения
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [reward, setReward]   = useState(0); // ✅ ДОБАВИЛИ: Сумма зачисленного бонуса
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setIsOpen(true);
    setError('');
    setText('');
    setRating(0);
    setSuccess(false);
    setReward(0);
  }

  function handleClose() {
    if (isPending) return;
    setIsOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Пожалуйста, поставьте оценку от 1 до 5 звезд');
      return;
    }

    if (text.trim().length < 10) {
      setError('Напишите чуть больше — минимум 10 символов');
      return;
    }

    startTransition(async () => {
      // ✅ ДОБАВИЛИ: Передаем rating в экшен
      const result = await submitReviewFromCabinet({ tourId, text: text.trim(), rating });

      if (!result.success) {
        setError(result.error ?? 'Не удалось отправить отзыв');
        return;
      }

      setSuccess(true);
      // Если экшен вернул награду (наши 10 рублей), сохраняем её для показа
      if ('reward' in result && result.reward) {
        setReward(result.reward);
      }
      
      // Закрываем модалку чуть позже, чтобы юзер успел порадоваться деньгам
      setTimeout(() => setIsOpen(false), 3500);
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
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {success ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle size={48} className="text-emerald-400 mx-auto" />
                <div>
                  <h3 className="text-xl font-black text-white">Спасибо за отзыв!</h3>
                  <p className="text-sm text-slate-400 mt-2">
                    Ваш отзыв отправлен на модерацию.
                  </p>
                </div>
                
                {/* ✅ ДОБАВИЛИ: Красивый блок с начислением денег */}
                {reward > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4 flex items-center justify-center gap-3">
                    <Wallet className="text-amber-400" size={24} />
                    <div className="text-left">
                      <p className="text-xs text-amber-500/80 font-bold uppercase tracking-wider">Вам начислено</p>
                      <p className="text-lg font-black text-amber-400">+{reward} ₽ на баланс</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={16} className="text-amber-400" />
                    <h3 className="text-base font-black text-white">Оцените тур</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-tight">{tourTitle}</p>
                </div>

                {/* ✅ ДОБАВИЛИ: Интерактивный выбор звезд */}
                <div className="flex justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star 
                        size={32} 
                        className={`transition-colors duration-200 ${
                          star <= (hoveredRating || rating) 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'fill-slate-800 text-slate-700'
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Ваш отзыв
                  </label>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Что вам больше всего понравилось?"
                    rows={4}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                    disabled={isPending}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <span className="text-xs text-slate-600 ml-auto">{text.length}/500</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || rating === 0 || text.trim().length < 10}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-900 font-bold py-3 rounded-xl transition-all"
                >
                  {isPending ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    'Отправить и получить бонус'
                  )}
                </button>

                <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">
                  Имя: {memberName || 'Участник'}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}