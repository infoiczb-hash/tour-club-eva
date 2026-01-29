import React from 'react';
import { CheckCircle, AlertCircle, Loader, X } from 'lucide-react';

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-slideIn ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
    {type === 'success' && <CheckCircle size={24} />}
    {type === 'error' && <AlertCircle size={24} />}
    {type === 'info' && <Loader size={24} className="animate-spin" />}
    <span className="font-semibold">{message}</span>
    <button onClick={onClose} className="ml-4 hover:opacity-80"><X size={20} /></button>
  </div>
);

export default Toast;
