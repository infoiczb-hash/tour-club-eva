import React from 'react';
import Image from 'next/image';
import { Plus, Copy, Edit, Trash2, Star } from 'lucide-react';
import Button from '@/shared/ui/Button';
import { StatusSwitch } from '../ui/StatusSwitch';
import { ActionButton } from '../ui/ActionButton';
import { Blog } from '@prisma/client';

interface BlogTabProps {
  posts: Blog[];
  onAdd: () => void;
  onEdit: (post: Blog) => void;
  onDuplicate: (post: Blog) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (post: Blog, field: 'isActive' | 'is_trending') => void;
}

export default function BlogTab({ 
  posts, 
  onAdd, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onToggleStatus 
}: BlogTabProps) {
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase dark:text-white">Блог</h2>
        <Button variant="primary" onClick={onAdd}>
          <Plus size={18} className="mr-2"/> Пост
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
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
              // Исправление логики отображения статуса (Snake case fix)
              // @ts-ignore: Prisma может отдавать is_active вместо isActive
              const isPostActive = post.isActive ?? post.is_active ?? false;

              return (
                <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0 relative">
                        {post.image && <Image src={post.image} alt={post.title} fill className="object-cover"/>}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{post.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{new Date(post.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="px-2 py-1 bg-violet-50 text-violet-600 rounded-md text-xs font-bold uppercase">{post.category}</span>
                  </td>
                  <td className="p-5 text-xs font-bold text-slate-500">
                    {post.author_name}
                  </td>
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => onToggleStatus(post, 'is_trending')} 
                      className={`p-1.5 rounded-lg transition ${post.is_trending ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:bg-slate-100'}`}
                    >
                      <Star size={18} fill={post.is_trending ? "currentColor" : "none"}/>
                    </button>
                  </td>
                  <td className="p-5 text-center">
                    <StatusSwitch active={isPostActive} onClick={() => onToggleStatus(post, 'isActive')} />
                  </td>
                  <td className="p-5 text-right">
                    {/* Исправление: Убрал opacity-0, кнопки теперь всегда видны */}
                    <div className="flex justify-end gap-1">
                      <ActionButton icon={<Copy size={16}/>} onClick={() => onDuplicate(post)} title="Дубль"/>
                      <ActionButton icon={<Edit size={16}/>} onClick={() => onEdit(post)} title="Ред"/>
                      <ActionButton icon={<Trash2 size={16}/>} onClick={() => onDelete(String(post.id))} title="Удалить" color="text-red-500"/>
                    </div>
                  </td>
                </tr>
              );
            })}
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
                <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden relative shrink-0">
                  {post.image && <Image src={post.image} alt="post" fill className="object-cover"/>}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase">{post.category}</span>
                      <StatusSwitch active={isPostActive} onClick={() => onToggleStatus(post, 'isActive')} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mt-1">{post.title}</h4>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => onToggleStatus(post, 'is_trending')} className={`p-2 rounded-lg ${post.is_trending ? 'text-amber-500 bg-amber-50' : 'text-slate-300 bg-slate-50'}`}><Star size={16}/></button>
                    <button onClick={() => onEdit(post)} className="p-2 bg-slate-100 rounded-lg text-slate-500"><Edit size={16}/></button>
                    <button onClick={() => onDelete(String(post.id))} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            </div>
           );
        })}
      </div>
    </div>
  );
}