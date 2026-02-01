'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import TourPage from '../../../src/components/TourPage'
import { useEvents } from '../../../src/lib/hooks'
import Button from '../../../src/components/ui/Button'
import { X } from 'lucide-react'

export default function TourPageRoute() {
  const params = useParams()
  const { events, bookEvent } = useEvents()
  const [showRegModal, setShowRegModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [regForm, setRegForm] = useState({ name: '', phone: '', tickets: 1 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  
  const handleRegister = (event) => {
    setSelectedEvent(event)
    setRegForm({ name: '', phone: '', tickets: 1 })
    setShowRegModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!regForm.name || !regForm.phone) {
      alert('Укажите имя и телефон')
      return
    }

    setIsSubmitting(true)
    const { error } = await bookEvent({
      eventId: selectedEvent.id,
      formData: regForm,
      totalPrice: selectedEvent.price.adult * regForm.tickets
    })
    
    if (!error) {
      alert('Спасибо за регистрацию! ✓')
      setShowRegModal(false)
    } else {
      alert(error.message || 'Ошибка регистрации')
    }
    setIsSubmitting(false)
  }
  
  return (
    <>
      <TourPage 
        events={events} 
        onRegister={handleRegister}
      />

      {/* Модальное окно регистрации */}
      {showRegModal && selectedEvent && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn" 
          onClick={() => setShowRegModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowRegModal(false)} 
              aria-label="Закрыть" 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24}/>
            </button>
            <h2 className="text-xl font-bold mb-1 pr-8 text-gray-500">Запись на тур</h2>
            <h3 className="text-2xl font-bold mb-4 font-condensed uppercase">{selectedEvent.title}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Имя</label>
                <input 
                  value={regForm.name} 
                  onChange={e => setRegForm({...regForm, name: e.target.value})} 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" 
                  placeholder="Как к вам обращаться?"
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Телефон</label>
                <input 
                  value={regForm.phone} 
                  onChange={e => setRegForm({...regForm, phone: e.target.value})} 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" 
                  placeholder="+373..."
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Количество мест</label>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedEvent.spotsLeft} 
                  value={regForm.tickets} 
                  onChange={e => setRegForm({...regForm, tickets: +e.target.value})} 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              
              <Button 
                type="submit"
                isLoading={isSubmitting} 
                variant="primary" 
                className="w-full mt-2"
              >
                Записаться
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}