import React, { useState, useEffect, useRef } from 'react';
import AuthModal from './components/AuthModal';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CatalogWithAuth = () => {
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ name: "Пользователь" });
    }

    // Load channels and categories
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [channelsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/channels`),
        axios.get(`${API}/categories`)
      ]);
      setChannels(channelsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleAuthSuccess = (userData) => {
    setAuthModalOpen(false);
    setUser(userData || { name: "Пользователь" });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full sticky top-0 z-10 backdrop-blur bg-white/80 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" />
            <h1 className="font-semibold text-lg">TeleIndex</h1>
          </div>
          <div className="flex-1 hidden md:block">
            <input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Поиск каналов..." 
              className="w-full h-11 rounded-xl border px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Добро пожаловать, {user.name}!
              </span>
              <button 
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors" 
                onClick={handleLogout}
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors" 
                onClick={openLoginModal}
              >
                Войти
              </button>
              <button 
                className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors" 
                onClick={openRegisterModal}
              >
                Регистрация
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Каталог Telegram-каналов</h2>
          <p className="text-gray-600">Подборка проверенных блогеров. Метрики, цены и охваты — в одном месте.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Фильтры</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Категория
                  </label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2">
                    <option>Все категории</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Подписчики
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1000000" 
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.length > 0 ? channels.map((channel) => (
                <div key={channel.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                      {channel.name?.[0]?.toUpperCase() || 'T'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>👥 {channel.subscribers?.toLocaleString() || 'N/A'}</span>
                        <span>📊 ER {channel.er || 'N/A'}%</span>
                        <span>💰 {channel.price || 'По запросу'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                // Demo channels when API is not available
                [...Array(6)].map((_, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                        T
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Telegram Канал {idx + 1}</h3>
                        <p className="text-sm text-gray-600 mt-1">Описание канала и его тематика</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>👥 {(Math.random() * 100000).toFixed(0)}</span>
                          <span>📊 ER {(Math.random() * 10).toFixed(1)}%</span>
                          <span>💰 {Math.floor(Math.random() * 50000)} ₽</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default CatalogWithAuth;