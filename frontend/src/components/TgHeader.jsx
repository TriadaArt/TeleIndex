import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TgHeader({ user, onOpenLogin, onOpenRegister, onLogout, useRealData, loading }){
  const navigate = useNavigate();
  const location = useLocation();
  const [ownerCounts, setOwnerCounts] = useState({ total: 0, moderation: 0 });
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    // advertiser favorites
    if (user?.role === 'advertiser') {
      try {
        const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
        setFavCount(favs.length);
      } catch { setFavCount(0); }
    }
  }, [user]);

  useEffect(() => {
    // owner quick summary
    const token = localStorage.getItem('token');
    if (user?.role === 'owner' && token) {
      (async () => {
        try {
          const qs = `owner_id=${user.id}&page=1&limit=1`;
          const [all, mod] = await Promise.all([
            axios.get(`${API}/channels?${qs}`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API}/channels?${qs}&status=moderation`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          setOwnerCounts({ total: all.data?.total || 0, moderation: mod.data?.total || 0 });
        } catch { setOwnerCounts({ total: 0, moderation: 0 }); }
      })();
    }
  }, [user]);

  const goCatalog = () => navigate('/');
  const doLogout = () => {
    if (onLogout) return onLogout();
    // default: user logout
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="tg-header">
      <div className="tg-header-inner lg:grid lg:grid-cols-[340px_820px] items-center">
        <div className="flex items-center gap-3 col-start-1">
          <button className="tg-login" onClick={goCatalog}>Каталог</button>
          {useRealData && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Live Data</span>
          )}
          {loading && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Loading…</span>
          )}
        </div>
        <div className="flex items-center gap-3 justify-end col-start-2">
          {!user && (
            <>
              <button className="tg-telega-reg" onClick={onOpenRegister}>Регистрация</button>
              <button className="tg-login" onClick={onOpenLogin}>Войти</button>
            </>
          )}
          {!!user && (
            <>
              {/* Center content per role */}
              {user.role === 'admin' && (
                <span className="text-sm text-gray-700">Админ-панель</span>
              )}
              {user.role === 'owner' && (
                <span className="text-sm text-gray-700">Каналов: {ownerCounts.total} · На модерации: {ownerCounts.moderation}</span>
              )}
              {user.role === 'advertiser' && (
                <span className="text-sm text-gray-700">Избранное: {favCount}</span>
              )}
              <span className="text-sm text-gray-600">{user.email}</span>
              <button className="tg-pill tg-pill-outline" onClick={doLogout}>Выйти</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}