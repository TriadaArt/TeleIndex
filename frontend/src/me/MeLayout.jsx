import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MeLayout(){
  const [ok, setOk] = useState(false);
  const [user, setUser] = useState(null);
  const [ownCount, setOwnCount] = useState(0);
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    (async ()=>{
      try {
        const { data } = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        // count channels for owners
        if (data?.role === 'owner'){
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/channels?owner_id=${data.id}&page=1&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
            setOwnCount(res.data?.total || 0);
          } catch {}
        }

        if (data?.role === 'admin') { navigate('/admin/dashboard'); return; }
        setUser(data);
        setOk(true);
      } catch {
        navigate('/');
      }
    })();
  }, [navigate]);

  if (!ok) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${open? 'block':'hidden'} md:block w-64 bg-white border-r p-4`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center">ME</div>
          <div className="font-semibold">Личный кабинет</div>
        </div>
        <nav className="space-y-1 text-sm">
          <NavLink to="/me/dashboard" className={({isActive})=>`block px-3 py-2 rounded-lg ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`}>Дашборд</NavLink>
          {user?.role === 'owner' && (
            <>
              <NavLink to="/me/channels" className={({isActive})=>`block px-3 py-2 rounded-lg ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`}>Мои каналы <span className="text-xs text-gray-500">({ownCount})</span></NavLink>
              <NavLink to="/me/channels/new" className={({isActive})=>`block px-3 py-2 rounded-lg ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`}>Создать канал</NavLink>
            </>
          )}
          {user?.role === 'advertiser' && (
            <NavLink to="/me/favorites" className={({isActive})=>`block px-3 py-2 rounded-lg ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`}>Избранное</NavLink>
          )}
        </nav>
        <div className="md:hidden bg-white border-b p-2 flex items-center justify-between">
          <button className="tg-login" onClick={()=>setOpen(!open)}>{open? 'Скрыть меню':'Показать меню'}</button>
          {user?.role==='owner' && <button className="tg-telega-reg" onClick={()=>navigate('/me/channels/new')}>Создать канал</button>}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b">
          <div className="tg-container py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="tg-login" onClick={()=>navigate('/')}>Каталог</button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user?.email} · {user?.role}</span>
              <button className="tg-login" onClick={()=>{ localStorage.removeItem('token'); navigate('/'); }}>Выйти</button>
            </div>
          </div>
        </header>
      <main className="tg-container py-6">
        <Outlet context={{ user }} />
      </main>
    </div>
    </div>
  );
}