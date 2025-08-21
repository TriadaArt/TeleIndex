import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('channels');
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [uPage, setUPage] = useState(1);
  const [cPage, setCPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      // Verify token
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);

  const loadUsers = async () => {
    const token = localStorage.getItem('token');
    const { data } = await axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    setUsers(data.items || []);
  };
  const loadChannels = async () => {
    const token = localStorage.getItem('token');
    const { data } = await axios.get(`${API}/admin/channels?page=${cPage}&limit=${PAGE_SIZE}`, { headers: { Authorization: `Bearer ${token}` } });
    setChannels(data.items || []);
  };

  useEffect(() => { if (user) { loadUsers(); loadChannels(); } }, [user, cPage]);

  const seedAll = async () => {
    const token = localStorage.getItem('token');
    await axios.post(`${API}/admin/seed-all`, null, { headers: { Authorization: `Bearer ${token}` } });
    await loadChannels();
    await loadUsers();
  };

  const deleteUser = async (uid) => {
    if (!window.confirm('Удалить пользователя?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/admin/users/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
      await loadUsers();
    } catch (e) { alert('Удаление запрещено или ошибка'); }
  };

  const approveChannel = async (cid) => {
    const token = localStorage.getItem('token');
    await axios.post(`${API}/admin/channels/${cid}/approve`, null, { headers: { Authorization: `Bearer ${token}` } });
    await loadChannels();
  };
  const rejectChannel = async (cid) => {
    const token = localStorage.getItem('token');
    await axios.post(`${API}/admin/channels/${cid}/reject`, null, { headers: { Authorization: `Bearer ${token}` } });
    await loadChannels();
  };

  const openChannel = (ch) => {
    const uname = ch.username || (ch.link||'').replace('https://t.me/','').replace('http://t.me/','').replace('t.me/','').replace('@','').replace(/\/$/, '');
    if (uname) window.location.href = `/tchannel/${uname}`;
  };

      localStorage.removeItem('token');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="text-indigo-600 hover:text-indigo-800"
            >
              ← Назад к каталогу
            </button>
            <h1 className="text-xl font-semibold">Панель администратора</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.email}
            </span>
            <button 
              onClick={handleLogout}
              className="tg-login"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Добро пожаловать в админ-панель!</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Управление каналами</h3>
              <p className="text-sm text-blue-700 mt-1">
                Добавление, редактирование и модерация каналов
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Статистика</h3>
              <p className="text-sm text-green-700 mt-1">
                Просмотр метрик и аналитики каталога
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900">Настройки</h3>
              <p className="text-sm text-purple-700 mt-1">
                Конфигурация системы и пользователей
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 text-sm">
              🚧 Админ-панель в разработке. Скоро здесь будет полный функционал управления каталогом.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;