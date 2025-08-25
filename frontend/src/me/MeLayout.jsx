import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import axios from "axios";
import TgHeader from "../components/TgHeader";
import OwnerDock from "../components/OwnerDock";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MeLayout(){
  const [ok, setOk] = useState(false);
  const [user, setUser] = useState(null);
  const [ownCount, setOwnCount] = useState(0);
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    (async ()=>{
      try {
        const { data } = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        // count channels for owners
        if (data?.role === 'owner'){
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/channels?owner_id=${data.id}&page=1&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
            setOwnCount(res.data?.total || 0);
          } catch {}
        }

        if (data?.role === 'admin') { navigate('/admin/dashboard'); return; }
        setUser(data);
        setOk(true);
      } catch {
        navigate('/');
      }
    })();
  }, [navigate]);

  if (!ok) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global header with role-aware info */}
      <TgHeader user={user} />
      {/* Collapsible owner dock visible for roles (owner/advertiser/admin) */}
      <OwnerDock />
      <div className="tg-container py-6">
        <Outlet context={{ user }} />
      </div>
    </div>
  );
}