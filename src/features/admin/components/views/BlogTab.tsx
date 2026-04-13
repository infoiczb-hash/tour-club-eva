import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Copy, Edit, Trash2, Star, FileText, LayoutGrid } from 'lucide-react';
import Button from '@/shared/ui/Button';
import { StatusSwitch } from '../ui/StatusSwitch';
import { ActionButton } from '../ui/ActionButton';
import { Blog } from '@prisma/client';

interface BlogTabProps {
  posts: Blog[];
  categories?: any[]; // Массив категорий блога из БД
  
  onAdd: () => void;
  onEdit: (post: Blog) => void;
  onDuplicate: (post: Blog) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (post: Blog, field: 'isActive' | 'is_trending') => void;
  
  // Хендлеры для категорий
  onAddCategory?: () => void;
  onEditCategory?: (category: any) => void;
  onDeleteCategory?: (id: string, type: 'tour' | 'blog') => void;
  onToggleCategoryStatus?: (id: string, status: boolean, type: 'tour' | 'blog') => void;
}

type ViewType = 'posts' | 'categories';

export default function BlogTab({ 
  posts, 
  categories = [],
  onAdd, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onToggleStatus,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleCategoryStatus
}: BlogTabProps) {
  
  const [activeView, setActiveView] = useState<ViewType>('posts');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER: Заголовок и Кнопка */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <FileText size={28} className="text-violet-500" />
            Блог
          </h2>
          <p className="text-sm text-slate-800 font-medium mt-1">
            Управление статьями и категориями
          </p>
        </div>
        <div className="hidden md:block">
          {activeView === 'posts' ? (
            <Button variant="primary" onClick={onAdd} className="bg-violet-600 hover:bg-violet-700 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              <Plus size={18} className="mr-2"/> Создать пост
            </Button>
          ) : (
            <Button variant="primary" onClick={onAddCategory} className="bg-violet-600 hover:bg-violet-700 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              <Plus size={18} className="mr-2"/> Добавить категорию
            </Button>
          )}
        </div>
      </div>

      {/* SUB-NAVIGATION: Посты / Категории */}
      <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
          <button 
              onClick={() => setActiveView('posts')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                  activeView === 'posts' 
                  ? 'bg-white dark:bg-slate-900 text-violet-600 shadow-sm' 
                  : 'text-slate-800 hover:text-slate-700 dark:hover:text-slate-800'
              }`}
          >
              <FileText size={16} /> Статьи ({posts.length})
          </button>
          <button 
              onClick={() => setActiveView('categories')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                  activeView === 'categories' 
                  ? 'bg-white dark:bg-slate-900 text-violet-600 shadow-sm' 
                  : 'text-slate-800 hover:text-slate-700 dark:hover:text-slate-800'
              }`}
          >
              <LayoutGrid size={16} /> Категории ({categories.length})
          </button>
      </div>

      {/* ========================================== */}
      {/* VIEW: СТАТЬИ БЛОГА (Оригинальный код)      */}
      {/* ========================================== */}
      {activeView === 'posts' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 font-black uppercase text-[12px] tracking-widest border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-5">Статья</th>
                  <th className="p-5">Категория</th>
                  <th className="p-5">Автор</th>
                  <th className="p-5 text-center">Топ</th>
                  <th className="p-5 text-center">Статус</th>
                  <th className="p-5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {posts.map(post => {
                  // @ts-ignore
                  const isPostActive = post.isActive ?? post.is_active ?? false;

                  return (
                    <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 relative">
                            {post.image && <Image src={post.image} alt={post.title} fill className="object-cover"/>}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{post.title}</div>
                            <div className="text-[12px] text-slate-800 font-mono">{new Date(post.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        {/* ✅ ИСПРАВЛЕНО: Выводим название из связи, фолбэк на старое поле */}
                        <span className="px-2 py-1 bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 rounded-md text-xs font-bold uppercase">
                          {(post as any).blogCategory?.title || post.category || 'Без категории'}
                        </span>
                      </td>
                      <td className="p-5 text-xs font-bold text-slate-800">
                        {post.author_name}
                      </td>
                      <td className="p-5 text-center">
                        <button 
                          onClick={() => onToggleStatus(post, 'is_trending')} 
                          className={`p-1.5 rounded-lg transition ${post.is_trending ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                          <Star size={18} fill={post.is_trending ? "currentColor" : "none"}/>
                        </button>
                      </td>
                      <td className="p-5 text-center">
                        <StatusSwitch active={isPostActive} onClick={() => onToggleStatus(post, 'isActive')} />
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-1">
                          <ActionButton icon={<Copy size={16}/>} onClick={() => onDuplicate(post)} title="Дубль"/>
                          <ActionButton icon={<Edit size={16}/>} onClick={() => onEdit(post)} title="Ред"/>
                          <ActionButton icon={<Trash2 size={16}/>} onClick={() => onDelete(String(post.id))} title="Удалить" color="text-red-500"/>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-800 font-medium">Статей пока нет</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {posts.map(post => {
               // @ts-ignore
               const isPostActive = post.isActive ?? post.is_active ?? false;
               
               return (
                <div key={post.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative shrink-0">
                      {post.image && <Image src={post.image} alt="post" fill className="object-cover"/>}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          {/* ✅ ИСПРАВЛЕНО */}
                          <span className="text-[12px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400 px-2 py-0.5 rounded uppercase">
                            {(post as any).blogCategory?.title || post.category || 'Без категории'}
                          </span>
                          <StatusSwitch active={isPostActive} onClick={() => onToggleStatus(post, 'isActive')} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mt-1">{post.title}</h4>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => onToggleStatus(post, 'is_trending')} className={`p-2 rounded-lg ${post.is_trending ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-800 bg-slate-50 dark:bg-slate-800'}`}><Star size={16}/></button>
                        <button onClick={() => onEdit(post)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800"><Edit size={16}/></button>
                        <button onClick={() => onDelete(String(post.id))} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                </div>
               );
            })}
            <button onClick={onAdd} className="w-full py-4 bg-violet-500/10 border border-violet-500/20 text-violet-500 font-bold rounded-2xl flex items-center justify-center gap-2">
                <Plus size={18} /> Создать пост
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VIEW: КАТЕГОРИИ БЛОГА                      */}
      {/* ========================================== */}
      {activeView === 'categories' && (
        <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 font-black uppercase text-[12px] tracking-widest border-b border-slate-200 dark:border-slate-800">
                      <tr>
                          <th className="p-5">Название</th>
                          <th className="p-5">Slug (URL)</th>
                          <th className="p-5 text-center">Сортировка</th>
                          <th className="p-5 text-center">Статус</th>
                          <th className="p-5 text-right">Действия</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {categories.map((cat) => (
                          <tr key={cat.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="p-5 font-bold text-slate-900 dark:text-white">
                                  {cat.title}
                              </td>
                              <td className="p-5">
                                  <span className="font-mono text-xs text-slate-800 dark:text-slate-800 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                      {cat.slug}
                                  </span>
                              </td>
                              <td className="p-5 text-center font-bold text-slate-800">
                                  {cat.sortOrder}
                              </td>
                              <td className="p-5 text-center">
                                  {onToggleCategoryStatus && (
                                      <StatusSwitch 
                                          active={cat.isActive} 
                                          onClick={() => onToggleCategoryStatus(cat.id, cat.isActive, 'blog')} 
                                          labelOn="Вкл" 
                                          labelOff="Скрыта" 
                                      />
                                  )}
                              </td>
                              <td className="p-5 text-right flex justify-end gap-1">
                                  {onEditCategory && (
                                      <ActionButton icon={<Edit size={16}/>} onClick={() => onEditCategory(cat)} title="Редактировать"/>
                                  )}
                                  {onDeleteCategory && (
                                      <ActionButton icon={<Trash2 size={16}/>} onClick={() => onDeleteCategory(cat.id, 'blog')} title="Удалить" color="text-red-500"/>
                                  )}
                              </td>
                          </tr>
                      ))}
                      {categories.length === 0 && (
                          <tr>
                              <td colSpan={5} className="p-10 text-center text-slate-800 font-medium">Категории блога не найдены</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>

          <div className="md:hidden">
                <button onClick={onAddCategory} className="w-full py-4 bg-violet-500/10 border border-violet-500/20 text-violet-500 font-bold rounded-2xl flex items-center justify-center gap-2">
                    <Plus size={18} /> Добавить категорию
                </button>
          </div>
        </div>
      )}
    </div>
  );
}