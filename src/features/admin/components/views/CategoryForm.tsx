"use client";

import React, { useState } from 'react';
import { X, Save, Tent, Mountain, Waves, Compass, Map, Sun, Snowflake, TreePine, Bike, Footprints, Loader2, MapPin, Anchor, Flame, Star } from 'lucide-react';
// FIX: импортируем CATEGORY_COLORS из единого источника правды вместо дублирования
import { CATEGORY_COLORS } from '@/lib/schemas';

const AVAILABLE_ICONS = [
  { name: 'Compass', icon: Compass, label: 'Компас (универсально)' },
  { name: 'Tent', icon: Tent, label: 'Палатка (походы)' },
  { name: 'Mountain', icon: Mountain, label: 'Горы (треккинг)' },
  { name: 'Waves', icon: Waves, label: 'Волны (вода, байдарки, SUP)' },
  { name: 'Map', icon: Map, label: 'Карта (экскурсии)' },
  { name: 'Sun', icon: Sun, label: 'Солнце (лето, тепло)' },
  { name: 'Snowflake', icon: Snowflake, label: 'Снежинка (зима)' },
  { name: 'TreePine', icon: TreePine, label: 'Лес (природа)' },
  { name: 'Bike', icon: Bike, label: 'Велосипед' },
  { name: 'Footprints', icon: Footprints, label: 'Следы (пешие)' },
  { name: 'MapPin', icon: MapPin, label: 'Локация (местные)' },
  { name: 'Anchor', icon: Anchor, label: 'Якорь' },
  { name: 'Flame', icon: Flame, label: 'Костер (выживание)' },
  { name: 'Star', icon: Star, label: 'Звезда (хит, особенное)' },
];

// FIX: строим AVAILABLE_COLORS из импортированного CATEGORY_COLORS
// Tailwind требует полные классы — bg- + название цвета
const AVAILABLE_COLORS = CATEGORY_COLORS.map(key => ({
  key,
  bgClass: `bg-${key}-500` as const,
}));

// === СТРОГАЯ ТИПИЗАЦИЯ ===
export interface CategoryData {
  id?: string;
  title?: string;
  slug?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  sort_order?: number;
  isActive?: boolean;
  is_active?: boolean;
}

export interface CategoryFormData {
  id: string;
  title: string;
  slug: string;
  icon: string;
  color: string;
  sort_order: number | string;
  is_active: boolean;
}

interface Props {
  initialData?: CategoryData | null;
  type: 'tour' | 'blog';
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

export default function CategoryForm({ initialData, type, onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CategoryFormData>({
    id: initialData?.id || '',
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    icon: initialData?.icon || 'Compass',
    color: initialData?.color || 'teal',
    sort_order: initialData?.sortOrder ?? initialData?.sort_order ?? 0,
    is_active: initialData?.isActive ?? initialData?.is_active ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as keyof CategoryFormData]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!initialData?.id) {
      const slug = title.toLowerCase().replace(/[^a-z0-9а-яё]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, title, slug }));
    } else {
      setFormData(prev => ({ ...prev, title }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Приводим к Record<string, unknown> согласно интерфейсу Props
      await onSubmit(formData as unknown as Record<string, unknown>);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {initialData?.id ? 'Редактировать' : 'Новая'}{' '}
            {type === 'tour' ? 'категория туров' : 'категория блога'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Название категории *</label>
              <input
                required
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="Например: Сплавы на байдарках"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-teal-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Slug (URL) *</label>
              <input
                required
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="Например: kayaking"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-teal-500 outline-none font-mono text-sm"
              />
            </div>

            {type === 'tour' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Иконка категории</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map((item) => {
                    const isSelected = formData.icon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: item.name }))}
                        title={item.label}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        <item.icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
                        <span className="text-[10px] mt-1.5 opacity-70 truncate w-full text-center">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {type === 'tour' && (
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <label className="text-sm font-medium text-slate-300">Фирменный цвет категории</label>
                <div className="flex flex-wrap gap-3">
                  {AVAILABLE_COLORS.map((color) => {
                    const isSelected = formData.color === color.key;
                    return (
                      <button
                        key={color.key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: color.key }))}
                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${color.bgClass} ${
                          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg' : 'opacity-50 hover:opacity-100 hover:scale-105'
                        }`}
                        title={color.key}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Порядок сортировки</label>
                <input
                  type="number"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-teal-500 outline-none"
                />
                <p className="text-[11px] text-slate-500">Меньше цифра = выше в списке</p>
              </div>

              <div className="flex items-center mt-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-teal-500' : 'bg-slate-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_active ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    Активна
                  </span>
                </label>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <button
            type="submit"
            form="category-form"
            disabled={loading}
            className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {loading ? 'Сохранение...' : 'Сохранить категорию'}
          </button>
        </div>

      </div>
    </div>
  );
}