"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { Tour } from '@/features/tours/types'; 
import { Blog, BookingStatus, Guide, Review, Inquiry } from '@prisma/client'; 
import AdminNavigation from './AdminNavigation';
import { FunTest } from '@prisma/client'; 
import FunTestTable from '@/features/admin/components/FunTestTab';
import FanForm from '@/features/admin/components/FanForm';
import { getFunTestsAction } from '@/features/admin/actions/fun';

// VIEWS
import DashboardTab from './views/DashboardTab';
import BookingsTab from './views/BookingsTab';
import ToursTab from './views/ToursTab';
import ReviewsTab from './views/ReviewsTab';
import BlogTab from './views/BlogTab';
import GuidesTab from './views/GuidesTab';
import ContentTab from './views/ContentTab';
// 👇 НОВЫЙ ИМПОРТ
import InquiriesTab from './views/InquiriesTab';

// FORMS & ACTIONS
import TourForm from './TourForm'; 
import GuideForm from './GuideForm';
import PostForm from './PostForm';
import ContentForm from './ContentForm';
import ReviewForm from './ReviewForm'; 
import AiAssistant from './AiAssistant';

import { saveTour, updateTourStatus } from '@/features/admin/actions/tour'; 
import { deleteTour } from '@/features/tours/actions';
import { 
  getRegistrationsAction, 
  updateRegistrationStatus, 
  saveGuideAction, 
  deleteGuideAction, 
  savePostAction, 
  deletePostAction, 
  saveContentBlockAction 
} from '@/features/admin/actions';
// 👇 НОВЫЙ ЭКШЕН
import { getInquiriesAction } from '@/features/admin/actions/inquiries';

import { getReviews, deleteReview, upsertReview } from '@/features/reviews/actions';
import { sendToTelegram } from '@/features/admin/actions/telegram';
import { getGuides } from '@/features/guides/api';
import { getBlogPosts } from '@/features/blog/api';
import { getContentBlock } from '@/lib/api';
import LoginModal from '@/shared/ui/LoginModal';

// TYPES
export type Tab = 'dashboard' | 'tours' | 'bookings' | 'reviews' | 'guides' | 'blog' | 'content' | 'inquiries' | 'fun';
interface BookingItem {
  id: string;
  user_name: string;
  user_phone: string;
  status: BookingStatus;
  created_at: Date | string;
  tickets_adult: number;
  tickets_child: number;
  event_id: string;
  tour?: { title: string; date: Date | string };
}

interface GuideItem extends Omit<Guide, 'id'> {
  id: string;
}

// --- MAIN COMPONENT ---
export default function AdminDashboard({ initialTours }: { initialTours: Tour[] }) {
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { showToast } = useToast();

  // Data State
  const [tours, setTours] = useState<Tour[]>(initialTours);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [posts, setPosts] = useState<Blog[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  // 👇 НОВОЕ СОСТОЯНИЕ
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [contentBlocks, setContentBlocks] = useState<any>({});

  // Modals
const [modalState, setModalState] = useState({
    tour: false, guide: false, post: false, content: false, review: false, fun: false 
  });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingSlug, setEditingSlug] = useState('');
  const [funTests, setFunTests] = useState<FunTest[]>([]);

  // --- INIT ---
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('is_admin') === 'true') {
        setIsAuth(true);
        loadAllData();
    }
  }, []);

  const loadAllData = async () => {
    try {
        // 👇 ИСПРАВЛЕНО: Поменяли местами funRes и heroRes, чтобы они совпадали с функциями ниже
        const [bRes, gRes, pRes, rRes, inqRes, funRes, heroRes, footerRes] = await Promise.all([
            getRegistrationsAction(),
            getGuides(),
            getBlogPosts(),
            getReviews(),
            getInquiriesAction(),
            getFunTestsAction(),      // Теперь попадает точно в funRes
            getContentBlock('hero'),  // Теперь попадает точно в heroRes
            getContentBlock('footer')

        ]);

        if (bRes.data) setBookings(bRes.data as BookingItem[]);
        setGuides(gRes as unknown as GuideItem[]);
        setPosts(pRes);
        setReviews(rRes);
        if (inqRes.success && inqRes.data) setInquiries(inqRes.data); 
        if (funRes && funRes.success) setFunTests(funRes.data); // ✅ Теперь тут реальные тесты
        setContentBlocks({ hero: heroRes, footer: footerRes });
    } catch (error) {
        console.error("Data load error:", error);
        showToast("Ошибка загрузки данных", "error");
    }
  };

  const handleLogin = () => {
    localStorage.setItem('is_admin', 'true');
    setIsAuth(true);
    loadAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('is_admin');
    setIsAuth(false);
  };

  // --- STATS ---
  const stats = useMemo(() => {
    const newBookings = bookings.filter(b => b.status === 'pending').length;
    const newInquiries = inquiries.filter(i => i.status === 'NEW').length; // 👇 Считаем новые заявки
    const totalTours = tours.length;
    const activeTours = tours.filter(t => t.isActive).length;
    const finishedTours = tours.filter(t => new Date(t.date) < new Date()).length;
    
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    const toursThisWeek = tours
        .filter(t => {
            const d = new Date(t.date);
            return d >= now && d <= nextWeek && t.isActive;
        })
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { 
        newBookings, newInquiries, totalTours, activeTours, finishedTours, 
        totalPosts: posts.length, totalGuides: guides.length,
        toursThisWeek 
    };
  }, [bookings, inquiries, tours, posts, guides]);

  const guidesForForm = useMemo(() => guides.map(g => ({ id: g.id, name: g.name })), [guides]);

  // --- HANDLERS ---
  
  const toggleTourStatus = async (tour: Tour) => {
    const newStatus = !tour.isActive;
    setTours(prev => prev.map(t => t.id === tour.id ? { ...t, isActive: newStatus } : t));

    const res = await updateTourStatus(String(tour.id), newStatus);

    if(!res.success) {
        showToast("Ошибка обновления", "error");
        setTours(prev => prev.map(t => t.id === tour.id ? { ...t, isActive: !newStatus } : t));
    }
  };

  const handleSendTg = async (tourId: string, title: string) => {
      const list = bookings.filter(b => b.event_id === tourId && b.status !== 'cancelled');
      if (list.length === 0) return showToast('Список пуст', 'error');
      
      let msg = `📋 *Список группы: ${title}*\n\n`;
      list.forEach((b, i) => msg += `${i+1}. ${b.user_name} (${(b.tickets_adult||0)+(b.tickets_child||0)} чел.)\n📞 ${b.user_phone}\n\n`);
      msg += `\n👥 Всего: ${list.reduce((acc, b) => acc + (b.tickets_adult||0) + (b.tickets_child||0), 0)}`;
      
      const res = await sendToTelegram(msg);
      showToast(res.success ? 'Отправлено в TG!' : 'Ошибка отправки', res.success ? 'success' : 'error');
  };

  const handleStatusChange = async (id: string, status: string) => {
      await updateRegistrationStatus(id, status);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as BookingStatus } : b));
      showToast('Статус обновлен', 'success');
  };

  const handleDelete = async (type: 'tour'|'post'|'guide'|'review', id: string) => {
      if(!confirm('Удалить навсегда?')) return;
      try {
          if(type === 'tour') { await deleteTour(id); setTours(p => p.filter(t => t.id !== id)); }
          if(type === 'post') { await deletePostAction(id); setPosts(p => p.filter(x => x.id !== id)); }
          if(type === 'guide') { await deleteGuideAction(id); setGuides(p => p.filter(x => x.id !== id)); }
          if(type === 'review') { await deleteReview(id); setReviews(p => p.filter(x => x.id !== id)); }
          showToast('Удалено', 'success');
      } catch (e) { showToast('Ошибка удаления', 'error'); }
  };

  const handleFabClick = () => {
      setEditingItem(null);
      if (activeTab === 'tours') setModalState(p => ({...p, tour: true}));
      if (activeTab === 'blog') setModalState(p => ({...p, post: true}));
      if (activeTab === 'guides') setModalState(p => ({...p, guide: true}));
      if (activeTab === 'reviews') setModalState(p => ({...p, review: true}));
      if (activeTab === 'fun') setModalState(p => ({...p, fun: true}));
  };

  // --- POSTS ---
  const togglePostStatus = async (post: any, field: 'isActive' | 'is_trending') => {
      const newVal = !post[field];
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, [field]: newVal } : p));
      await savePostAction({ id: post.id, title: post.title, [field === 'isActive' ? 'is_active' : 'is_trending']: newVal });
  };

  // --- REVIEWS ---
  const toggleReviewStatus = async (review: Review) => {
      const newVal = !review.isActive;
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, isActive: newVal } : r));
      await upsertReview({ ...review, isActive: newVal });
  };

  if (!isAuth) return <LoginModal onClose={() => {}} onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      <AdminNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onFabClick={handleFabClick}
        // 👇 ПЕРЕДАЕМ ОБНОВЛЕННЫЕ СТАТЫ
        stats={{ pendingBookings: stats.newBookings, newInquiries: stats.newInquiries }}
      />
            
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full transition-all duration-300">
        
        {/* VIEW ROUTER */}
        {activeTab === 'dashboard' && (
            <DashboardTab 
                stats={stats}
                onNavigateToBookings={() => setActiveTab('bookings')}
                onEditTour={(tour) => { setEditingItem(tour); setModalState(p => ({...p, tour: true})); }}
            />
        )}

        {activeTab === 'tours' && (
            <ToursTab 
                tours={tours}
                bookings={bookings as any} 
                onAdd={() => { setEditingItem(null); setModalState(p => ({...p, tour: true})); }}
                onEdit={(tour) => { setEditingItem(tour); setModalState(p => ({...p, tour: true})); }}
                onDuplicate={(tour) => { 
                    const { id, ...rest } = tour; 
                    setEditingItem({...rest, title: `${rest.title} (Копия)`, isActive: false, slug: ''}); 
                    setModalState(p => ({...p, tour: true})); 
                }}
                onDelete={(id) => handleDelete('tour', id)}
                onToggleStatus={toggleTourStatus}
                onSendTg={handleSendTg}
            />
        )}

        {activeTab === 'bookings' && (
            <BookingsTab 
                bookings={bookings}
                onStatusChange={handleStatusChange}
            />
        )}

        {/* 👇 НОВАЯ ВКЛАДКА */}
        {activeTab === 'inquiries' && (
            <InquiriesTab inquiries={inquiries} />
        )}

        {activeTab === 'reviews' && (
            <ReviewsTab 
                reviews={reviews}
                onAdd={() => { setEditingItem(null); setModalState(p => ({...p, review: true})); }}
                onEdit={(r) => { setEditingItem(r); setModalState(p => ({...p, review: true})); }}
                onDelete={(id) => handleDelete('review', id)}
                onToggleStatus={toggleReviewStatus}
            />
        )}

        {activeTab === 'guides' && (
            <GuidesTab 
                guides={guides}
                onAdd={() => { setEditingItem(null); setModalState(p => ({...p, guide: true})); }}
                onEdit={(g) => { setEditingItem(g); setModalState(p => ({...p, guide: true})); }}
                onDelete={(id) => handleDelete('guide', id)}
            />
        )}

        {activeTab === 'blog' && (
            <BlogTab
                posts={posts}
                onAdd={() => { setEditingItem(null); setModalState(p => ({...p, post: true})); }}
                onEdit={(post) => { setEditingItem(post); setModalState(p => ({...p, post: true})); }}
                onDuplicate={(post) => { 
                    const { id, ...rest } = post; 
                    setEditingItem({ ...rest, title: `${rest.title} (Копия)`, slug: '' }); 
                    setModalState(p => ({...p, post: true})); 
                }}
                onDelete={(id) => handleDelete('post', id)}
                onToggleStatus={togglePostStatus}
            />
        )}

        {activeTab === 'content' && (
            <ContentTab onEdit={(slug) => { 
                setEditingSlug(slug); 
                setModalState(p => ({...p, content: true})); 
            }} />
        )}
       {activeTab === 'fun' && (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Фан-сектор (Тесты)</h2>
        <p className="text-sm text-slate-500 mt-1">Управляй карточками тестов на сайте</p>
      </div>
      
      {/* Кнопка добавления нового теста */}
      <button
        onClick={() => {
          setEditingItem(null); // Важно: очищаем форму для создания НОВОГО теста
          setModalState(p => ({...p, fun: true})); // Открываем модалку Фан-сектора
        }}
        className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
      >
        <Plus size={18} />
        Добавить тест
      </button>
    </div>

    <FunTestTable 
      initialTests={funTests} 
      onEdit={(test) => { 
        setEditingItem(test); 
        setModalState(p => ({...p, fun: true})); 
      }} 
    />
  </div>
        )}

      </main>

      {/* МОДАЛКИ */}
      {modalState.tour && (
        <TourForm 
            initialData={editingItem} 
            guides={guidesForForm}
            onClose={() => setModalState(p => ({ ...p, tour: false }))}
            onSuccess={async () => {
                setModalState(p => ({ ...p, tour: false }));
                await loadAllData(); 
                showToast('Тур успешно сохранен', 'success');
            }}
        />
      )}
      
      {modalState.guide && (
          <GuideForm 
            initialData={editingItem}
            onClose={() => setModalState(p => ({ ...p, guide: false }))}
            // 👇 Надежно и строго: мы ожидаем объект (Record)
            onSubmit={async (data: Record<string, any>) => { await saveGuideAction(data); loadAllData(); }}
          />
      )}
      
      {modalState.post && (
     <PostForm
            initialData={editingItem}
            onClose={() => setModalState(p => ({ ...p, post: false }))}
            // 👇 ИСПРАВЛЕНО: добавлена строгая типизация (data: Record<string, unknown>)
            onSubmit={async (data: Record<string, unknown>) => { await savePostAction(data); loadAllData(); }}
          />
      )}

      {modalState.review && (
          <ReviewForm
            initialData={editingItem}
            onClose={() => setModalState(p => ({ ...p, review: false }))}
            onSuccess={() => { setModalState(p => ({ ...p, review: false })); loadAllData(); showToast('Отзыв сохранен', 'success'); }}
          />
      )}
      
      {modalState.content && (
          <ContentForm
            slug={editingSlug}
            initialContent={contentBlocks[editingSlug]}
            onClose={() => setModalState(p => ({ ...p, content: false }))}
            onSubmit={async (s, d) => { await saveContentBlockAction(s, d); loadAllData(); }}
          />
      )}
      {modalState.fun && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl relative shadow-2xl my-auto">
             <button onClick={() => setModalState(p => ({...p, fun: false}))} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 z-10 p-2">
                <X size={24}/>
             </button>
             <FanForm 
                initialData={editingItem} 
                onSuccess={() => { setModalState(p => ({...p, fun: false})); loadAllData(); showToast('Карточка сохранена', 'success'); }}
             />
          </div>
        </div>
      )}

      <AiAssistant />
    </div>
  );
}