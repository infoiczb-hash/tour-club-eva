import React from 'react';
// 👇 БЫЛО: import { getTours } from '@/features/tours/api';
// 👇 СТАЛО (меняем на новую функцию):
import { getAllTours } from '@/features/tours/api'; 

import AdminDashboard from '@/features/admin/components/AdminDashboard';

export const metadata = {
  title: 'Админка | ЭВА Турклуб',
  description: 'Управление турами и контентом',
};

export default async function AdminPage() {
  // 👇 Используем функцию БЕЗ фильтров
  const tours = await getAllTours(); 

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminDashboard initialTours={tours} />
    </div>
  );
}