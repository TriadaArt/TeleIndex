import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MeDashboard(){
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [mine, setMine] = useState([]);

  useEffect(()=>{
    if (user?.role === 'owner'){
      // quick preview first page
      (async ()=>{
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API}/channels?owner_id=${user.id}&page=1&limit=5`, { headers: { Authorization: `Bearer ${token}` } });
        setMine(data.items||[]);
      })();
    }
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Личный кабинет</h1>
      {user?.role === 'owner' && (
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Мои каналы</div>
            <button className="tg-telega-reg" onClick={()=>navigate('/me/channels/new')}>Создать новый канал</button>
          </div>
          <ul className="space-y-2">
            {mine.map(ch => (
              <li key={ch.id} className="flex items-center justify-between">
                <div className="text-sm">{ch.name}</div>
                <button className="tg-login" onClick={()=>navigate(`/me/channels/${ch.id}/edit`)}>Редактировать</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {user?.role === 'advertiser' && (
        <div className="bg-white rounded-xl border p-4">
          <div className="font-semibold mb-3">Избранные каналы</div>
          <button className="tg-login" onClick={()=>navigate('/me/favorites')}>Открыть избранное</button>
        </div>
      )}
    </div>
  );
}