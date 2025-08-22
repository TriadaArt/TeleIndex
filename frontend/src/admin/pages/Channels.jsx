import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Channels() {
  const { usersMap } = useOutletContext() || { usersMap: {} };
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async () => {
    const token = localStorage.getItem('fm_admin_token');
    const { data } = await axios.get(`${API}/admin/channels?page=${page}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } });
    setItems(data.items || []);
    setTotal(data.total || 0);
  };

  useEffect(() => { load(); }, [page]);

  const ownerEmail = (owner_id) => usersMap[owner_id] || owner_id || '-';

  const openChannel = (ch) => {
    const uname = ch.username || (ch.link||'').replace('https://t.me/','').replace('http://t.me/','').replace('t.me/','').replace('@','').replace(/\/$/, '');
    if (uname) window.location.href = `/tchannel/${uname}`;
  };

  const approve = async (id) => {
    const token = localStorage.getItem('fm_admin_token');
    await axios.post(`${API}/admin/channels/${id}/approve`, null, { headers: { Authorization: `Bearer ${token}` } });
    await load();
  };

  const reject = async (id) => {
    const token = localStorage.getItem('fm_admin_token');
    await axios.post(`${API}/admin/channels/${id}/reject`, null, { headers: { Authorization: `Bearer ${token}` } });
    await load();
  };

  const changeOwner = async (ch) => {
    const token = localStorage.getItem('fm_admin_token');
    const email = prompt('Email нового владельца:');
    if (!email) return;
    // find user by email
    let userId = Object.entries(usersMap).find(([id, em]) => em === email)?.[0];
    if (!userId) {
      alert('Пользователь не найден');
      return;
    }
    await axios.patch(`${API}/admin/channels/${ch.id}/owner`, null, { params: { new_owner_id: userId }, headers: { Authorization: `Bearer ${token}` } });
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Каналы</h1>
      <div className="bg-white rounded-xl border p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Имя</th>
              <th className="py-2 pr-4">Владелец</th>
              <th className="py-2 pr-4">Статус</th>
              <th className="py-2 pr-4">Подписчики</th>
              <th className="py-2 pr-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map(ch => (
              <tr key={ch.id} className="border-b last:border-b-0">
                <td className="py-2 pr-4">{ch.name}</td>
                <td className="py-2 pr-4">{ownerEmail(ch.owner_id)}</td>
                <td className="py-2 pr-4">{ch.status}</td>
                <td className="py-2 pr-4">{ch.subscribers ?? '-'}</td>
                <td className="py-2 pr-4 flex items-center gap-2">
                  <button className="tg-login" onClick={()=>openChannel(ch)}>Открыть</button>
                  <button className="tg-telega-reg" onClick={()=>approve(ch.id)}>Одобрить</button>
                  <button className="tg-pill tg-pill-outline" onClick={()=>reject(ch.id)}>Отклонить</button>
                  <button className="tg-pill tg-pill-outline" onClick={()=>changeOwner(ch)}>Сменить владельца</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="tg-page-btn" disabled={page<=1} onClick={()=>setPage(page-1)}>Назад</button>
          <div className="tg-page-btn">{page}</div>
          <button className="tg-page-btn" disabled={(page*limit)>=total} onClick={()=>setPage(page+1)}>Вперёд</button>
        </div>
      </div>
    </div>
  );
}