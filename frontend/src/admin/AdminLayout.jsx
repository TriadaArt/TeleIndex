import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminLayout() {
  const [ok, setOk] = useState(false);
  const [user, setUser] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('fm_admin_token');
    if (!token) { navigate('/admin/login'); return; }
    (async () => {
      try {
        const me = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (me.data?.role !== 'admin') { navigate('/admin/login'); return; }
        setUser(me.data);
        // preload users map for owner emails
        const { data } = await axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
        const map = {};
        (data.items||[]).forEach(u => map[u.id] = u.email);
        setUsersMap(map);
        setOk(true);
      } catch {
        navigate('/admin/login');
      }
    })();
  }, [navigate]);

  if (!ok) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-64 p-6">
        <Outlet context={{ user, usersMap }} />
      </div>
    </div>
  );
}