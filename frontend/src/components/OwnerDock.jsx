import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OwnerDock({ user: userProp }){
  const navigate = useNavigate();
  const location = useLocation();

  // open state from localStorage (default active/expanded)
  const [open, setOpen] = useState(() => {
    try { return (localStorage.getItem('ownerDockOpen') !== '0'); } catch { return true; }
  });

  // role/email derived from prop (no internal fetch for identity)
  const [role, setRole] = useState(userProp?.role || null);
  const [email, setEmail] = useState(userProp?.email || '');
  const [count, setCount] = useState(0);

  // keep role/email in sync with prop
  useEffect(() => {
    if (userProp && userProp.role) {
      setRole(userProp.role); setEmail(userProp.email || '');
    } else {
      setRole(null); setEmail('');
    }
  }, [userProp]);

  // persist open state
  useEffect(() => { try { localStorage.setItem('ownerDockOpen', open ? '1' : '0'); } catch {} }, [open]);

  // allow external collapse trigger before route change
  useEffect(() => {
    const h = () => setOpen(false);
  // ensure CSS class toggle for smooth collapse effect
  useEffect(()=>{
    const el = document.querySelector('.nav-sidebar');
    if (!el) return;
    if (open) el.classList.add('active'); else el.classList.remove('active');
  }, [open]);

    window.addEventListener('ownerDock:collapse', h);
    return () => window.removeEventListener('ownerDock:collapse', h);
  }, []);

  // fetch owner channels count (only when logged in as owner)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (userProp?.role === 'owner' && token) {
      (async () => {
        try {
          const { data } = await axios.get(`${API}/channels?owner_id=${userProp.id}&page=1&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
          setCount(data?.total || 0);
        } catch { setCount(0); }
      })();
    } else {
      setCount(0);
    }
  }, [location.pathname, userProp]);

  // hide immediately if logging out or redirecting during auth
  const isAuthRedirecting = typeof document !== 'undefined' && document.body.classList.contains('auth-redirecting');
  if (!role || isAuthRedirecting) return null;

  const LinkItem = ({ to, icon, label, extraClass }) => (
    <a onClick={(e)=>{e.preventDefault(); navigate(to);}} href={to} className={`link ${extraClass||''}`}>
      <i className="icon">{icon}</i>
      <span>{label}</span>
    </a>
  );

  return (
    <aside className={`nav-sidebar ${open ? 'active' : ''}`}>
      <div className="nav-sidebar__header">
        <div className="menu" onClick={()=>setOpen(true)}>☰</div>
        <div className="logo" />
        <div className="chevron" onClick={()=>setOpen(false)}>❮</div>
      </div>
      <div className="nav-sidebar__item">
        <div className="title">Навигация</div>
        <LinkItem to="/me/dashboard" icon="🏠" label="Дашборд" />
        {role==='owner' && <LinkItem to="/me/channels" icon="📚" label={`Мои каналы (${count})`} />}
        {role==='owner' && <LinkItem to="/me/channels/new" icon="➕" label="Добавить канал" />}
        {role!=='owner' && <LinkItem to="/me/favorites" icon="❤" label="Избранное" />}
        <LinkItem to="/me/billing" icon="💳" label="Платежные средства" />
        <LinkItem to="/me/payouts" icon="💸" label="Вывод средств" />
        <LinkItem to="/me/invoices" icon="🧾" label="Счета и акты" />
        <LinkItem to="/me/transactions" icon="📈" label="Транзакции" />
      </div>
      <div className="nav-sidebar__item" style={{ marginTop: 12 }}>
        <div className="title">Помощь</div>
        <LinkItem to="/me/help/blog" icon="📰" label="Блог" />
        <LinkItem to="/me/help/faq" icon="❓" label="FAQ" />
        <LinkItem to="/me/help/support" icon="✉️" label="Связь с нами" />
      </div>
      <div className="nav-sidebar__user" title={email} onClick={()=>navigate('/me/settings')}>
        <div className="avatar" data-user-name={(email||'?')[0]?.toUpperCase()} />
        <div className="mail">{email}</div>
      </div>
    </aside>
  );
}