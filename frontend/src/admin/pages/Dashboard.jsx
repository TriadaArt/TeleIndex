import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('fm_admin_token');
    (async () => {
      try {
        const { data } = await axios.get(`${API}/admin/summary`, { headers: { Authorization: `Bearer ${token}` } });
        setSummary(data);
      } catch {}
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Админ — Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Черновики</div>
          <div className="text-2xl font-bold">{summary?.draft ?? '—'}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Опубликовано</div>
          <div className="text-2xl font-bold">{summary?.approved ?? '—'}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Мёртвые ссылки</div>
          <div className="text-2xl font-bold">{summary?.dead ?? '—'}</div>
        </div>
      </div>
    </div>
  );
}