import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import TgHeader from "../components/TgHeader";
import OwnerDock from "../components/OwnerDock";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ChannelCardPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useLive, setUseLive] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [fav, setFav] = useState(false);

  // Force dock collapsed when opening card page (guarantee state)
  useEffect(() => {
    try { localStorage.setItem('ownerDockOpen','0'); window.dispatchEvent(new Event('ownerDock:collapse')); } catch {}
  }, []);

  // Load current user (for header/dock)
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('fm_admin_token');
    if (!token) return;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        setUser(data);
      } catch {}
    })();
  }, []);

  // Init favorites indicator for this username
  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFav(favs.includes(username));
  }, [username]);

  // Load channel by username and its owners
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const chRes = await axios.get(`${API}/channels/username/${username}`);
        if (!mounted) return;
        const ch = chRes.data?.channel || chRes.data;
        setChannel(ch);
        try {
          const ownRes = await axios.get(`${API}/channels/${ch.id}/owners`);
          setOwners(ownRes.data?.items || []);
        } catch {
          setOwners([]);
        }
        setUseLive(true);
      } catch (e) {
        setError("Канал не найден");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Канал не найден"}</h1>
          <button onClick={() => navigate('/')} className="tg-pill tg-pill-outline">Назад к каталогу</button>
        </div>
      </div>
    );
  }

  const metric = (label, value, accent) => (
    <div className={`text-center p-4 rounded-lg ${accent}`}>
      <div className="text-2xl font-bold">{value ?? "—"}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );

  const tag = (text) => (
    <span className="text-xs px-2 py-1 rounded-full border bg-gray-50">{text}</span>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TgHeader user={user} />
      <OwnerDock user={user} />

      <main className="tg-container py-6">
        {/* Card header section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
              {channel.avatar_url ? (
                <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                (channel.name || 'CH').slice(0,2).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{channel.name}</h1>
                {channel.category && tag(channel.category)}
                {channel.language && tag(channel.language)}
                {channel.country && tag(channel.country)}
                {channel.city && tag(channel.city)}
              </div>
              <div className="mt-3 flex items-center gap-3">
                {channel.link && (
                  <a href={channel.link} target="_blank" rel="noopener noreferrer" className="tg-telega-reg">Перейти в Telegram</a>
                )}
                <button className={`tg-login`} onClick={() => {
                  const favs = JSON.parse(localStorage.getItem('favorites')||'[]');
                  if (favs.includes(username)){
                    const next = favs.filter(x=>x!==username);
                    localStorage.setItem('favorites', JSON.stringify(next));
                    setFav(false);
                  } else {
                    favs.push(username);
                    localStorage.setItem('favorites', JSON.stringify(favs));
                    setFav(true);
                  }
                }}>{fav? '♥ В избранном':'♡ В избранное'}</button>
              </div>
              {channel.short_description && (
                <p className="mt-2 text-gray-700 text-sm md:text-base">{channel.short_description}</p>
              )}
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 px-6 pb-6">
            {metric('Подписчиков', channel.subscribers?.toLocaleString?.() || channel.subscribers, 'bg-blue-50 text-blue-700')}
            {metric('ER', channel.er ? `${channel.er}%` : '—', 'bg-green-50 text-green-700')}
            {metric('CPM', channel.cpm_rub ? `₽${channel.cpm_rub}` : '—', 'bg-purple-50 text-purple-700')}
            {metric('Цена', channel.price_rub ? `₽${channel.price_rub.toLocaleString?.() || channel.price_rub}` : '—', 'bg-orange-50 text-orange-700')}
            {metric('Рост 30д', channel.growth_30d ? `${channel.growth_30d}%` : '—', 'bg-rose-50 text-rose-700')}
            {metric('Последний пост', channel.last_post_at ? new Date(channel.last_post_at).toLocaleDateString() : '—', 'bg-indigo-50 text-indigo-700')}
          </div>
        </div>

        {/* Owner info */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Владелец</h2>
            {owners.length === 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Не указан</span>
            )}
          </div>
          {owners.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {owners.map((o) => (
                <div key={o.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="font-medium text-gray-900">{o.name || 'Неизвестно'}</div>
                  <div className="text-sm text-gray-600 mt-1">{o.contacts?.email || o.external?.email || 'Email не указан'}</div>
                  <div className="text-sm text-gray-600">@{o.contacts?.tg_username || o.external?.telegram_username || 'tg не указан'}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Нет данных о владельце.</p>
          )}
        </div>

        {/* Admin actions */}
        <AdminActions channel={channel} />
      </main>
    </div>
  );
}

function AdminActions({ channel }) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const API = `${BACKEND_URL}/api`;
        const { data } = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        setIsAdmin(data?.role === 'admin');
      } catch {}
    })();
  }, []);

  const act = async (path) => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Требуется вход');
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const API = `${BACKEND_URL}/api`;
      await axios.post(`${API}/admin/channels/${channel.id}/${path}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Готово');
      location.reload();
    } catch (e) {
      alert('Ошибка');
    }
  };

  if (!isAdmin) return null;
  return (
    <div className="mt-6 flex items-center gap-3">
      <button className="tg-telega-reg" onClick={() => act('approve')}>Опубликовать</button>
      <button className="tg-login" onClick={() => act('reject')}>Отклонить</button>
    </div>
  );
}