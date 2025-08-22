import React from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Tools(){
  const seedAll = async () => {
    const token = localStorage.getItem('fm_admin_token');
    await axios.post(`${API}/admin/seed-all`, null, { headers: { Authorization: `Bearer ${token}` } });
    alert('Seeded');
  };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Инструменты</h1>
      <div className="bg-white rounded-xl border p-4">
        <button className="tg-telega-reg" onClick={seedAll}>Seed All</button>
      </div>
    </div>
  );
}