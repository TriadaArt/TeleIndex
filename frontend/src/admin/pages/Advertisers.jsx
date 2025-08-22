import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Advertisers(){
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const load = async () => {
    const token = localStorage.getItem('fm_admin_token');
    const { data } = await axios.get(`${API}/admin/users?role=advertiser&page=${page}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } });
    setItems(data.items || []);
    setTotal(data.total || 0);
  };
  useEffect(() => { load(); }, [page]);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Рекламодатели</h1>
      <div className="bg-white rounded-xl border p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Роль</th>
              <th className="py-2 pr-4">Создан</th>
            </tr>
          </thead>
          <tbody>
            {items.map(u => (
              <tr key={u.id} className="border-b">
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4">{u.role}</td>
                <td className="py-2 pr-4">{u.created_at}</td>
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