// src/app/account/tests/page.tsx

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  FlaskConical, ArrowRight, RefreshCw, 
  Compass, Brain, PawPrint, Tent, Backpack, 
  Activity, ShieldAlert, Dumbbell, HeartPulse, BookOpen 
} from 'lucide-react';

// ─── Строгие типы для JSON из БД ────────────────────────────────────
interface TestResultData {
  type?: string;
  badge?: string;
  description?: string;
  score?: Record<string, number>;
  [key: string]: unknown;
}

// ─── КОНФИГ КВИЗОВ ──────────────────────────────────────────────────
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
    color: 'text-teal-200',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
  },
  'psych-profile': {
    title: 'Психологический профиль',
    icon: Brain,
    description: 'Твои сильные стороны и поведение в экстремальных ситуациях.',
    href: '/fun?quiz=psych-profile',
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  'survival-test': {
    title: 'Навыки выживания',
    icon: ShieldAlert,
    description: 'Сможешь ли ты развести костер под дождем и найти воду?',
    href: '/fun?quiz=survival-test',
    color: 'text-orange-300',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  'hiking-ready': {
    title: 'Готовность к походу',
    icon: Backpack,
    description: 'Проверка физической и технической подготовки к маршруту.',
    href: '/fun?quiz=hiking-ready',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  'comfort-zone': {
    title: 'Уровень комфорта',
    icon: Tent,
    description: 'Насколько ты готов променять отель на палатку и звездное небо?',
    href: '/fun?quiz=comfort-zone',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  'eco-trail': {
    title: 'Эко-след',
    icon: PawPrint,
    description: 'Насколько бережно ты относишься к природе во время походов?',
    href: '/fun?quiz=eco-trail',
    color: 'text-green-300',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  'first-aid': {
    title: 'Первая помощь',
    icon: HeartPulse,
    description: 'Знаешь ли ты, что делать при травмах и недомоганиях в лесу?',
    href: '/fun?quiz=first-aid',
    color: 'text-red-300',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  'star-navigation': {
    title: 'Навигация по звездам',
    icon: BookOpen,
    description: 'Сможешь ли ты найти путь домой без компаса и смартфона?',
    href: '/fun?quiz=star-navigation',
    color: 'text-indigo-300',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
  },
  'mountain-spirit': {
    title: 'Дух гор',
    icon: Activity,
    description: 'Твоя психологическая совместимость с высокогорными условиями.',
    href: '/fun?quiz=mountain-spirit',
    color: 'text-sky-300',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
  },
  'water-master': {
    title: 'Мастер воды',
    icon: Dumbbell,
    description: 'Твои знания о сплавах, байдарках и поведении на воде.',
    href: '/fun?quiz=water-master',
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
  },
};

export default async function TestsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/account/tests');
  }

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    include: {
      testResults: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const results = profile?.testResults || [];
  // ИСПРАВЛЕНИЕ 1: ИСПОЛЬЗУЕМ testSlug
  const completedQuizKeys = new Set(results.map(r => r.testSlug));
  
  const remainingQuizzes = Object.entries(QUIZ_CONFIG)
    .filter(([key]) => !completedQuizKeys.has(key));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight">
          Тесты и достижения
        </h1>
        <p className="text-sm text-ui-muted max-w-2xl">
          Твой цифровой след в Турклубе. Проходи тесты, открывай новые грани своего туристического «Я» и сохраняй прогресс.
        </p>
      </div>

      {/* STATISTICS MINI-GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-ui-panel/40 border border-white/5 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-ui-muted font-bold mb-1">Пройдено</p>
          <p className="text-2xl font-black text-white">{results.length}</p>
        </div>
        <div className="bg-ui-panel/40 border border-white/5 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-ui-muted font-bold mb-1">Доступно</p>
          <p className="text-2xl font-black text-teal-400">{remainingQuizzes.length}</p>
        </div>
      </div>

      {/* МОИ РЕЗУЛЬТАТЫ */}
      {results.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
              <Activity size={18} className="text-teal-400" />
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Мои достижения</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result) => {
              // ИСПРАВЛЕНИЕ 2: ИСПОЛЬЗУЕМ result.result И result.testSlug
              const data = result.result as TestResultData;
              const config = QUIZ_CONFIG[result.testSlug];
              if (!config) return null;

              const Icon = config.icon;

              return (
                <div 
                  key={result.id}
                  className="group relative bg-ui-panel/60 border border-white/5 rounded-3xl p-5 hover:bg-ui-panel/80 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center shrink-0 shadow-inner`}>
                      <Icon size={24} className={config.color} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">
                          Результат:
                        </p>
                        <span className="text-[10px] text-ui-muted font-medium">
                          {new Date(result.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      
                      <p className="text-lg font-black text-white truncate leading-tight mb-1">
                        {data.type || 'Пройден'}
                      </p>

                      <p className="text-[10px] text-ui-muted truncate mt-0.5 uppercase tracking-wider font-semibold opacity-80">
                        Тест: {config.title}
                      </p>
                    </div>
                  </div>

                  <Link 
                    href={config.href}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                    title="Перепройти тест"
                  >
                    <RefreshCw size={14} className="text-white" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ДОСТУПНЫЕ ТЕСТЫ */}
      {remainingQuizzes.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
              <FlaskConical size={18} className="text-ui-muted" />
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Еще не пройдены</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {remainingQuizzes.map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Link 
                  key={key}
                  href={config.href}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-100 truncate group-hover:text-white transition-colors">
                      {config.title}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-ui-muted group-hover:text-ui-accent transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA если вообще нет результатов */}
      {results.length === 0 && (
        <div className="bg-ui-panel/60  border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0 mb-4 shadow-inner border border-teal-500/20">
            <FlaskConical size={32} className="text-teal-400" />
          </div>
          <p className="text-lg font-black text-white mb-2">
            Узнай свой туристический профиль
          </p>
          <p className="text-sm text-ui-muted mb-6 max-w-sm">
            Пройди тесты в Fan-секторе — результаты автоматически сохранятся здесь в виде красивой статистики.
          </p>
          <Link
            href="/fun"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black tracking-widest uppercase px-6 py-3 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            В Fan-сектор
            <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}