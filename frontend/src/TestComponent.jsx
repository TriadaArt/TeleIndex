import React, { useState } from 'react';
import AuthModal from './components/AuthModal';

const TestComponent = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('login');

  const openLogin = () => {
    setModalMode('login');
    setModalOpen(true);
  };

  const openRegister = () => {
    setModalMode('register');
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-6 animate-pulse">
          🚀 TeleIndex LIVE!
        </h1>
        <p className="text-xl mb-8 opacity-90">
          Модальные окна аутентификации готовы
        </p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={openLogin}
            className="bg-white/20 backdrop-blur border border-white/30 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105"
          >
            Войти
          </button>
          
          <button
            onClick={openRegister}
            className="bg-green-500 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Регистрация
          </button>
        </div>

        <div className="mt-12 text-sm opacity-70">
          Создано с использованием React + Framer Motion + Tailwind CSS
        </div>
      </div>

      <AuthModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
        onSuccess={() => {
          setModalOpen(false);
          alert('Успешная аутентификация!');
        }}
      />
    </div>
  );
};

export default TestComponent;