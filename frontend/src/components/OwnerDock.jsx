import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OwnerDock(){
  const [open, setOpen] = useState(true);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [count, setCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(()=>{
    try { setOpen(localStorage.getItem('ownerDockOpen') !== '0'); } catch{}
  },[]);

  useEffect(()=>{ try { localStorage.setItem('ownerDockOpen', open? '1':'0'); } catch{} },[open]);

  useEffect(()=>{
    const t1 = localStorage.getItem('token');
    const t2 = localStorage.getItem('fm_admin_token');
    const token = t1 || t2;
    if (!token) return;
    (async ()=>{
      try {
        const me = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        setRole(me.data?.role);
        setEmail(me.data?.email || '');
        if (me.data?.role === 'owner'){
          const { data } = await axios.get(`${API}/channels?owner_id=${me.data.id}&page=1&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
          setCount(data?.total || 0);
        }
      } catch {}
    })();
  },[location.pathname]);

  if (!(role === 'owner' || role === 'advertiser' || role === 'admin')) return null;

  const Item = ({ to, icon, label }) => (
    <button onClick={()=>navigate(to)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-left ${open? '':'justify-center'}`} title={label}>
      <span className="text-gray-500">{icon}</span>
      {open && <span>{label}</span>}
    </button>
  );

  return (
    <div className="fixed left-0 top-14 md:top-16 h-[calc(100vh-64px)] z-40">
      <div className={`h-full bg-white border-r shadow-sm transition-all duration-200 ${open? 'w-64':'w-12'}`}>
        <div className="p-2 flex items-center justify-between border-b">
          {open ? (
            <div className="text-sm font-semibold truncate">Владелец · {email}</div>
          ) : (
            <div className="text-sm font-semibold text-gray-500 text-center w-full">☰</div>
          )}
          <button className="tg-login" onClick={()=>setOpen(!open)}>{open? '⟨' : '⟩'}</button>
        </div>
        <div className="p-2 text-sm">
          <div className="mb-1 text-gray-400 uppercase text-[10px]">Навигация</div>
          <Item to="/me/dashboard" icon="🏠" label="Дашборд" />
          <Item to="/me/channels" icon="📚" label={`Мои каналы ${open? `(${count})`:''}`} />
          <Item to="/me/channels/new" icon="➕" label="Добавить канал" />
          <Item to="/me/billing" icon="💳" label="Платежные средства" />
          <Item to="/me/payouts" icon="💸" label="Вывод средств" />
          <Item to="/me/invoices" icon="🧾" label="Счета и акты" />
          <Item to="/me/transactions" icon="📈" label="Транзакции" />
          <div className="mt-3 mb-1 text-gray-400 uppercase text-[10px]">Помощь</div>
          <Item to="/me/help/blog" icon="📰" label="Блог" />
          <Item to="/me/help/faq" icon="❓" label="FAQ" />
          <Item to="/me/help/support" icon="✉️" label="Связь с нами" />
        </div>
      </div>
    </div>
  );
}