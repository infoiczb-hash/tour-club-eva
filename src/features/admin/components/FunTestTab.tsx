"use client";

import React, { useTransition } from "react";
import { Edit, Activity, Eye, EyeOff, BarChart } from "lucide-react";
// Проверь, чтобы путь к твоим экшенам был правильным:
import { toggleFunTestStatusAction } from "@/features/admin/actions/fun";
import { FunTest } from "@prisma/client";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// 1. Правильный интерфейс с onEdit
interface Props {
  initialTests: FunTest[];
  onEdit: (test: any) => void;
}

// 2. Компонент принимает onEdit
export default function FunTestTable({ initialTests, onEdit }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleFunTestStatusAction(id, currentStatus);
    });
  };

  if (initialTests.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
        <Activity size={40} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-700 mb-2">Пока нет ни одного теста</h3>
        <p className="text-slate-300 mb-6">Создай первую карточку, чтобы она появилась в Фан-секторе.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-300 text-xs uppercase tracking-widest font-bold">
              <th className="p-5">Название & Ключ (Slug)</th>
              <th className="p-5">Категория</th>
              <th className="p-5 text-center">Прохождений</th>
              <th className="p-5 text-center">Статус на сайте</th>
              <th className="p-5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialTests.map((test) => (
              <tr key={test.id} className="hover:bg-slate-50/50 transition-colors group">
                
                <td className="p-5">
                  <div className="font-bold text-slate-900 text-base">{test.title}</div>
                  <div className="text-xs font-mono text-slate-300 mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit">
                    {test.slug}
                  </div>
                </td>
                
                <td className="p-5">
                  <span className="inline-flex px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold tracking-wide">
                    {test.category}
                  </span>
                </td>
                
                <td className="p-5 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-700 flex items-center gap-1.5">
                      {test.passCount} <BarChart size={14} className="text-teal-500" />
                    </span>
                  </div>
                </td>
                
                <td className="p-5 text-center">
                  <button
                    onClick={() => handleToggle(test.id, test.isActive)}
                    disabled={isPending}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50",
                      test.isActive ? "bg-emerald-500" : "bg-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                        test.isActive ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                  <div className="text-[12px] font-bold uppercase tracking-widest mt-2 text-slate-300">
                    {test.isActive ? (
                      <span className="text-emerald-500 flex items-center justify-center gap-1"><Eye size={12}/> Виден</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1"><EyeOff size={12}/> Скрыт</span>
                    )}
                  </div>
                </td>
                
                <td className="p-5 text-right">
                  {/* 3. Идеально чистая кнопка без лишнего текста */}
                  <button
                    onClick={() => onEdit(test)}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-300 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                  >
                    <Edit size={16} />
                  </button>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}