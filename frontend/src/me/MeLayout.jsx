import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MeLayout(){
  const [ok, setOk] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    (async ()=>{
      try {
        const { data } = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="tg-container py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center">ME</div>
            <nav className="flex items-center gap-3 text-sm">
              {user?.role === 'owner' && <NavLink to="/me/channels" className={({isActive})=>`px-3 py-1.5 rounded ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`}>Мои каналы</NavLink>}
              {user?.role === 'advertiser' && <NavLink to="/me/favorites" className={({isActive})=>`px-3 py-1.5 rounded ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`}>Избранное</NavLink>}
              <NavLink to="/me/dashboard" className={({isActive})=>`px-3 py-1.5 rounded ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`}>Дашборд</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button className="tg-login" onClick={()=>{ localStorage.removeItem('token'); navigate('/'); }}>Выйти</button>
          </div>
        </div>
      </header>
      <main className="tg-container py-6">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}