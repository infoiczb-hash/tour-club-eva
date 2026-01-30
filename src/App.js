import React, { useState, useEffect } from 'react';
// 1. В ИМПОРТЕ УБРАЛИ BrowserRouter. Оставили только Routes, Route и useNavigate
import { Routes, Route, useNavigate } from 'react-router-dom';

// ... твои остальные импорты (HomePage, TourPage и т.д.) ...

function App() {
    // ... твой код со стейтами (events, loading, viewMode и т.д.) ...
    
    // Хук для правильной навигации
    const navigate = useNavigate();

    return (
        // 2. УДАЛИЛИ ТЕГ <Router> ЗДЕСЬ
        <div className="min-h-screen bg-[#f0fdfa] font-sans">
            <Routes>
                {/* ГЛАВНАЯ СТРАНИЦА */}
                <Route path="/" element={
                    <HomePage 
                        events={events} loading={loading} viewMode={viewMode} setViewMode={setViewMode}
                        filterType={filterType} setFilterType={setFilterType} isAdmin={isAdmin}
                        t={t} language={language} setLanguage={setLanguage} setShowLogin={setShowLogin}
                        handleDelete={(id) => {if(window.confirm('Удалить?')) deleteEvent(id)}}
                        openEditModal={(ev) => {setEditingEvent(ev); setShowFormModal(true);}}
                        openCreateModal={() => {setEditingEvent(null); setShowFormModal(true);}}
                        
                        // ✅ ИСПРАВЛЕНИЕ: Используем navigate вместо window.location.href
                        // Это делает переход мгновенным, без белого экрана
                        onSelectEvent={(event) => navigate(`/tour/${event.id}`)} 
                    />
                } />

                {/* СТРАНИЦА ТУРА */}
                <Route path="/tour/:id" element={
                    <TourPage 
                        events={events} 
                        onRegister={(event) => {
                            setSelectedEventForReg(event);
                            setRegForm({name: '', phone: '', tickets: 1});
                            setShowRegModal(true);
                        }} 
                    />
                } />
            </Routes>
            
            {/* Тут твои модальные окна (Modal, Toast и т.д.) */}
            
        </div>
        // 2. УДАЛИЛИ ЗАКРЫВАЮЩИЙ ТЕГ </Router> ЗДЕСЬ
    );
}

export default App;
