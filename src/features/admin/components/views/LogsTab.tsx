// src/features/admin/components/views/LogsTab.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Shield, Cpu, Clock, 
  ChevronLeft, ChevronRight, Eye, AlertCircle 
} from 'lucide-react';
import { getAdminLogsAction } from '../../actions/audit';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export const LogsTab = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actorType, setActorType] = useState<'ALL' | 'USER' | 'SYSTEM'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await getAdminLogsAction({ page, actorType, search });
    if (res.success) {
      setLogs(res.logs);
      setTotal(res.total);
    }
    setLoading(false);
  }, [page, actorType, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Хелпер для раскраски экшенов
// Хелпер для раскраски экшенов
  const getActionBadge = (action: string) => {
    if (!action) return 'bg-slate-100 text-slate-700 border-slate-200'; // Защита от пустых значений
    const a = action.toUpperCase();
    if (a.includes('CREATE') || a.includes('SAVE') || a.includes('CONFIRM')) 
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (a.includes('DELETE') || a.includes('ERROR') || a.includes('REJECT')) 
      return 'bg-rose-100 text-rose-700 border-rose-200';
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('TOGGLE')) 
      return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Поиск по логам..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={actorType}
            onChange={(e) => setActorType(e.target.value as any)}
          >
            <option value="ALL">Все источники</option>
            <option value="USER">Администраторы</option>
            <option value="SYSTEM">Система / Боты</option>
          </select>
        </div>
        
        <div className="text-sm text-slate-500 font-medium">
          Всего записей: <span className="text-slate-900">{total}</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-bottom border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Источник</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Действие</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Объект</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Изменения</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                </tr>
              ))
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {log.actorType === 'SYSTEM' ? (
                        <Cpu className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Shield className="w-4 h-4 text-amber-500" />
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{log.actorName || 'System'}</div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">{log.actorType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-600 font-mono text-xs truncate max-w-[150px]" title={log.targetId}>
                      {log.targetId || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(log.createdAt), 'dd MMM, HH:mm', { locale: ru })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                      title="Посмотреть JSON"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Логи не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Показано {logs.length} из {total}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={page * 50 >= total}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON MODAL (INSPECTOR) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Детали изменений</h3>
                <p className="text-sm text-slate-500">{selectedLog.action} — {selectedLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                Закрыть
              </button>
            </div>
            <div className="p-6 overflow-auto bg-slate-50 font-mono text-sm leading-relaxed">
              {selectedLog.changes ? (
                <pre className="text-indigo-900">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              ) : (
                <span className="text-slate-400 italic">Нет данных об изменениях</span>
              )}
            </div>
            {selectedLog.ip && (
              <div className="p-4 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                <span>IP: {selectedLog.ip}</span>
                <span>Agent: {selectedLog.userAgent?.substring(0, 50)}...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};