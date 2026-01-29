import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const LoginModal = ({ onClose, onLogin }) => {
    const [pass, setPass] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if(pass === 'admin') onLogin();
        else alert('Error');
    };

    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock className="text-teal-600"/> Вход для администратора</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
                autoFocus 
                type="password" 
                placeholder="Пароль (admin)" 
                className="w-full p-3 border rounded-xl text-center" 
                value={pass} 
                onChange={e=>setPass(e.target.value)}
            />
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-500">Отмена</button>
                <button type="submit" className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold">Войти</button>
            </div>
          </form>
        </div>
      </div>
    );
};

export default LoginModal;
