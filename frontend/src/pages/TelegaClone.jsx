import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FilterSidebar from "../components/telega/FilterSidebar";
import CatalogGrid from "../components/telega/CatalogGrid";
import Pagination from "../components/telega/Pagination";
import { telegaDemo } from "../data/telegaDemo";
import HeroAnimated from "../components/HeroAnimated";
import AuthModal from "../components/AuthModal";
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const expandTo48 = (arr) => { const out = []; let i=0; while(out.length<48){ const base=arr[i%arr.length]; out.push({ ...base, id: `${base.id}-${out.length+1}`}); i++; } return out; };

function applyFilters(list, { q, ranges, flags, sort, selects }){
  let arr = [...list];
  if (q) { const s = q.trim().toLowerCase(); arr = arr.filter(x => (x.name||'').toLowerCase().includes(s) || (x.short_description||'').toLowerCase().includes(s)); }
  if (selects.category) arr = arr.filter(x => x.category === selects.category);
  if (selects.social) arr = arr.filter(x => (x.social||'Telegram')===selects.social);
  if (selects.genderBlogger) arr = arr.filter(x => x.blogger_gender===selects.genderBlogger);
  if (selects.genderAudience) arr = arr.filter(x => x.audience_gender===selects.genderAudience);
  if (selects.country) arr = arr.filter(x => x.country===selects.country);
  if (selects.city) arr = arr.filter(x => x.city===selects.city);
  const { minSubs, maxSubs, minPrice, maxPrice, minEr, maxEr, minReach, maxReach, minCpv, maxCpv } = ranges;
  if (minSubs) arr = arr.filter(x => x.subscribers >= Number(minSubs));
  if (maxSubs) arr = arr.filter(x => x.subscribers <= Number(maxSubs));
  if (minPrice) arr = arr.filter(x => x.price_rub >= Number(minPrice));
  if (maxPrice) arr = arr.filter(x => x.price_rub <= Number(maxPrice));
  if (minEr) arr = arr.filter(x => x.er >= Number(minEr));
  if (maxEr) arr = arr.filter(x => x.er <= Number(maxEr));
  // reach/cpv intentionally simplified in demo metrics row
  if (flags.featured) arr = arr.filter(x => x.is_featured);
  switch (sort) { case 'name': arr.sort((a,b)=> a.name.localeCompare(b.name)); break; case 'price': arr.sort((a,b)=> (b.price_rub||0)-(a.price_rub||0)); break; case 'er': arr.sort((a,b)=> (b.er||0)-(a.er||0)); break; default: arr.sort((a,b)=> (b.subscribers||0)-(a.subscribers||0)); }
  return arr;
}

export default function TelegaClone(){
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [ranges, setRanges] = useState({});
  const [flags, setFlags] = useState({ featured: false, alive: false });
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [selects, setSelects] = useState({ social: 'Telegram', category: '', genderBlogger: '', genderAudience: '', country: '', city: '' });
  
  // Auth states
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  
  // Real data states
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(false);
  
  const limit = 24;

  // Load real data from API
  useEffect(() => {
    console.log('TelegaClone: Component mounted, loading data and checking auth');
    loadRealData();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    console.log('TelegaClone: Checking auth status, token:', token ? 'exists' : 'none');
    
    if (token) {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('TelegaClone: Auth verified, user:', response.data);
        setUser(response.data);
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem("token");
        setUser(null);
      }
    } else {
      console.log('TelegaClone: No token, user is guest');
      setUser(null);
    }
  };

  const loadRealData = async () => {
    try {
      setLoading(true);
      const [channelsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/channels?limit=48`), // Get more channels for better filtering
        axios.get(`${API}/categories`)
      ]);
      
      if (channelsRes.data && channelsRes.data.items && channelsRes.data.items.length > 0) {
        setChannels(channelsRes.data.items);
        setCategories(categoriesRes.data || []);
        setUseRealData(true);
        console.log(`Loaded ${channelsRes.data.items.length} real channels from API`);
      } else {
        console.log("No real data available, using demo data");
        setUseRealData(false);
      }
    } catch (error) {
      console.error('Failed to load real data, using demo:', error);
      setUseRealData(false);
    } finally {
      setLoading(false);
    }
  };

  // Choose data source
  const source = useRealData ? channels : expandTo48(telegaDemo);
  const sourceCategories = useRealData ? categories : [...new Set(telegaDemo.map(x=>x.category))];
  
  const filtered = useMemo(()=> applyFilters(source, { q, ranges, flags, sort, selects }), [q, selects, ranges, flags, sort, source]);
  const start = (page-1)*limit;
  const items = filtered.slice(start, start+limit);
  React.useEffect(()=> setPage(1), [q, selects, ranges, flags, sort]);

  // Auth handlers
  const handleAuthSuccess = (userData) => {
    setAuthModalOpen(false);
    setUser(userData || { name: "Пользователь" });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const goToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen">
      <HeroAnimated />

      <div className="tg-header">
        <div className="tg-header-inner">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-base">T</span>
            </div>
            <h1 className="font-semibold text-xl text-gray-900 tracking-tight">TeleIndex</h1>
            <div className="text-sm text-gray-500 font-medium border-l border-gray-200 pl-4">Каталог</div>
            {useRealData && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium ml-2">
                Live Data
              </span>
            )}
            {loading && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium ml-2">
                Loading...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-700 font-semibold">
                  {user.email || user.name}
                </span>
                {user?.role === 'admin' && (
                  <button className="tg-pill tg-pill-soft tg-grad-hover" onClick={goToAdmin}>
                    Админ
                  </button>
                )}
                <button className="tg-pill tg-pill-outline" onClick={handleLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                {/* Swapped order per request: Регистрация then Войти */}
                <button className="tg-pill tg-pill-soft tg-grad-hover-soft" onClick={openRegisterModal}>
                  Регистрация
                </button>
                <button className="tg-pill tg-pill-outline tg-grad-hover" onClick={openLoginModal}>
                  Войти
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="tg-container mt-4 grid grid-cols-1 lg:grid-cols-[340px_820px] gap-6">
        <FilterSidebar 
          q={q} 
          setQ={setQ} 
          categories={sourceCategories} 
          ranges={ranges} 
          setRanges={setRanges} 
          flags={flags} 
          setFlags={setFlags} 
          selects={selects} 
          setSelects={setSelects} 
        />
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[{k:'popular',label:'Популярные'},{k:'new',label:'Новые'},{k:'name',label:'По имени'},{k:'price',label:'Цена'},{k:'er',label:'ER'}].map(t=> (
                <button key={t.k} onClick={()=>setSort(t.k)} className={`tg-chip ${sort===t.k?'tg-chip-active':''}`}>{t.label}</button>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              Найдено: {filtered.length} {useRealData ? 'каналов' : 'каналов (демо)'}
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <CatalogGrid items={items} />
              <div className="tg-pager">
                <button className="tg-page-btn" disabled={page<=1} onClick={()=>setPage(page-1)}>Назад</button>
                <div className="flex items-center gap-2">
                  {Array.from({length: Math.min(5, Math.max(1, Math.ceil(filtered.length/limit)))}).map((_,i)=>{
                    const pages = Math.ceil(filtered.length/limit) || 1;
                    const start = Math.max(1, Math.min(Math.max(1, page-2), Math.max(1, pages-4)));
                    const p = start + i;
                    return <button key={p} className={`tg-page-btn ${p===page?'tg-page-active':''}`} onClick={()=>setPage(p)}>{p}</button>;
                  })}
                </div>
                <button className="tg-page-btn" disabled={page>=Math.ceil(filtered.length/limit)} onClick={()=>setPage(page+1)}>Вперёд</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}