// Мок для отправки в Telegram
export const mockSendToTelegram = jest.fn().mockResolvedValue({ success: true });

// Мок для отправки email через Resend
export const mockResendEmailsSend = jest.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null });

// Мок для центра уведомлений
export const mockNotificationHubDispatch = jest.fn().mockResolvedValue({ success: true });