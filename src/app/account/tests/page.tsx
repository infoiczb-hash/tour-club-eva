import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FlaskConical, ArrowRight, RefreshCw } from 'lucide-react';

// ─── Строгие типы для JSON из БД ────────────────────────────────────
interface TestResultData {
  type?: string;
  badge?: string;
  description?: string;
  fullAnalysis?: string;
  score?: Record<string, number>;
  [key: string]: unknown; // на случай расширения данных
}

// ─── конфиг квизов ──────────────────────────────────────────────────
// Синхронизирован с FunClient / fun компонентами
const QUIZ_CONFIG: Record<string, {
  title: string;
  emoji: string;
  description: string;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  'tourist-type': {
    title: 'Тип туриста',
    emoji: '🧭',
    description: 'Кто ты в путешествии — романтик, исследователь или организатор?',
    href: '/fun?quiz=tourist-type',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
  },
  'psych-profile': {
    title: 'Психологический профиль',
    emoji: '🧠',
    description: 'Как ты реагируешь на трудности и незнакомые ситуации в дороге?',
    href: '/fun?quiz=psych-profile',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  'totem': {
    title: 'Тотемное животное',
    emoji: '🦅',
    description: 'Какой дух-хранитель сопровождает тебя в походах?',
    href: '/fun?quiz=totem',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  'survival': {
    title: 'Выживание',
    emoji: '🏕️',
    description: 'Насколько ты готов к нештатным ситуациям на маршруте?',
    href: '/fun?quiz=survival',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  'backpack': {
    title: 'Что в рюкзаке?',
    emoji: '🎒',
    description: 'Твой стиль сборов и что это говорит о характере.',
    href: '/fun?quiz=backpack',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  'body-signals': {
    title: 'Сигналы тела',
    emoji: '💪',
    description: 'Уровень физической готовности к активным маршрутам.',
    href: '/fun?quiz=body-signals',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  'fears': {
    title: 'Разбор страхов',
    emoji: '🛡️',
    description: 'Психологический разбор твоих опасений перед походом.',
    href: '/fun?quiz=fears',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  'physical': {
    title: 'Физическая готовность',
    emoji: '💪',
    description: 'Оценка твоей выносливости и готовности к нагрузкам.',
    href: '/fun?quiz=physical',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  'signals': {
    title: 'Сигналы тела',
    emoji: '🩺',
    description: 'Анализ твоего самочувствия в туре.',
    href: '/fun?quiz=signals',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
  'debrief': {
    title: 'Рефлексия опыта',
    emoji: '📖',
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
    day: 'numeric', month: 'long', year: 'numeric',
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

  // Набор пройденных slug-ов для быстрой проверки
  const passedSlugs = new Set(results.map(r => r.testSlug));

  // Непройденные квизы
  const unpassedQuizzes = Object.entries(QUIZ_CONFIG).filter(
    ([slug]) => !passedSlugs.has(slug)
  );

  return (
    <div className="space-y-8">

      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Мои тесты</h1>
        <p className="text-sm text-slate-400">
          {results.length > 0
            ? `Пройдено ${results.length} из ${Object.keys(QUIZ_CONFIG).length} тестов`
            : 'Пройдите тесты в Fan-секторе — результаты сохранятся здесь'}
        </p>
      </div>

      {/* ── Пройденные тесты ─────────────────────────────────────── */}
      {results.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Результаты
          </h2>

          {results.map(result => {
            const config = QUIZ_CONFIG[result.testSlug];
            if (!config) return null;

            // Строгая типизация JSON-объекта из БД
            const res = result.result as unknown as TestResultData;
            
            const typeName   = res.type ?? '';
            const badge      = res.badge ?? config.emoji;

            return (
              <div
                key={result.id}
                className={`bg-slate-900/60 border rounded-2xl p-5 ${config.borderColor}`}
              >
                <div className="flex items-start gap-4">

                  {/* Бейдж */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${config.bgColor}`}>
                    {badge}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">{config.title}</p>
                        <p className={`text-base font-black ${config.color}`}>
                          {typeName || 'Результат'}
                        </p>
                      </div>
                      
                      {/* Кнопка перепройти */}
                      <Link
                        href={config.href}
                        className="shrink-0 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        title="Пройти заново"
                      >
                        <RefreshCw size={12} />
                        <span className="hidden sm:inline">Заново</span>
                      </Link>
                    </div>

                    {/* Описание из конфига (безопасный рендер без &&) */}
                    {config.description ? (
                      <p className="text-xs text-slate-400 leading-relaxed mt-1 mb-2">
                        {config.description}
                      </p>
                    ) : null}

                    {/* ИИ-Анализ (без дублирования, чистый блок) */}
                    {res.fullAnalysis ? (
                      <div className="mt-3 mb-2 p-4 bg-slate-950 rounded-xl border border-white/5 text-[13px] text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                        {res.fullAnalysis}
                      </div>
                    ) : null}

                    <p className="text-xs text-slate-600">
                      Пройден {formatDate(result.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Вывод Score, если он есть */}
                {!!res.score && typeof res.score === 'object' ? (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(res.score)
                        .slice(0, 6)
                        .map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 capitalize">{key}</span>
                              <span className={`font-bold ${config.color}`}>{value}%</span>
                            </div>
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${config.bgColor.replace('/10', '/60')}`}
                                style={{ width: `${Math.min(value || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      )}

      {/* ── Непройденные квизы ───────────────────────────────────── */}
      {unpassedQuizzes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {results.length > 0 ? 'Ещё не пройдены' : 'Доступные тесты'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unpassedQuizzes.map(([slug, config]) => (
              <Link
                key={slug}
                href={config.href}
                className="flex items-center gap-3 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${config.bgColor}`}>
                  {config.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors truncate">
                    {config.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {config.description}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-600 group-hover:text-teal-400 transition-colors shrink-0"
                />
              </Link>
            ))}
          </div>

          {results.length === 0 && (
            <p className="text-xs text-slate-600 pt-2">
              После прохождения теста нажмите кнопку «Сохранить результат» — он появится здесь.
            </p>
          )}
        </section>
      )}

      {/* Все пройдены */}
      {unpassedQuizzes.length === 0 && results.length > 0 && (
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 text-center">
          <p className="text-2xl mb-2">🏆</p>
          <p className="text-white font-bold mb-1">Все тесты пройдены!</p>
          <p className="text-sm text-slate-400">
            Следите за обновлениями — новые тесты появляются в Fan-секторе
          </p>
          <Link
            href="/fun"
            className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors"
          >
            Fan-сектор <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* CTA если вообще нет результатов */}
      {results.length === 0 && (
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
            <FlaskConical size={22} className="text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white mb-1">
              Узнай свой туристический профиль
            </p>
            <p className="text-xs text-slate-400">
              Пройди тесты в Fan-секторе — результаты автоматически сохранятся здесь
            </p>
          </div>
          <Link
            href="/fun"
            className="shrink-0 flex items-center gap-1.5 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors"
          >
            Перейти <ArrowRight size={14} />
          </Link>
        </div>
      )}

    </div>
  );
}