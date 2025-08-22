import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Favorites(){
  const [items, setItems] = useState([]);

  useEffect(()=>{
    const fav = JSON.parse(localStorage.getItem('favorites')||'[]');
    if (!fav.length) return;
    (async ()=>{
      try {
        // fetch by username in parallel
        const results = await Promise.all(fav.map(u => axios.get(`${API}/channels/username/${u}`).then(r => r.data.channel || r.data).catch(()=>null)));
        setItems(results.filter(Boolean));
      } catch {}
    })();
  }, []);

  if (!items.length) return <div>Нет избранных каналов.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Избранные</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map(ch => (
          <div key={ch.id} className="bg-white rounded-xl border p-4">
            <div className="font-semibold mb-1">{ch.name}</div>
            <div className="text-sm text-gray-600">{ch.short_description}</div>
            <div className="mt-2">
              <a className="tg-login" href={`/tchannel/${ch.username}`}>Открыть</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}