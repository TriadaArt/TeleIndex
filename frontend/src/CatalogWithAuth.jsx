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
  const [creators, setCreators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    category: '',
    minSubs: '',
    maxSubs: '',
    minViews: '',
    maxViews: '',
    featured: null,
    verified: null
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token and get user info
      verifyToken(token);
    }

    // Load data
    loadInitialData();
  }, []);

  useEffect(() => {
    loadChannels();
  }, [q, sortBy, selectedCategory, currentPage, filters]);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem("token");
    }
  };

  const loadInitialData = async () => {
    try {
      const [categoriesRes, creatorsRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/creators?limit=10`)
      ]);
      
      setCategories(categoriesRes.data || []);
      setCreators(creatorsRes.data?.items || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadChannels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (q) params.set('q', q);
      if (selectedCategory) params.set('category', selectedCategory);
      if (filters.minSubs) params.set('min_subscribers', filters.minSubs);
      if (filters.maxSubs) params.set('max_subscribers', filters.maxSubs);
      if (filters.featured !== null) params.set('featured', filters.featured);
      
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      
      // Convert sortBy to API format
      const sortMapping = {
        'popular': '-subscribers',
        'new': '-created_at',
        'name': 'name',
        'price': 'price_rub',
        'er': '-er'
      };
      params.set('sort', sortMapping[sortBy] || '-subscribers');

      const response = await axios.get(`${API}/channels?${params.toString()}`);
      const data = response.data;
      
      setChannels(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 20));
    } catch (error) {
      console.error('Failed to load channels:', error);
      setChannels([]);
    } finally {
      setLoading(false);
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const formatSubscribers = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count?.toLocaleString() || '0';
  };

  const getChannelAvatar = (channel) => {
    if (channel.avatar_url) return channel.avatar_url;
    return channel.name?.substring(0, 2).toUpperCase() || 'CH';
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
                  Добро пожаловать, {user.email || user.name}!
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-6">
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
                    <option value="">Все категории</option>
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
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
                      value={filters.minSubs}
                      onChange={(e) => handleFilterChange('minSubs', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input 
                      type="text" 
                      placeholder="до"
                      value={filters.maxSubs}
                      onChange={(e) => handleFilterChange('maxSubs', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Featured Channels */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.featured === true}
                      onChange={(e) => handleFilterChange('featured', e.target.checked ? true : null)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Только рекомендуемые</span>
                  </label>
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

            {/* Results Info */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Найдено {totalItems} каналов
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded disabled:opacity-50"
                  >
                    ←
                  </button>
                  <span className="text-sm text-gray-600">
                    {currentPage} из {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 text-sm border border-gray-200 rounded disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            {/* Channel Cards */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {channel.avatar_url ? (
                          <img src={channel.avatar_url} alt={channel.name} className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          getChannelAvatar(channel)
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{channel.name}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              {channel.category && <span>{channel.category}</span>}
                              {channel.language && (
                                <>
                                  <span>•</span>
                                  <span>{channel.language}</span>
                                </>
                              )}
                              {(channel.country || channel.city) && (
                                <>
                                  <span>•</span>
                                  <span>{[channel.country, channel.city].filter(Boolean).join(' • ')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Status badges */}
                          <div className="flex gap-2 flex-shrink-0">
                            {channel.is_featured && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                Рекомендуем
                              </span>
                            )}
                            {channel.link_status === 'alive' && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Активен
                              </span>
                            )}
                          </div>
                        </div>

                        {channel.short_description && (
                          <p className="text-gray-600 mb-3">{channel.short_description}</p>
                        )}

                        {/* Metrics */}
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <span>👥</span>
                            <span>{formatSubscribers(channel.subscribers)}</span>
                          </div>
                          {channel.er && (
                            <div className="flex items-center gap-1">
                              <span>📊</span>
                              <span>ER {channel.er}%</span>
                            </div>
                          )}
                          {channel.cpm_rub && (
                            <div className="flex items-center gap-1">
                              <span>💰</span>
                              <span>CPM ₽{channel.cpm_rub}</span>
                            </div>
                          )}
                          {channel.growth_30d && (
                            <div className="flex items-center gap-1">
                              <span>📈</span>
                              <span>{channel.growth_30d > 0 ? '+' : ''}{channel.growth_30d}%</span>
                            </div>
                          )}
                          {channel.last_post_at && (
                            <div className="flex items-center gap-1">
                              <span>⏰</span>
                              <span>{new Date(channel.last_post_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <a 
                            href={channel.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Перейти к каналу →
                          </a>
                          {channel.price_rub && (
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold">
                              {channel.price_rub.toLocaleString()} ₽
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {channels.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Каналы не найдены</p>
                  </div>
                )}
              </div>
            )}
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