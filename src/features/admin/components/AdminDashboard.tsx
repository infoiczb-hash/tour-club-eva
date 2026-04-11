// src/features/admin/components/AdminDashboard.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { Tour } from '@/features/tours/types'; 
import { Blog, BookingStatus, Guide, Review, Inquiry, FunTest, TourCategory, BlogCategory } from '@prisma/client'; 
import AdminNavigation from './AdminNavigation';
import FunTestTable from '@/features/admin/components/FunTestTab';
import FanForm from '@/features/admin/components/FanForm';

// VIEWS
import DashboardTab from './views/DashboardTab';
import BookingsTab from './views/BookingsTab';
import ToursTab from './views/ToursTab';
import ReviewsTab from './views/ReviewsTab';
import BlogTab from './views/BlogTab';
import GuidesTab from './views/GuidesTab';
import ContentTab from './views/ContentTab';
import InquiriesTab from './views/InquiriesTab';
import CategoryForm from './views/CategoryForm'; 
import { getGroupsManifest, GetGroupsManifestResult } from '@/features/admin/actions';
import { GroupManifest } from './views/BookingsTab';

// FORMS
import TourForm from './TourForm'; 
import GuideForm from './GuideForm';
import PostForm from './PostForm';
import ContentForm from './ContentForm';
import ReviewForm from './ReviewForm'; 
import AiAssistant from './AiAssistant';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// ACTIONS & API
import { saveTour,getToursAdmin,  updateTourStatus } from '@/features/admin/actions/tour'; 
import { deleteTour } from '@/features/tours/actions';
import { getInquiriesAction } from '@/features/admin/actions/inquiries';
import { getFunTestsAction } from '@/features/admin/actions/fun';
import { getReviews, deleteReview, upsertReview } from '@/features/reviews/actions';
import { sendToTelegram } from '@/features/admin/actions/telegram';
import { getGuides } from '@/features/guides/api';
import { getBlogPosts } from '@/features/blog/api';
import { getContentBlock } from '@/lib/api';

import { upsertGuideAction } from '@/features/admin/actions/guides';

import { 
  deleteGuideAction, 
  savePostAction, 
  deletePostAction, 
  togglePostStatusAction, 
  SavePostPayload,        
  saveContentBlockAction, 
  getRegistrationsAction 
} from '@/features/admin/actions';
import { updateBookingStatusAction } from '@/features/admin/actions/bookingStatus';

import {  
  getTourCategoriesAction, getBlogCategoriesAction,
  upsertTourCategoryAction, upsertBlogCategoryAction,
  deleteTourCategoryAction, deleteBlogCategoryAction,
  toggleTourCategoryStatusAction, toggleBlogCategoryStatusAction 
} from '@/features/admin/actions/categories';

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
  tickets_family: number; 
  tickets_member: number;
  
  total_price: number;
  amount_paid: number;    
  source: string;    
  payment_method: string; 
  discount: number;       
  tourId: string;         
   
  comment?: string | null;
  social?: string | null;
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
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsSearch, setBookingsSearch] = useState('');
  const [bookingsFilterTab, setBookingsFilterTab] = useState<'active' | 'archive'>('active');
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [toursPage, setToursPage] = useState(1);
  const [toursTotal, setToursTotal] = useState(0);
  const [toursSearch, setToursSearch] = useState('');
  const [toursFilter, setToursFilter] = useState<'all' | 'upcoming' | 'past' | 'full'>('all');
  const [toursLoading, setToursLoading] = useState(false);

  // --- Стейты для групп (манифест) ---
  const [groupsManifest, setGroupsManifest] = useState<GroupManifest[]>([]);
  const [groupsTotal, setGroupsTotal] = useState(0);
  const [groupsPage, setGroupsPage] = useState(1);
  const [groupsLimit] = useState(20);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsSearch, setGroupsSearch] = useState('');
  const [groupsSort, setGroupsSort] = useState<'date_asc' | 'date_desc'>('date_asc');

  // Data State
  const [tours, setTours] = useState<Tour[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [posts, setPosts] = useState<Blog[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  
  const [contentBlocks, setContentBlocks] = useState<Record<string, Record<string, unknown> | null>>({});
  const [funTests, setFunTests] = useState<FunTest[]>([]);
  
  // Categories State
  const [tourCategories, setTourCategories] = useState<TourCategory[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<TourCategory | BlogCategory | null>(null);
  const [categoryType, setCategoryType] = useState<'tour' | 'blog'>('tour');

  // Modals
  const [modalState, setModalState] = useState({
    tour: false, 
    guide: false, 
    post: false, 
    content: false, 
    review: false, 
    fun: false, 
    category: false 
  });
  
  const [editingItem, setEditingItem] = useState<unknown>(null);
  const [editingSlug, setEditingSlug] = useState('');

  const router = useRouter();

  // --- Загрузка групп (манифест) ---
type GetGroupsManifestResult =
  | { success: true; groups: GroupManifest[]; total: number }
  | { success: false; error: string };

const loadGroupsManifest = useCallback(async () => {
  setGroupsLoading(true);
  try {
    const result = await getGroupsManifest({
      page: groupsPage,
      limit: groupsLimit,
      search: groupsSearch,
      sortBy: groupsSort,
    });

    if (result.success) {
      setGroupsManifest(result.groups);
      setGroupsTotal(result.total);
    } else {
      showToast(result.error, 'error');
    }
  } catch (error) {
    console.error(error);
    showToast('Ошибка загрузки групп', 'error');
  } finally {
    setGroupsLoading(false);
  }
}, [groupsPage, groupsLimit, groupsSearch, groupsSort, showToast]);

  // --- Обработчики для групп ---
  const handleGroupsSearchChange = (val: string) => {
    setGroupsSearch(val);
    setGroupsPage(1);
  };
  const handleGroupsSortChange = (sort: 'date_asc' | 'date_desc') => {
    setGroupsSort(sort);
    setGroupsPage(1);
  };
  const handleGroupsPageChange = (page: number) => setGroupsPage(page);

  // --- INIT ---
  useEffect(() => {
    setIsAuth(true);
    loadAllData();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [bookingsPage, bookingsSearch, bookingsFilterTab]);

  // Загрузка групп при изменении параметров
  useEffect(() => {
    loadGroupsManifest();
  }, [loadGroupsManifest]);

  const loadAllData = async () => {
    try {
      const [bRes, gRes, pRes, rRes, inqRes, funRes, heroRes, footerRes, tCatRes, bCatRes] = await Promise.all([
        getRegistrationsAction({
          page: bookingsPage,
          limit: 20,
          search: bookingsSearch,
          filterTab: bookingsFilterTab,
        }),
        getGuides(),
        getBlogPosts({ includeDrafts: true }),
        getReviews(),
        getInquiriesAction(),
        getFunTestsAction(),
        getContentBlock('hero'),
        getContentBlock('footer'),
        getTourCategoriesAction(),
        getBlogCategoriesAction()
      ]);

      if (bRes.success && bRes.data) {
        setBookings(bRes.data as BookingItem[]);
        setBookingsTotal(bRes.total);
      }
      setGuides(gRes as unknown as GuideItem[]);
      setPosts(pRes as Blog[]);
      setReviews(rRes);
      if (inqRes.success && inqRes.data) setInquiries(inqRes.data);
      if (funRes && funRes.success) setFunTests(funRes.data);
      setContentBlocks({ hero: heroRes, footer: footerRes });
      if (tCatRes && tCatRes.success) setTourCategories(tCatRes.data || []);
      if (bCatRes && bCatRes.success) setBlogCategories(bCatRes.data || []);
    } catch (error) {
      console.error("Data load error:", error);
      showToast("Ошибка загрузки данных", "error");
    }
  };

  const loadTours = useCallback(async () => {
    setToursLoading(true);
    const res = await getToursAdmin({
      page: toursPage,
      limit: 20,
      search: toursSearch,
      filter: toursFilter,
    });
    if (res.success) {
      setTours(res.tours);
      setToursTotal(res.total);
    }
    setToursLoading(false);
  }, [toursPage, toursSearch, toursFilter]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  // ==========================================
  // ОБРАБОТЧИКИ КАТЕГОРИЙ
  // ==========================================
  const handleSaveCategory = async (data: Record<string, unknown>) => {
    const action = categoryType === 'tour' ? upsertTourCategoryAction : upsertBlogCategoryAction;
    const res = await action(data);
    if (res.success) {
      showToast('Категория сохранена!', 'success');
      setModalState(p => ({ ...p, category: false }));
      loadAllData();
    } else {
      showToast(res.error || 'Ошибка сохранения', 'error');
    }
  };

  const handleDeleteCategory = async (id: string, type: 'tour' | 'blog') => {
    if (!confirm('Точно удалить эту категорию?')) return;
    const action = type === 'tour' ? deleteTourCategoryAction : deleteBlogCategoryAction;
    const res = await action(id);
    if (res.success) {
      showToast('Категория удалена', 'success');
      loadAllData();
    } else {
      showToast(res.error || 'Ошибка удаления', 'error');
    }
  };

  const handleToggleCategory = async (id: string, currentStatus: boolean, type: 'tour' | 'blog') => {
    const action = type === 'tour' ? toggleTourCategoryStatusAction : toggleBlogCategoryStatusAction;
    const res = await action(id, currentStatus);
    if (res.success) {
      showToast('Статус обновлен', 'success');
      loadAllData();
    } else {
      showToast(res.error || 'Ошибка обновления', 'error');
    }
  };

  const openCategoryModal = (type: 'tour' | 'blog', category: TourCategory | BlogCategory | null = null) => {
    setCategoryType(type);
    setEditingCategory(category);
    setModalState(p => ({ ...p, category: true }));
  };

  // --- STATS ---
  const stats = useMemo(() => {
    const newBookings = bookings.filter(b => b.status === 'pending').length;
    const newInquiries = inquiries.filter(i => i.status === 'NEW').length;
    const totalTours = tours.length;
    const activeTours = tours.filter(t => t.isActive).length;
    const finishedTours = tours.filter(t => new Date(t.date) < new Date()).length;
    
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);
    
    const toursThisWeek = tours
        .filter(t => {
            const d = new Date(t.date);
            return d >= now && d <= nextWeek && t.isActive;
        })
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const toursThisMonth = tours.filter(t => {
        const d = new Date(t.date);
        return d >= now && d <= nextMonth && t.isActive;
    });

    return { 
        newBookings, 
        newInquiries, 
        totalTours, 
        activeTours, 
        finishedTours, 
        totalPosts: posts.length, 
        totalGuides: guides.length,
        toursThisWeek,
        toursThisMonth,
        allBookings: bookings
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
      
      let msg = `📋 <b>Список группы: ${title}</b>\n\n`;
      list.forEach((b, i) => msg += `${i+1}. ${b.user_name} (${(b.tickets_adult||0)+(b.tickets_child||0)} чел.)\n📞 ${b.user_phone}\n\n`);
      msg += `\n👥 <b>Всего: ${list.reduce((acc, b) => acc + (b.tickets_adult||0) + (b.tickets_child||0), 0)} чел.</b>`;
      
      const res = await sendToTelegram(msg);
      showToast(res.success ? 'Отправлено в TG!' : 'Ошибка отправки', res.success ? 'success' : 'error');
  };

  const handleStatusChange = async (id: string, status: string) => {
      // Вызываем новый экшен. Он сам внутри дернет NotificationHub.dispatch()
      const res = await updateBookingStatusAction(id, status as BookingStatus);
      
      if (res.success) {
          setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as BookingStatus } : b));
          showToast('Статус обновлен', 'success');
      } else {
          showToast(res.error || 'Ошибка обновления статуса', 'error');
      }
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

  const togglePostStatus = async (post: Blog, field: 'isActive' | 'is_trending') => {
      const newVal = !post[field];
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, [field]: newVal } : p));
      await togglePostStatusAction(post.id, field, newVal);
  };

  const toggleReviewStatus = async (review: Review) => {
      const newVal = !review.isActive;
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, isActive: newVal } : r));
      await upsertReview({ ...review, isActive: newVal });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      <AdminNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onFabClick={handleFabClick}
        stats={{ pendingBookings: stats.newBookings, newInquiries: stats.newInquiries }}
      />
            
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full transition-all duration-300">
        
        {/* --- 1. Dashboard --- */}
        {activeTab === 'dashboard' && (
            <DashboardTab 
                stats={stats}
                onNavigateToBookings={() => setActiveTab('bookings')}
                onEditTour={(tour) => { setEditingItem(tour); setModalState(p => ({...p, tour: true})); }}
            />
        )}

        {/* --- 2. Tours & Categories --- */}
        {activeTab === 'tours' && (
          <ToursTab
            tours={tours}
            total={toursTotal}
            page={toursPage}
            limit={20}
            loading={toursLoading}
            searchTerm={toursSearch}
            filter={toursFilter}
            bookings={bookings as any}
            categories={tourCategories}
            onSearchChange={(val) => { setToursSearch(val); setToursPage(1); }}
            onFilterChange={(f) => { setToursFilter(f); setToursPage(1); }}
            onPageChange={(page) => setToursPage(page)}
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
            onAddCategory={() => openCategoryModal('tour')}
            onEditCategory={(cat) => openCategoryModal('tour', cat)}
            onDeleteCategory={handleDeleteCategory}
            onToggleCategoryStatus={handleToggleCategory}
          />
        )}

        {/* --- 3. Bookings (CRM) с передачей всех пропсов для групп --- */}
        {activeTab === 'bookings' && (
            <BookingsTab
                bookings={bookings}
                total={bookingsTotal}
                page={bookingsPage}
                limit={20}
                loading={bookingsLoading}
                searchTerm={bookingsSearch}
                filterTab={bookingsFilterTab}
                onSearchChange={(val) => { setBookingsSearch(val); setBookingsPage(1); }}
                onFilterTabChange={(tab) => { setBookingsFilterTab(tab); setBookingsPage(1); }}
                onPageChange={(page) => setBookingsPage(page)}
                onStatusChange={handleStatusChange}
                // Пропсы для групп (манифест)
                groupsManifest={groupsManifest}
                groupsTotal={groupsTotal}
                groupsPage={groupsPage}
                groupsLimit={groupsLimit}
                groupsLoading={groupsLoading}
                groupsSearch={groupsSearch}
                groupsSort={groupsSort}
                onGroupsSearchChange={handleGroupsSearchChange}
                onGroupsSortChange={handleGroupsSortChange}
                onGroupsPageChange={handleGroupsPageChange}
            />
        )}

        {/* --- 4. Inquiries --- */}
        {activeTab === 'inquiries' && (
            <InquiriesTab inquiries={inquiries} />
        )}

        {/* --- 5. Reviews --- */}
        {activeTab === 'reviews' && (
            <ReviewsTab 
                reviews={reviews}
                onAdd={() => { setEditingItem(null); setModalState(p => ({...p, review: true})); }}
                onEdit={(r) => { setEditingItem(r); setModalState(p => ({...p, review: true})); }}
                onDelete={(id) => handleDelete('review', id)}
                onToggleStatus={toggleReviewStatus}
            />
        )}

        {/* --- 6. Guides --- */}
        {activeTab === 'guides' && (
            <GuidesTab 
                guides={guides}
                onAdd={() => { setEditingItem(null); setModalState(p => ({...p, guide: true})); }}
                onEdit={(g) => { setEditingItem(g); setModalState(p => ({...p, guide: true})); }}
                onDelete={(id) => handleDelete('guide', id)}
            />
        )}

        {/* --- 7. Blog --- */}
        {activeTab === 'blog' && (
            <BlogTab
                posts={posts}
                categories={blogCategories}
                onAdd={() => { setEditingItem(null); setModalState(p => ({...p, post: true})); }}
                onEdit={(post) => { setEditingItem(post); setModalState(p => ({...p, post: true})); }}
                onDuplicate={(post) => { 
                    const { id, ...rest } = post; 
                    setEditingItem({ ...rest, title: `${rest.title} (Копия)`, slug: '' }); 
                    setModalState(p => ({...p, post: true})); 
                }}
                onDelete={(id) => handleDelete('post', id)}
                onToggleStatus={togglePostStatus}
                onAddCategory={() => openCategoryModal('blog')}
                onEditCategory={(cat) => openCategoryModal('blog', cat)}
                onDeleteCategory={handleDeleteCategory}
                onToggleCategoryStatus={handleToggleCategory}
            />
        )}

        {/* --- 8. Content Blocks --- */}
        {activeTab === 'content' && (
            <ContentTab onEdit={(slug) => { 
                setEditingSlug(slug); 
                setModalState(p => ({...p, content: true})); 
            }} />
        )}

        {/* --- 9. Fan Sector --- */}
        {activeTab === 'fun' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Фан-сектор (Тесты)</h2>
                <p className="text-sm text-slate-500 mt-1">Управляй карточками тестов на сайте</p>
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setModalState(p => ({...p, fun: true}));
                }}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
              >
                <Plus size={18} /> Добавить тест
              </button>
            </div>
            <FunTestTable 
              initialTests={funTests} 
              onEdit={(test) => { setEditingItem(test); setModalState(p => ({...p, fun: true})); }} 
            />
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      {/* Tour Modal */}
      {modalState.tour && (
        <TourForm 
            initialData={editingItem as React.ComponentProps<typeof TourForm>['initialData']} 
            guides={guidesForForm}
            categories={tourCategories}
            onClose={() => setModalState(p => ({ ...p, tour: false }))}
            onSuccess={async () => {
                setModalState(p => ({ ...p, tour: false }));
                await loadAllData(); 
                router.refresh();
                showToast('Тур успешно сохранен', 'success');
            }}
        />
      )}
      
      {/* Guide Modal */}
      {modalState.guide && (
          <GuideForm 
            initialData={editingItem as React.ComponentProps<typeof GuideForm>['initialData']}
            onClose={() => setModalState(p => ({ ...p, guide: false }))}
            onSubmit={async (data: Record<string, unknown>) => { 
                const res = await upsertGuideAction(data); 
                if (res.success) {
                    showToast('Досье гида сохранено!', 'success');
                    await loadAllData();
                } else {
                    showToast(res.error || 'Ошибка при сохранении гида', 'error');
                }
            }}
          />
      )}
      
      {/* Post Modal */}
      {modalState.post && (
         <PostForm
            initialData={editingItem as React.ComponentProps<typeof PostForm>['initialData']}
            categories={blogCategories}
            onClose={() => setModalState(p => ({ ...p, post: false }))}
            onSubmit={async (data: Record<string, unknown>) => { 
                await savePostAction(data as unknown as SavePostPayload); 
                loadAllData(); 
            }}
        />
      )}

      {/* Review Modal */}
      {modalState.review && (
          <ReviewForm
            initialData={editingItem as React.ComponentProps<typeof ReviewForm>['initialData']}
            onClose={() => setModalState(p => ({ ...p, review: false }))}
            onSuccess={() => { setModalState(p => ({ ...p, review: false })); loadAllData(); showToast('Отзыв сохранен', 'success'); }}
          />
      )}
      
      {/* Content Block Modal */}
      {modalState.content && (
          <ContentForm
            slug={editingSlug}
            initialContent={contentBlocks[editingSlug] as React.ComponentProps<typeof ContentForm>['initialContent']}
            onClose={() => setModalState(p => ({ ...p, content: false }))}
            onSubmit={async (s, d) => { await saveContentBlockAction(s, d); loadAllData(); }}
          />
      )}
      
      {/* Fun Sector Modal */}
      {modalState.fun && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl relative shadow-2xl my-auto">
             <button onClick={() => setModalState(p => ({...p, fun: false}))} className="absolute top-4 right-4 text-slate-500 hover:text-red-500 z-10 p-2">
                <X size={24}/>
             </button>
             <FanForm 
                initialData={editingItem as React.ComponentProps<typeof FanForm>['initialData']} 
                onSuccess={() => { setModalState(p => ({...p, fun: false})); loadAllData(); showToast('Карточка сохранена', 'success'); }}
             />
          </div>
        </div>
      )}

      {/* Category Modal */}
      {modalState.category && (
        <CategoryForm
          initialData={editingCategory as React.ComponentProps<typeof CategoryForm>['initialData']}
          type={categoryType}
          onClose={() => setModalState(p => ({ ...p, category: false }))}
          onSubmit={handleSaveCategory}
        />
      )}
            
      <AiAssistant />
    </div>
  );
}