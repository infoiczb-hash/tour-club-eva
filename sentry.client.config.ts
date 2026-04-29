import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // ✅ Снижено до 10% для снижения нагрузки на сеть клиента
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  // ✅ Убрали синхронную инициализацию Replay
  integrations: [], 
});

// ✅ Ленивая загрузка Replay с динамическим импортом (отрезает ~50Kb от бандла)
if (typeof window !== 'undefined') {
  const loadReplay = async () => {
    try {
      // Динамически подгружаем код интеграции только когда он реально нужен
      const { replayIntegration, addIntegration } = await import('@sentry/nextjs');
      
      addIntegration(
        replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        })
      );
    } catch (e) {
      console.error('Failed to load Sentry Replay', e);
    }
  };

  // Ждем, пока браузер отрисует LCP и закончит гидратацию
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => loadReplay(), { timeout: 5000 });
  } else {
    setTimeout(loadReplay, 3000); // Fallback для старых Safari
  }
}