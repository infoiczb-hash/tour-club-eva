'use client';

import { useState, useTransition } from 'react';
import { Star, X, Loader, Clock, MessageSquareHeart } from 'lucide-react';
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
  const [rating, setRating]   = useState(0); 
  const [hoveredRating, setHoveredRating] = useState(0); 
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setIsOpen(true);
    setError('');
    setText('');
    setRating(0);
    setSuccess(false);
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
      const result = await submitReviewFromCabinet({ tourId, text: text.trim(), rating });

      if (!result.success) {
        setError(result.error ?? 'Не удалось отправить отзыв');
        return;
      }

      setSuccess(true);
      setTimeout(() => setIsOpen(false), 4000); // Даем время прочитать сообщение
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-xl transition-all shadow-sm"
      >
        <MessageSquareHeart size={14} />
        <span className="text-xs font-bold tracking-wide">Оценить тур</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={handleClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>

            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-400">
                  <Clock size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Отзыв на проверке</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Спасибо за ваше мнение! Мы опубликуем отзыв после быстрой модерации, и бонус <span className="text-amber-400 font-bold">+10 ₽</span> будет зачислен на ваш баланс.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={16} className="text-amber-400" />
                    <h3 className="text-base font-black text-white">Оцените тур</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-tight truncate">{tourTitle}</p>
                </div>

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
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                            : 'fill-slate-800 text-slate-700'
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Ваш отзыв</label>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Что вам больше всего понравилось?"
                    rows={4}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                    disabled={isPending}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <span className="text-[10px] text-slate-600 ml-auto">{text.length}/500</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || rating === 0 || text.trim().length < 10}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  {isPending ? <Loader size={16} className="animate-spin" /> : 'Отправить на модерацию'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}