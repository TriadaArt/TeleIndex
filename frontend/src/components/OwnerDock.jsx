import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OwnerDock({ user: userProp }){
  const [open, setOpen] = useState(true);
  const [role, setRole] = useState(userProp?.role || null);
  const [email, setEmail] = useState(userProp?.email || '');
  const [count, setCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(()=>{
  // Hide immediately if no user or no role
  useEffect(()=>{
    if (!userProp || !userProp.role){ setRole(null); setEmail(''); }
    else { setRole(userProp.role); setEmail(userProp.email||''); }
  }, [userProp]);

    try { setOpen(localStorage.getItem('ownerDockOpen') !== '0'); } catch{}
  },[]);

  useEffect(()=>{ try { localStorage.setItem('ownerDockOpen', open? '1':'0'); } catch{} },[open]);
  useEffect(()=>{
    if (userProp){ setRole(userProp.role); setEmail(userProp.email||''); }
  }, [userProp]);


  useEffect(()=>{
    // rely on passed userProp only; fetch count if owner
    const token = localStorage.getItem('token');
    if (userProp?.role === 'owner' && token){
      (async ()=>{
        try {
          const { data } = await axios.get(`${API}/channels?owner_id=${userProp.id}&page=1&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
          setCount(data?.total || 0);
        } catch { setCount(0); }
      })();
    } else {
      setCount(0);
    }
  },[location.pathname, userProp]);

  if (!(role === 'owner' || role === 'advertiser' || role === 'admin')) return null;

  const LinkItem = ({ to, icon, label, extraClass }) => (
    <a onClick={(e)=>{e.preventDefault(); navigate(to);}} href={to} className={`link ${extraClass||''}`}>
      <i className="icon">{icon}</i>
      <span>{label}</span>
    </a>
  );

  return (
    <aside className={`nav-sidebar ${open? 'active':''}`}>
      <div className="nav-sidebar__header">
        <div className="menu" onClick={()=>setOpen(true)}>☰</div>
        <div className="logo">{/* можно поставить логотип */}</div>
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
      <div className="nav-sidebar__item" style={{marginTop: 12}}>
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