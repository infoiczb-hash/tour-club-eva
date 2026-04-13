"use client";

import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Mail, Phone, User } from 'lucide-react';
import Image from 'next/image';
import { getMembersAction } from '@/features/admin/actions/members';
import { LEVELS_CONFIG } from '@/lib/constants/levels';

interface MemberTabProps {
  onSelectMember: (memberId: string) => void;
}

export default function MembersTab({ onSelectMember }: MemberTabProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getMembersAction({ page, limit: 20, search });
      if (res.success) {
        setMembers(res.data);
        setTotal(res.total);
      }
      setLoading(false);
    };
    load();
  }, [page, search]);

  const getLevelColor = (levelName: string) => {
    return LEVELS_CONFIG.find(l => l.name === levelName)?.color || 'text-slate-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200">
        <Search className="text-slate-400" size={20} />
        <input
          placeholder="Поиск по имени, телефону, Telegram..."
          className="w-full bg-transparent outline-none text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="p-4 text-left">Участник</th>
              <th className="p-4 text-left">Уровень</th>
              <th className="p-4 text-left">Контакты</th>
              <th className="p-4 text-left">Туров</th>
              <th className="p-4 text-left">Баланс</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map(m => (
              <tr 
                key={m.id} 
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onSelectMember(m.id)}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                      {m.avatarUrl ? <Image src={m.avatarUrl} alt="" width={40} height={40} /> : <User size={20} className="m-2" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{m.name || 'Без имени'}</p>
                      <p className="text-xs text-slate-500">ID: {m.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`text-xs font-bold uppercase tracking-wider ${getLevelColor(m.level)}`}>
                    {m.level}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    {m.phone && <span className="text-xs flex items-center gap-1"><Phone size={12} /> {m.phone}</span>}
                    {m.telegram && <span className="text-xs flex items-center gap-1 text-sky-500">@{m.telegram}</span>}
                  </div>
                </td>
                <td className="p-4 font-bold">{m.totalTours}</td>
                <td className="p-4 font-bold text-amber-600">{m.balance} ₽</td>
                <td className="p-4 text-right">
                  <ChevronRight size={18} className="text-slate-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}