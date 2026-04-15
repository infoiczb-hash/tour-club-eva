"use client";

import React, { useState } from 'react';
import {
  Search, X, UserCircle2, Phone, Send,
  ChevronUp, ChevronDown, RefreshCw,
  Crown, Flame, Mountain, Compass, Map,
  Instagram, ArrowRight, SlidersHorizontal
} from 'lucide-react';
import { FilterTab } from '../ui/FilterTab';
import MemberDrawer from './MemberDrawer';
import type { MemberSortField, MemberFilterLevel, MemberFilterActivity } from '@/features/admin/actions/members';

// ─── Типы ────────────────────────────────────────────────────────────────────

interface MemberRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  avatarUrl: string | null;
  level: string;
  totalTours: number;
  totalKm: number;
  balance: number;
  role: string;
  tags: string[];
  joinedAt: Date | string;
  tgChatId: string | null;
  _count: { bookings: number; reviews: number };
}

interface MembersTabProps {
  members: MemberRow[];
  total: number;
  page: number;
  loading: boolean;
  searchTerm: string;
  levelFilter: MemberFilterLevel;
  activityFilter: MemberFilterActivity;
  sortBy: MemberSortField;
  sortDir: 'asc' | 'desc';
  onSearchChange: (val: string) => void;
  onLevelChange: (val: MemberFilterLevel) => void;
  onActivityChange: (val: MemberFilterActivity) => void;
  onSortChange: (field: MemberSortField, dir: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

// ─── Конфиг уровней (цвета) ──────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  'Первопроходец': { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/30', icon: <Map size={12} /> },
  'Искатель':      { color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30',       icon: <Compass size={12} /> },
  'Следопыт':      { color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/30', icon: <Mountain size={12} /> },
  'Мастер троп':   { color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/30', icon: <Flame size={12} /> },
  'Легенда':       { color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30',    icon: <Crown size={12} /> },
};

const TAG_STYLES: Record<string, string> = {
  vip:          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  photographer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ambassador:   'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  difficult:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const LIMIT = 30;

// ─── Хелпер: сортировка ──────────────────────────────────────────────────────

function SortButton({
  field, label, sortBy, sortDir, onSortChange,
}: {
  field: MemberSortField;
  label: string;
  sortBy: MemberSortField;
  sortDir: 'asc' | 'desc';
  onSortChange: (f: MemberSortField, d: 'asc' | 'desc') => void;
}) {
  const isActive = sortBy === field;
  const toggle = () => onSortChange(field, isActive && sortDir === 'desc' ? 'asc' : 'desc');
  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors ${
        isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 hover:text-slate-800 dark:hover:text-slate-700'
      }`}
      type="button"
    >
      {label}
      {isActive ? (
        sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
      ) : (
        <ChevronDown size={12} className="opacity-30" />
      )}
    </button>
  );
}

// ─── Главный компонент ───────────────────────────────────────────────────────

export default function MembersTab({
  members, total, page, loading,
  searchTerm, levelFilter, activityFilter,
  sortBy, sortDir,
  onSearchChange, onLevelChange, onActivityChange,
  onSortChange, onPageChange, onRefresh,
}: MembersTabProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">

      {/* ── Заголовок ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            Члены клуба
          </h2>
          <p className="text-sm text-slate-700 mt-0.5">
            {loading ? 'Загрузка...' : `${total} участников`}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-slate-700 hover:text-teal-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          type="button"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {/* ── Поиск + фильтры ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">

        {/* Строка поиска */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Имя, телефон, Telegram..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
            {searchTerm && (
              <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-800">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || levelFilter !== 'all' || activityFilter !== 'all'
                ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 hover:border-slate-300'
            }`}
            type="button"
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Фильтры</span>
          </button>
        </div>

        {/* Раскрывающиеся фильтры */}
        {showFilters && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">

            {/* Уровень */}
            <div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Уровень</p>
              <div className="flex flex-wrap gap-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-1">
                {(['all', 'Первопроходец', 'Искатель', 'Следопыт', 'Мастер троп', 'Легенда'] as MemberFilterLevel[]).map(l => (
                  <FilterTab
                    key={l}
                    label={l === 'all' ? 'Все' : l}
                    active={levelFilter === l}
                    onClick={() => onLevelChange(l)}
                  />
                ))}
              </div>
            </div>

            {/* Активность */}
            <div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Активность</p>
              <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-1">
                {([
                  { val: 'all', label: 'Все' },
                  { val: 'active', label: 'Активные (90 дн.)' },
                  { val: 'sleeping', label: 'Спящие' },
                ] as { val: MemberFilterActivity; label: string }[]).map(a => (
                  <FilterTab
                    key={a.val}
                    label={a.label}
                    active={activityFilter === a.val}
                    onClick={() => onActivityChange(a.val)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Таблица ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">

        {/* Шапка таблицы (только десктоп) */}
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Участник</span>
          <SortButton field="totalTours" label="Туров"   sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} />
          <SortButton field="balance"    label="Баланс"  sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} />
          <SortButton field="joinedAt"   label="Вступил" sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} />
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Контакты</span>
          <span />
        </div>

        {/* Строки */}
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center">
            <UserCircle2 size={40} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-700 font-medium">Участники не найдены</p>
            {searchTerm && (
              <button onClick={() => onSearchChange('')} className="mt-2 text-sm text-teal-600 hover:underline">
                Сбросить поиск
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((member) => {
              const levelStyle = LEVEL_STYLES[member.level] || LEVEL_STYLES['Первопроходец'];
              const joinDate = new Date(member.joinedAt).toLocaleDateString('ru-RU', {
                day: 'numeric', month: 'short', year: '2-digit',
              });

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-2 md:gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                >
                  {/* Участник */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name || ''}
                          className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700">
                          <UserCircle2 size={18} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {member.name || 'Без имени'}
                        {member.role === 'admin' && (
                          <span className="ml-2 text-[10px] font-black text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded">ADMIN</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded border ${levelStyle.color} ${levelStyle.bg}`}>
                          {levelStyle.icon}
                          {member.level}
                        </span>
                        {member.tags.map(tag => (
                          <span key={tag} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TAG_STYLES[tag] || 'bg-slate-100 text-slate-800'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Туров */}
                  <div className="flex md:block items-center gap-2">
                    <span className="md:hidden text-[11px] font-bold text-slate-700 uppercase">Туров:</span>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{member.totalTours}</p>
                      <p className="text-[11px] text-slate-700">{member._count.bookings} броней</p>
                    </div>
                  </div>

                  {/* Баланс */}
                  <div className="flex md:block items-center gap-2">
                    <span className="md:hidden text-[11px] font-bold text-slate-700 uppercase">Баланс:</span>
                    <p className={`text-sm font-black ${member.balance > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {member.balance > 0 ? `+${member.balance} ₽` : '0 ₽'}
                    </p>
                  </div>

                  {/* Дата */}
                  <div className="flex md:block items-center gap-2">
                    <span className="md:hidden text-[11px] font-bold text-slate-700 uppercase">Вступил:</span>
                    <p className="text-sm text-slate-700">{joinDate}</p>
                  </div>

                  {/* Контакты */}
                  <div className="flex items-center gap-2">
                    {member.tgChatId && (
                      <a
                        href={`https://t.me/${member.telegram?.replace('@', '') || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Написать в Telegram"
                        className="p-1.5 rounded-lg text-slate-700 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                      >
                        <Send size={14} />
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        title={member.phone}
                        className="p-1.5 rounded-lg text-slate-700 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                      >
                        <Phone size={14} />
                      </a>
                    )}
                  </div>

                  {/* Стрелка */}
                  <div className="hidden md:flex items-center justify-center">
                    <ArrowRight size={16} className="text-slate-700 group-hover:text-teal-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-700">
              Страница {page} из {totalPages} · {total} участников
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Назад
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </div>

     {/* ── Drawer участника ── */}
      {selectedMemberId && (
      <MemberDrawer
  memberId={selectedMemberId}
  onClose={() => setSelectedMemberId(null)}
  onRefresh={onRefresh} // 👈 ОШИБКА ИСЧЕЗНЕТ, так как мы добавили этот пропс в Drawer
/>
      )}
    </div>
  );
}
