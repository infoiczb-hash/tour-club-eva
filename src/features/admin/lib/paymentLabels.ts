// src/features/admin/lib/paymentLabels.ts
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  qr:          'Клевер QR',
  online_card: 'Клевер (карта)',
  biletpmr:    'BiletPMR',
  foreign:     'Из-за рубежа',
  cash:        'Наличные',
};

export function getPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return 'Наличные';
  return PAYMENT_METHOD_LABELS[method] ?? method; // неизвестное значение — показать как есть, не маскировать
}