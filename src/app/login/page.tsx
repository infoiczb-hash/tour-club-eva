// page.tsx
import TelegramLoginWidget from './TelegramLoginWidget';
import GoogleLoginButton from './GoogleLoginButton';

export const metadata = {
  title: 'Вход в личный кабинет | Турклуб «Эва»',
  description: 'Авторизация в личном кабинете участника турклуба.',
};

// Перенесли санитайзер на сервер
function sanitizeNextUrl(next: string | null | undefined): string {
  const fallback = '/account/dashboard';
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    return fallback;
  }
  return next;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  // Читаем параметры прямо на сервере (без хуков клиента!)
  const params = await searchParams;
  const rawNext = typeof params.next === 'string' ? params.next : null;
  const safeNext = sanitizeNextUrl(rawNext);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-sm font-bold tracking-[0.2em] text-teal-400 uppercase mb-2">
            Турклуб «Эва»
          </p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            ЛИЧНЫЙ КАБИНЕТ УЧАСТНИКА
          </h1>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              
              {/* Рендерится мгновенно, параметр получает с сервера */}
              <TelegramLoginWidget next={safeNext} />

              {/* Разделитель */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-4 text-slate-300 uppercase tracking-widest font-bold">или</span>
                </div>
              </div>

              {/* Рендерится мгновенно, параметр получает с сервера */}
              <GoogleLoginButton next={safeNext} />

            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-300 mt-6 leading-relaxed">
          Входя в кабинет, вы соглашаетесь с условиями использования.
          <br />Мы не передаём ваши данные третьим лицам.
        </p>
      </div>
    </main>
  );
}