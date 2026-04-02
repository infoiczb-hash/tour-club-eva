'use client';

import { useTransition } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { cancelWaitlistAction } from '../actions/waitlist';
import { useToast } from '@/shared/context/ToastContext';

export default function CancelWaitlistButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault(); // Останавливаем переход по ссылке (карточке)
    if (!confirm('Вы уверены, что хотите отменить заявку в лист ожидания?')) return;

    startTransition(async () => {
      const res = await cancelWaitlistAction(id);
      if (res.success) {
        showToast('Заявка успешно отменена', 'success');
      } else {
        showToast(res.error || 'Ошибка при отмене', 'error');
      }
    });
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
      title="Отменить заявку"
    >
      {isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
      <span className="hidden sm:inline">Отменить</span>
    </button>
  );
}