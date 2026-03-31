import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  FlaskConical, ArrowRight, RefreshCw, 
  Compass, Brain, PawPrint, Tent, Backpack, 
  Activity, ShieldAlert, Dumbbell, HeartPulse, BookOpen 
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── Строгие типы для JSON из БД ────────────────────────────────────
interface TestResultData {
  type?: string;
  badge?: string;
  description?: string;
  score?: Record<string, number>;
  [key: string]: unknown;
}

// ─── конфиг квизов (Теперь с современными иконками) ─────────────────
const QUIZ_CONFIG: Record<string, {
  title: string;
  icon: React.ElementType;
  description: string;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  'tourist-type': {
    title: 'Тип туриста',
    icon: Compass,
    description: 'Кто ты в путешествии — романтик, исследователь или организатор?',
    href: '/fun?quiz=tourist-type',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
  },
  'psych-profile': {
    title: 'Психологический профиль',
    icon: Brain,
    description: 'Как ты реагируешь на трудности и незнакомые ситуации в дороге?',
    href: '/fun?quiz=psych-profile',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  'totem': {
    title: 'Тотемное животное',
    icon: PawPrint,
    description: 'Какой дух-хранитель сопровождает тебя в походах?',
    href: '/fun?quiz=totem',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  'survival': {
    title: 'Выживание',
    icon: Tent,
    description: 'Насколько ты готов к нештатным ситуациям на маршруте?',
    href: '/fun?quiz=survival',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  'backpack': {
    title: 'Что в рюкзаке?',
    icon: Backpack,
    description: 'Твой стиль сборов и что это говорит о характере.',
    href: '/fun?quiz=backpack',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  'body-signals': {
    title: 'Сигналы тела',
    icon: Activity,
    description: 'Уровень физической готовности к активным маршрутам.',
    href: '/fun?quiz=body-signals',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  'fears': {
    title: 'Разбор страхов',
    icon: ShieldAlert,
    description: 'Психологический разбор твоих опасений перед походом.',
    href: '/fun?quiz=fears',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
  },
  'physical': {
    title: 'Физическая готовность',
    icon: Dumbbell,
    description: 'Оценка твоей выносливости и готовности к нагрузкам.',
    href: '/fun?quiz=physical',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  'signals': {
    title: 'Анализ самочувствия',
    icon: HeartPulse,
    description: 'Анализ твоего самочувствия в туре.',
    href: '/fun?quiz=signals',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
  'debrief': {
    title: 'Рефлексия опыта',
    icon: BookOpen,
    description: 'Осознание того, что открыл для тебя последний поход.',
    href: '/fun?quiz=debrief',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
  },
};

// ─── загрузка данных ─────────────────────────────────────────────────
async function getTestResults(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  const results = await prisma.testResult.findMany({
    where: { memberId: profile.id },
    orderBy: { createdAt: 'desc' },
  });

  return { profile, results };
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── страница ────────────────────────────────────────────────────────
export default async function TestsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/tests');

  const data = await getTestResults(user.id);
  if (!data) redirect('/login?next=/account/tests');

  const { results } = data;

  const passedSlugs = new Set(results.map(r => r.testSlug));
  const unpassedQuizzes = Object.entries(QUIZ_CONFIG).filter(
    ([slug]) => !passedSlugs.has(slug)
  );

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">ДНК Туриста</h1>
        <p className="text-sm text-slate-400">
          {results.length > 0
            ? `Открыто ${results.length} из ${Object.keys(QUIZ_CONFIG).length} граней вашей личности`
            : 'Пройдите тесты в Fan-секторе, чтобы собрать свой профиль'}
        </p>
      </div>

      {/* ── Пройденные тесты (RPG-Витрина) ─────────────────────────── */}
      {results.length > 0 && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(result => {
              const config = QUIZ_CONFIG[result.testSlug];
              if (!config) return null;

              const res = result.result as unknown as TestResultData;
              const typeName = res.type ?? 'Результат сохранен';
              const Icon = config.icon;

              return (
                <div
                  key={result.id}
                  className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 flex flex-col relative overflow-hidden group hover:border-white/10 transition-colors"
                >
                  {/* Фоновое свечение */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full pointer-events-none ${config.bgColor.replace('/10', '')}`} />

                  {/* Шапка карточки */}
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${config.bgColor} ${config.color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{config.title}</h3>
                      <p className="text-[10px] text-slate-400">{formatDate(result.createdAt)}</p>
                    </div>
                  </div>

                  {/* Главный Результат */}
                  <div className="mb-5 relative z-10">
                    <p className={`text-xl font-black uppercase tracking-wide ${config.color}`}>
                      {typeName}
                    </p>
                    {res.badge && (
                      <p className="text-sm text-slate-300 mt-1 font-medium">
                        {res.badge}
                      </p>
                    )}
                  </div>

                  {/* RPG Статы (Компактные шкалы) */}
                  {!!res.score && typeof res.score === 'object' && Object.keys(res.score).length > 0 && (
                    <div className="mb-6 relative z-10 grid grid-cols-2 gap-x-4 gap-y-3">
                      {Object.entries(res.score)
                        .filter(([key]) => key.toLowerCase() !== 'total') // Прячем общий тотал, оставляем только хар-ки
                        .slice(0, 6)
                        .map(([key, value]) => (
                          <div key={key} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className="text-slate-400 truncate pr-2">{key}</span>
                              <span className={config.color}>{value}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden shadow-inner">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${config.bgColor.replace('/10', '/60')}`}
                                style={{ width: `${Math.min(value || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Кнопка "Пройти заново" внизу */}
                  <div className="mt-auto pt-4 border-t border-white/5 relative z-10">
                    <Link
                      href={config.href}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors border border-transparent hover:border-white/5"
                    >
                      <RefreshCw size={14} /> Перепройти тест
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Непройденные квизы ───────────────────────────────────── */}
      {unpassedQuizzes.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-white/5">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {results.length > 0 ? 'Ещё не пройдены' : 'Доступные тесты'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unpassedQuizzes.map(([slug, config]) => {
              const Icon = config.icon;
              return (
                <Link
                  key={slug}
                  href={config.href}
                  className="flex items-center gap-4 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-110 ${config.bgColor} ${config.color}`}>
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors truncate">
                      {config.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {config.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-slate-600 group-hover:text-teal-400 transition-colors shrink-0"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA если вообще нет результатов */}
      {results.length === 0 && (
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0 mb-4 shadow-inner border border-teal-500/20">
            <FlaskConical size={32} className="text-teal-400" />
          </div>
          <p className="text-lg font-black text-white mb-2">
            Узнай свой туристический профиль
          </p>
          <p className="text-sm text-slate-400 mb-6 max-w-sm">
            Пройди тесты в Fan-секторе — результаты автоматически сохранятся здесь в виде красивой статистики.
          </p>
          <Link
            href="/fun"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black tracking-widest uppercase px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          >
            Начать <ArrowRight size={16} />
          </Link>
        </div>
      )}

    </div>
  );
}