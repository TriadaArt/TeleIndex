import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      if (!data?.user || data.user.role !== 'admin') {
        setError('Требуются права администратора');
        return;
      }
      localStorage.setItem('fm_admin_token', data.access_token);
      navigate('/admin/dashboard');
    } catch (e) {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Админ — вход</h1>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <div className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input className="w-full border rounded-lg px-3 py-2" type="password" placeholder="Пароль" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <button className="tg-telega-reg w-full" type="submit">Войти</button>
        </div>
      </form>
    </div>
  );
}