import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MyChannels(){
  const { user } = useOutletContext();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const navigate = useNavigate();

  const load = async () => {
    const token = localStorage.getItem('token');
    const { data } = await axios.get(`${API}/channels?owner_id=${user.id}&page=${page}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } });
    setItems(data.items || []);
    setTotal(data.total || 0);
  };

  useEffect(()=>{ if (user) load(); }, [user, page]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Мои каналы</h1>
        <button className="tg-telega-reg" onClick={()=>navigate('/me/channels/new')}>Создать новый канал</button>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Имя</th>
              <th className="py-2 pr-4">Статус</th>
              <th className="py-2 pr-4">Подписчики</th>
              <th className="py-2 pr-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map(ch => (
              <tr key={ch.id} className="border-b last:border-b-0">
                <td className="py-2 pr-4">{ch.name}</td>
                <td className="py-2 pr-4">{ch.status}</td>
                <td className="py-2 pr-4">{ch.subscribers ?? '-'}</td>
                <td className="py-2 pr-4 flex items-center gap-2">
                  <button className="tg-login" onClick={()=>navigate(`/me/channels/${ch.id}/edit`)}>Редактировать</button>
                  <button className="tg-pill tg-pill-outline" onClick={()=>window.location.href=`/tchannel/${ch.username}`}>Открыть</button>
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