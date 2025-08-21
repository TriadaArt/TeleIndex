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
  const [sortBy, setSortBy] = useState('popular');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Mock data для демонстрации
  const mockChannels = [
    {
      id: 1,
      name: 'Новости 24/7',
      description: 'Круглосуточные главные события, коротко и по делу.',
      subscribers: 412000,
      views: null,
      er: 5.2,
      cpm: 450,
      cpv: null,
      price: 18000,
      avatar: 'H2',
      category: 'Новости',
      language: 'Русский',
      location: 'Россия • Москва'
    },
    {
      id: 2,
      name: 'Технологии Будущего',
      description: 'Последние новости из мира высоких технологий и инноваций.',
      subscribers: 285000,
      views: 145000,
      er: 4.8,
      cpm: 380,
      cpv: 12,
      price: 15000,
      avatar: 'TB',
      category: 'Технологии',
      language: 'Русский',
      location: 'Россия • Санкт-Петербург'
    },
    {
      id: 3,
      name: 'Бизнес Инсайты',
      description: 'Аналитика рынков, стратегии развития и экспертные мнения.',
      subscribers: 156000,
      views: 89000,
      er: 6.1,
      cpm: 520,
      cpv: 18,
      price: 22000,
      avatar: 'БИ',
      category: 'Бизнес',
      language: 'Русский',
      location: 'Россия • Москва'
    },
    {
      id: 4,
      name: 'Здоровый Образ Жизни',
      description: 'Советы по питанию, тренировкам и поддержанию здоровья.',
      subscribers: 198000,
      views: 112000,
      er: 5.7,
      cpm: 410,
      cpv: 15,
      price: 16500,
      avatar: 'ЗОЖ',
      category: 'Здоровье',
      language: 'Русский',
      location: 'Россия • Екатеринбург'
    }
  ];

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ name: "Пользователь" });
    }

    // Set mock data
    setChannels(mockChannels);
    setCategories([
      { id: 1, name: 'Новости' },
      { id: 2, name: 'Технологии' },
      { id: 3, name: 'Бизнес' },
      { id: 4, name: 'Здоровье' },
      { id: 5, name: 'Образование' },
      { id: 6, name: 'Развлечения' }
    ]);
  }, []);

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

  const sortOptions = [
    { key: 'popular', label: 'Популярные' },
    { key: 'new', label: 'Новые' },
    { key: 'name', label: 'По имени' },
    { key: 'price', label: 'Цена' },
    { key: 'er', label: 'ER' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iIzMzMzMzMyIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-20"></div>
        
        {/* Header Navigation */}
        <header className="relative px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">T</span>
              </div>
              <span className="text-lg font-semibold">TeleIndex</span>
            </div>
            
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm opacity-90">
                  Добро пожаловать, {user.name}!
                </span>
                <button 
                  className="text-sm bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg transition-colors" 
                  onClick={handleLogout}
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  className="text-sm text-white/90 hover:text-white transition-colors" 
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

        {/* Hero Content */}
        <div className="relative px-4 pb-12 pt-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm opacity-80 mb-2">TELEINDEX</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Каталог Telegram-каналов
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Подборка проверенных блогеров. Метрики, цены и охваты — в одном месте.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">T</span>
            </div>
            <span className="font-semibold text-gray-900">TeleIndex</span>
          </div>
          <button className="text-sm text-gray-600 hover:text-gray-900">
            Каталог
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Фильтр</h3>
              
              <div className="space-y-6">
                {/* Search */}
                <div>
                  <input 
                    type="text"
                    placeholder="Поиск..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Категория
                  </label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Выбрать категории</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Social Network */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Социальная сеть
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Telegram</option>
                    <option>Instagram</option>
                    <option>YouTube</option>
                    <option>VK</option>
                  </select>
                </div>

                {/* Gender Blogger */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Пол блогера
                  </label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                      Мужской
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                      Женский
                    </button>
                  </div>
                </div>

                {/* Gender Audience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Пол аудитории
                  </label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                      Мужской
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                      Женский
                    </button>
                  </div>
                </div>

                {/* Subscribers Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Количество подписчиков
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="от"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input 
                      type="text" 
                      placeholder="до"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Views */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Охваты
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="от"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input 
                      type="text" 
                      placeholder="до"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Sort Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {sortOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    sortBy === option.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Channel Cards */}
            <div className="space-y-4">
              {channels.map((channel) => (
                <div key={channel.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {channel.avatar}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{channel.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <span>{channel.category}</span>
                            <span>•</span>
                            <span>{channel.language}</span>
                            <span>•</span>
                            <span>{channel.location}</span>
                          </div>
                        </div>
                        
                        {/* Format and Post Count */}
                        <div className="text-right flex-shrink-0">
                          <select className="text-sm border border-gray-200 rounded px-2 py-1">
                            <option>1/24</option>
                          </select>
                          <select className="text-sm border border-gray-200 rounded px-2 py-1 ml-2">
                            <option>1</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-3">{channel.description}</p>

                      {/* Metrics */}
                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <span>👥</span>
                          <span>{channel.subscribers.toLocaleString()}</span>
                        </div>
                        {channel.views && (
                          <div className="flex items-center gap-1">
                            <span>👁</span>
                            <span>Просм.</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>📊</span>
                          <span>ER {channel.er}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>💰</span>
                          <span>CPM ₽ {channel.cpm}</span>
                        </div>
                        {channel.cpv && (
                          <div className="flex items-center gap-1">
                            <span>📺</span>
                            <span>CPV</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>⏰</span>
                          <span>3 дн.</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-end">
                        <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold">
                          {channel.price.toLocaleString()} ₽
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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