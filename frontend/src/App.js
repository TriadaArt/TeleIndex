import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import { Routes, Route, useNavigate } from "react-router-dom";
import AuthModal from "./components/AuthModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function classNames(...c) { return c.filter(Boolean).join(" "); }
function ruShort(n){ if(n==null) return "-"; try{ const v=Number(n); if(v>=1_000_000) return (Math.round(v/100_000)/10).toString().replace('.',',')+" млн"; if(v>=1_000) return (Math.round(v/100)/10).toString().replace('.',',')+" тыс"; return Intl.NumberFormat('ru-RU').format(v);}catch{ return String(n);} }
function daysAgo(iso) { if (!iso) return "-"; try { const d = new Date(iso); const diff = Math.floor((Date.now() - d.getTime())/(1000*60*60*24)); return String(diff); } catch { return "-"; } }

axios.interceptors.request.use((config) => { const t = localStorage.getItem("token"); if (t) config.headers.Authorization = `Bearer ${t}`; return config; });

const useFetch = (url, deps = []) => { const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); useEffect(() => { let mounted = true; setLoading(true); axios.get(url).then((res) => mounted && setData(res.data)).catch((e) => mounted && setError(e)).finally(() => mounted && setLoading(false)); return () => { mounted = false; }; }, deps); return { data, loading, error }; };

const Header = ({ onGoAdmin, onOpenLogin, onOpenRegister, q, setQ, scrollToCats }) => {
  const isLoggedIn = localStorage.getItem('token');
  
  return (
    <header className="w-full sticky top-0 z-10 backdrop-blur bg-white/80 border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 mr-auto">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" />
          <h1 className="font-semibold text-lg">TeleIndex</h1>
        </div>
        <div className="flex-1 hidden md:block">
          <input 
            value={q} 
            onChange={(e)=>setQ(e.target.value)} 
            placeholder="Поиск каналов..." 
            className="w-full h-11 rounded-xl border px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>
        <button className="text-sm text-gray-600 hover:text-gray-900" onClick={scrollToCats}>
          Категории
        </button>
        
        {isLoggedIn ? (
          <button className="text-sm text-gray-600 hover:text-gray-900" onClick={onGoAdmin}>
            Админ
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors" 
              onClick={onOpenLogin}
            >
              Войти
            </button>
            <button 
              className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors" 
              onClick={onOpenRegister}
            >
              Регистрация
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

const CategoryBar = React.forwardRef(({ categories, active, setActive }, ref) => (
  <div ref={ref} className="max-w-6xl mx-auto px-4 mt-3 overflow-x-auto">
    <div className="flex items-center gap-2">
      <button className={classNames("chip", !active && "chip-active")} onClick={() => setActive("")}>Все</button>
      {(categories || []).map((c) => (
        <button key={c} className={classNames("chip", active === c && "chip-active") } onClick={() => setActive(c)}>{c}</button>
      ))}
    </div>
  </div>
));

const SortBar = ({ sort, setSort }) => (
  <div className="max-w-6xl mx-auto px-4 mt-3">
    <div className="flex items-center gap-2 flex-wrap">
      {[
        { k: "popular", label: "Популярные" },
        { k: "new", label: "Новые" },
        { k: "name", label: "По имени" },
        { k: "price", label: "Цена" },
        { k: "er", label: "ER" },
      ].map((t) => (
        <button key={t.k} onClick={() => setSort(t.k)} className={classNames("chip", sort === t.k && "chip-active")}>{t.label}</button>
      ))}
    </div>
  </div>
);

const TrendStrip = ({ items, onOpen }) => (
  <div className="max-w-6xl mx-auto px-4 mt-4">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-semibold">В тренде</h2>
      <span className="text-xs text-gray-500">4 карточки</span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {(items || []).map((it) => (
        <div key={it.id} className="card card-pad">
          <div className="flex items-center gap-3">
            {it.avatar_url ? <img src={it.avatar_url} alt={it.name} className="h-10 w-10 rounded-xl object-cover border" /> : <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white bg-indigo-500 font-semibold">{(it.name||'?').slice(0,2).toUpperCase()}</div>}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate font-medium" title={it.name}>{it.name}</div>
                <span className="badge badge-yellow">В тренде</span>
              </div>
              <div className="text-xs text-gray-600">👥 {ruShort(it.subscribers)}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button onClick={() => onOpen(it)} className="btn-primary">Открыть</button>
            <a href={it.link.startsWith("http") ? it.link : `https://${it.link}`} target="_blank" rel="noreferrer" className="btn">Перейти</a>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Card = ({ item, onOpen }) => {
  const initials = (item?.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="card overflow-hidden">
      <div className="card-pad">
        <div className="flex items-center gap-3">
          {item.avatar_url ? (
            <img src={item.avatar_url} alt={item.name} className="h-18 w-18 h-14 w-14 rounded-xl object-cover border" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <div className="h-14 w-14 rounded-xl items-center justify-center font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 flex">{initials}</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate" title={item.name}>{item.name}</h3>
              {item.is_featured && <span className="badge badge-yellow">Избранный</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 flex-wrap">
              {item.category && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.category}</span>}
              {item.language && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.language}</span>}
              {item.country && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.country}{item.city?` • ${item.city}`:""}</span>}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{item.short_description || item.seo_description || "Описание отсутствует"}</p>
        <div className="mt-3 text-sm text-gray-700 flex items-center flex-wrap gap-x-4 gap-y-1">
          <span>👥 {ruShort(item.subscribers)}</span>
          <span>📈 ER {item.er != null ? `${item.er}%` : "-"}</span>
          <span>💰 ₽ {item.price_rub != null ? Intl.NumberFormat('ru-RU').format(item.price_rub) : "-"}</span>
          <span>📊 CPM ₽ {item.cpm_rub != null ? item.cpm_rub : "-"}</span>
          <span>📉 Рост 30д {item.growth_30d != null ? `${item.growth_30d}%` : "-"}</span>
          <span>🕒 Последний пост {daysAgo(item.last_post_at)} дн.</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => onOpen(item)} className="btn-primary">Открыть</button>
          <a href={item.link.startsWith("http") ? item.link : `https://${item.link}`} target="_blank" rel="noreferrer" className="btn">Перейти</a>
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ page, total, limit, onChange }) => {
  const pages = Math.max(1, Math.ceil((total || 0) / (limit || 24)));
  const items = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) items.push(i);
  return (
    <div className="pagination flex items-center justify-between mt-6">
      <button className="btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>Назад</button>
      <div className="flex items-center gap-2">
        {items.map((p) => (
          <button key={p} className={classNames("btn", p === page && "active")} onClick={() => onChange(p)}>{p}</button>
        ))}
      </div>
      <button className="btn" disabled={page >= pages} onClick={() => onChange(page + 1)}>Вперёд</button>
    </div>
  );
};

function setMeta(title, desc, image) {
  if (title) document.title = title;
  function ensure(name, content) {
    if (!content) return;
    let el = document.querySelector(`meta[name='${name}']`);
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }
  function ensureProp(property, content) {
    if (!content) return;
    let el = document.querySelector(`meta[property='${property}']`);
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }
  ensure('description', desc);
  ensureProp('og:title', title);
  ensureProp('og:description', desc);
  ensureProp('og:image', image);
}

const Detail = ({ id, onBack }) => {
  const { data: ch, loading } = useFetch(`${API}/channels/${id}`, [id]);
  useEffect(()=>{ if (ch) setMeta(`${ch.name} — TeleIndex`, ch.seo_description || ch.short_description, ch.avatar_url); }, [ch]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header onGoAdmin={() => { if (localStorage.getItem('token')) window.location.reload(); }} q={""} setQ={()=>{}} scrollToCats={()=>{}} onBack={onBack} />
      <main className="max-w-5xl mx-auto px-4 pb-16 pt-6">
        {loading || !ch ? (
          <div className="h-48 rounded-2xl bg-gray-100 animate-pulse border" />
        ) : (
          <div className="card card-pad">
            <div className="flex items-start gap-4">
              {ch.avatar_url ? <img src={ch.avatar_url} alt={ch.name} className="h-20 w-20 rounded-xl object-cover border" /> : <div className="h-20 w-20 rounded-xl items-center justify-center font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 flex">{(ch.name||'?').slice(0,2).toUpperCase()}</div>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-semibold truncate" title={ch.name}>{ch.name}</h1>
                  {ch.category && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">{ch.category}</span>}
                  {ch.language && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">{ch.language}</span>}
                  {ch.country && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">{ch.country}{ch.city?` • ${ch.city}`:""}</span>}
                  {ch.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 border">🔥 Избранный</span>}
                </div>
                <div className="text-sm text-gray-700 mt-2 flex items-center gap-6 flex-wrap">
                  <span>👥 {ruShort(ch.subscribers)} подписчиков</span>
                  {ch.price_rub != null && <span>💰 Цена: ₽ {Intl.NumberFormat('ru-RU').format(ch.price_rub)}</span>}
                </div>
              </div>
              <a href={ch.link.startsWith('http') ? ch.link : `https://${ch.link}`} target="_blank" rel="noreferrer" className="btn-primary">Перейти в Telegram</a>
            </div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl border bg-gray-50 text-sm">📈 ER<br/><span className="font-semibold">{ch.er != null ? `${ch.er}%` : '-'}</span></div>
              <div className="p-3 rounded-xl border bg-gray-50 text-sm">💰 Цена<br/><span className="font-semibold">{ch.price_rub != null ? `₽ ${Intl.NumberFormat('ru-RU').format(ch.price_rub)}` : '-'}</span></div>
              <div className="p-3 rounded-xl border bg-gray-50 text-sm">📊 CPM<br/><span className="font-semibold">{ch.cpm_rub != null ? `₽ ${ch.cpm_rub}` : '-'}</span></div>
              <div className="p-3 rounded-xl border bg-gray-50 text-sm">📉 Рост 30д<br/><span className="font-semibold">{ch.growth_30d != null ? `${ch.growth_30d}%` : '-'}</span></div>
              <div className="p-3 rounded-xl border bg-gray-50 text-sm">🕒 Последний пост<br/><span className="font-semibold">{daysAgo(ch.last_post_at)} дн.</span></div>
              <div className="p-3 rounded-xl border bg-gray-50 text-sm">🌍 Язык<br/><span className="font-semibold">{ch.language || '-'}</span></div>
            </div>
            <div className="mt-5 text-gray-800 leading-relaxed whitespace-pre-wrap">
              {ch.seo_description || ch.short_description || 'Описание отсутствует'}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const Catalog = ({ onGoAdmin, onOpenDetail }) => {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  // sidebar filters
  const [minSubs, setMinSubs] = useState("");
  const [maxSubs, setMaxSubs] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minEr, setMinEr] = useState("");
  const [maxEr, setMaxEr] = useState("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyAlive, setOnlyAlive] = useState(false);

  const limit = 24;
  const cats = useFetch(`${API}/categories`, []);
  const trending = useFetch(`${API}/channels/trending?limit=4`, []);
  const channelsUrl = useMemo(() => { const p = new URLSearchParams(); if (q) p.set("q", q); if (category) p.set("category", category); if (sort) p.set("sort", sort); if (minSubs) p.set("min_subscribers", String(minSubs)); if (maxSubs) p.set("max_subscribers", String(maxSubs)); if (minPrice) p.set("min_price", String(minPrice)); if (maxPrice) p.set("max_price", String(maxPrice)); if (minEr) p.set("min_er", String(minEr)); if (maxEr) p.set("max_er", String(maxEr)); if (onlyFeatured) p.set("only_featured", "true"); if (onlyAlive) p.set("only_alive", "true"); p.set("page", String(page)); p.set("limit", String(limit)); return `${API}/channels?${p.toString()}`; }, [q, category, sort, page, minSubs, maxSubs, minPrice, maxPrice, minEr, maxEr, onlyFeatured, onlyAlive]);
  const { data: channels, loading } = useFetch(channelsUrl, [channelsUrl]);
  useEffect(() => { setPage(1); }, [q, category, sort, minSubs, maxSubs, minPrice, maxPrice, minEr, maxEr, onlyFeatured, onlyAlive]);

  const catRef = React.useRef(null);
  const scrollToCats = () => { if (catRef.current) catRef.current.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header onGoAdmin={onGoAdmin} q={q} setQ={setQ} scrollToCats={scrollToCats} />
      <CategoryBar ref={catRef} categories={cats.data} active={category} setActive={setCategory} />
      <SortBar sort={sort} setSort={setSort} />
      <div className="max-w-6xl mx-auto px-4 mt-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-3 min-w-[280px]">
          <div className="lg:sticky lg:top-24">
            <div className="sidebar">
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск каналов..." className="w-full h-11 rounded-xl border px-4" />
              <div>
                <div className="text-sm font-medium mb-2">Категории</div>
                <div className="flex flex-wrap gap-2">
                  <button className={classNames("chip", !category && "chip-active")} onClick={()=>setCategory("")}>Все</button>
                  {(cats.data||[]).map(c => (
                    <button key={c} className={classNames("chip", category===c && "chip-active")} onClick={()=>setCategory(c)}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Подписчики</div>
                <div className="grid grid-cols-2 gap-2">
                  <input inputMode="numeric" pattern="[0-9]*" value={minSubs} onChange={(e)=>setMinSubs(e.target.value)} placeholder="от" className="h-10 rounded-xl border px-3" />
                  <input inputMode="numeric" pattern="[0-9]*" value={maxSubs} onChange={(e)=>setMaxSubs(e.target.value)} placeholder="до" className="h-10 rounded-xl border px-3" />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Цена ₽</div>
                <div className="grid grid-cols-2 gap-2">
                  <input inputMode="numeric" pattern="[0-9]*" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} placeholder="от" className="h-10 rounded-xl border px-3" />
                  <input inputMode="numeric" pattern="[0-9]*" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} placeholder="до" className="h-10 rounded-xl border px-3" />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">ER %</div>
                <div className="grid grid-cols-2 gap-2">
                  <input inputMode="decimal" value={minEr} onChange={(e)=>setMinEr(e.target.value)} placeholder="от" className="h-10 rounded-xl border px-3" />
                  <input inputMode="decimal" value={maxEr} onChange={(e)=>setMaxEr(e.target.value)} placeholder="до" className="h-10 rounded-xl border px-3" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyFeatured} onChange={(e)=>setOnlyFeatured(e.target.checked)} /> Только избранные</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyAlive} onChange={(e)=>setOnlyAlive(e.target.checked)} /> Только живые ссылки</label>
            </div>
          </div>
        </aside>
        {/* Main content with Trending + Grid */}
        <div>
          <div className="mb-4"><TrendStrip items={trending.data || []} onOpen={onOpenDetail} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              Array.from({ length: 9 }).map((_, i) => (<div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse border" />))
            ) : channels && channels.items && channels.items.length > 0 ? (
              channels.items.map((item) => (<Card key={item.id} item={item} onOpen={onOpenDetail} />))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gray-100 border flex items-center justify-center">🔎</div>
                <p className="mt-4 text-gray-700">Ничего не найдено. Измените фильтры или сбросьте поиск.</p>
              </div>
            )}
          </div>
          {channels && !!channels.total && (
            <Pagination page={channels.page} total={channels.total} limit={limit} onChange={(p) => setPage(p)} />
          )}
        </div>
      </div>
    </div>
  );
};

const FirstAdmin = ({ onDone, onBackToCatalog }) => { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [err, setErr] = useState(""); const submit = async (e) => { e.preventDefault(); setErr(""); try { await axios.post(`${API}/auth/register`, { email, password, role: "admin" }); const { data: login } = await axios.post(`${API}/auth/login`, { email, password }); localStorage.setItem("token", login.access_token); onDone(); } catch (e) { setErr("Не удалось создать администратора. Возможно, регистрация отключена."); } }; return (<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4"><form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded-2xl border shadow-sm"><h2 className="text-lg font-semibold mb-4">Создание первого администратора</h2><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-11 rounded-xl border px-4 mb-2" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full h-11 rounded-xl border px-4 mb-2" />{err && <div className="text-red-600 text-sm mb-2">{err}</div>}<div className="flex gap-2"><button className="flex-1 h-11 rounded-xl bg-indigo-600 text-white">Создать и войти</button><button type="button" onClick={onBackToCatalog} className="h-11 rounded-xl border px-4">Отмена</button></div></form></div>); };

const Login = ({ onLoggedIn, onBack }) => { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [err, setErr] = useState(""); const submit = async (e) => { e.preventDefault(); setErr(""); try { const { data } = await axios.post(`${API}/auth/login`, { email, password }); localStorage.setItem("token", data.access_token); onLoggedIn(); } catch { setErr("Неверные учетные данные"); } }; return (<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4"><form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded-2xl border shadow-sm"><h2 className="text-lg font-semibold mb-4">Вход администратора</h2><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-11 rounded-xl border px-4 mb-2" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full h-11 rounded-xl border px-4 mb-2" />{err && <div className="text-red-600 text-sm mb-2">{err}</div>}<div className="flex gap-2"><button className="flex-1 h-11 rounded-xl bg-indigo-600 text-white">Войти</button><button type="button" className="h-11 rounded-xl border px-4" onClick={onBack}>Назад</button></div></form></div>); };

const Admin = ({ onLogout, onOpenDetail }) => {
  const [tab, setTab] = useState("summary");
  const [drafts, setDrafts] = useState([]);
  const [approved, setApproved] = useState([]);
  const [creators, setCreators] = useState([]);
  const [creatorForm, setCreatorForm] = useState({
    name: "", bio: "", category: "", tags: "", country: "RU", 
    language: "ru", avatar_url: "", priority_level: "normal",
    "pricing.min_price": "", "pricing.max_price": "", "pricing.currency": "RUB",
    "contacts.email": "", "contacts.tg_username": "", "contacts.other_links": ""
  });
  const [editingCreator, setEditingCreator] = useState(null);
  const [creatorFilters, setCreatorFilters] = useState({
    q: "", category: "", priority_level: "", verified: ""
  });
  const [deadInfo, setDeadInfo] = useState({ dead: 0 });
  const [deadList, setDeadList] = useState([]);
  const [manual, setManual] = useState({ name: "", link: "", avatar_url: "", category: "", language: "Русский", country: "", city: "", subscribers: 0, er: "", price_rub: "", cpm_rub: "", growth_30d: "", last_post_at: "", short_description: "" });
  const [importUrl, setImportUrl] = useState("");
  const [importSource, setImportSource] = useState("telemetr");
  const [pasteLinks, setPasteLinks] = useState("");
  const { data: trending } = useFetch(`${API}/channels/trending?limit=4`, []);

  const reload = async () => {
    const d = await axios.get(`${API}/admin/channels?status=draft`); setDrafts(d.data.items || []);
    const a = await axios.get(`${API}/admin/channels?status=approved`); setApproved(a.data.items || []);
    const s = await axios.get(`${API}/admin/summary`); setDeadInfo(s.data);
    const dl = await axios.get(`${API}/admin/dead`); setDeadList(dl.data || []);
    
    // Load creators
    const c = await axios.get(`${API}/creators?limit=50`); setCreators(c.data.items || []);
  };
  useEffect(() => { reload(); }, []);

  const approve = async (id) => { await axios.post(`${API}/admin/channels/${id}/approve`); reload(); };
  const reject = async (id) => { await axios.post(`${API}/admin/channels/${id}/reject`); reload(); };
  const saveManual = async (e) => { e.preventDefault(); const body = { ...manual, subscribers: Number(manual.subscribers || 0) };
    ["er","cpm_rub","growth_30d"].forEach(k => { if (body[k] === "") delete body[k]; else body[k] = Number(body[k]); });
    if (body.price_rub === "") delete body.price_rub; else body.price_rub = Number(body.price_rub);
    if (!body.language) body.language = "Русский";
    await axios.post(`${API}/admin/channels`, body);
    setManual({ name: "", link: "", avatar_url: "", category: "", language: "Русский", country: "", city: "", subscribers: 0, er: "", price_rub: "", cpm_rub: "", growth_30d: "", last_post_at: "", short_description: "" });
    reload(); };
  const runImport = async () => { const ep = importSource === "telemetr" ? "telemetr" : (importSource === "tgstat" ? "tgstat" : "telega"); await axios.post(`${API}/parser/${ep}`, null, { params: { list_url: importUrl } }); reload(); };
  const runPasteImport = async () => { const links = pasteLinks.split(/\n|,|;|\s+/).map(s => s.trim()).filter(Boolean); if (links.length === 0) return; await axios.post(`${API}/parser/links`, { links }); setPasteLinks(""); reload(); };
  const runLinkCheck = async () => { await axios.post(`${API}/admin/links/check`, null, { params: { limit: 50, replace_dead: false } }); reload(); };
  const seedDemo = async () => { await axios.post(`${API}/admin/seed-demo`); reload(); };
  
  // Creator management functions
  const seedCreators = async () => { await axios.post(`${API}/admin/creators/seed?count=10`); reload(); };
  
  const saveCreator = async (e) => {
    e.preventDefault();
    const formData = { ...creatorForm };
    
    // Parse nested fields
    const creator = {
      name: formData.name,
      bio: formData.bio,
      category: formData.category,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      country: formData.country,
      language: formData.language,
      avatar_url: formData.avatar_url,
      priority_level: formData.priority_level,
      pricing: {
        min_price: formData["pricing.min_price"] ? Number(formData["pricing.min_price"]) : null,
        max_price: formData["pricing.max_price"] ? Number(formData["pricing.max_price"]) : null,
        currency: formData["pricing.currency"] || "RUB"
      },
      contacts: {
        email: formData["contacts.email"] || null,
        tg_username: formData["contacts.tg_username"] || null,
        other_links: formData["contacts.other_links"] ? formData["contacts.other_links"].split('\n').map(l => l.trim()).filter(Boolean) : []
      }
    };
    
    try {
      if (editingCreator) {
        await axios.put(`${API}/creators/${editingCreator.id}`, creator);
        setEditingCreator(null);
      } else {
        await axios.post(`${API}/creators`, creator);
      }
      
      // Reset form
      setCreatorForm({
        name: "", bio: "", category: "", tags: "", country: "RU", 
        language: "ru", avatar_url: "", priority_level: "normal",
        "pricing.min_price": "", "pricing.max_price": "", "pricing.currency": "RUB",
        "contacts.email": "", "contacts.tg_username": "", "contacts.other_links": ""
      });
      
      reload();
    } catch (error) {
      console.error('Failed to save creator:', error);
    }
  };
  
  const editCreator = (creator) => {
    setEditingCreator(creator);
    setCreatorForm({
      name: creator.name || "",
      bio: creator.bio || "",
      category: creator.category || "",
      tags: (creator.tags || []).join(', '),
      country: creator.country || "RU",
      language: creator.language || "ru",
      avatar_url: creator.avatar_url || "",
      priority_level: creator.priority_level || "normal",
      "pricing.min_price": creator.pricing?.min_price || "",
      "pricing.max_price": creator.pricing?.max_price || "",
      "pricing.currency": creator.pricing?.currency || "RUB",
      "contacts.email": creator.contacts?.email || "",
      "contacts.tg_username": creator.contacts?.tg_username || "",
      "contacts.other_links": (creator.contacts?.other_links || []).join('\n')
    });
  };
  
  const deleteCreator = async (id) => {
    if (window.confirm('Удалить создателя?')) {
      await axios.delete(`${API}/creators/${id}`);
      reload();
    }
  };
  
  const verifyCreator = async (id, verified) => {
    await axios.post(`${API}/creators/${id}/verify`, { verified });
    reload();
  };
  
  const featureCreator = async (id, priority_level) => {
    await axios.post(`${API}/creators/${id}/feature`, { priority_level });
    reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Админ-панель</h2>
        <div className="flex items-center gap-3">
          <button className="btn" onClick={seedDemo}>Заполнить демо</button>
          <div className="text-sm text-gray-600">Мертвые ссылки: {deadInfo.dead}</div>
          <button className="btn" onClick={runLinkCheck}>Проверить ссылки</button>
          <button className="btn" onClick={onLogout}>Выйти</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {[
            { k: "summary", label: "Сводка" }, 
            { k: "drafts", label: "Черновики" }, 
            { k: "approved", label: "Опубликованные" }, 
            { k: "creators", label: "Создатели" },
            { k: "add", label: "Добавить" }, 
            { k: "import", label: "Импорт" }
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={classNames("chip", tab === t.k && "chip-active")}>{t.label}</button>
          ))}
        </div>

        {tab === "summary" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card card-pad">
              <h3 className="font-semibold mb-3">Тренды</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">{(trending || []).map((it) => (<Card key={it.id} item={it} onOpen={onOpenDetail} />))}</div>
            </div>
            <div className="card card-pad">
              <h3 className="font-semibold mb-3">Счётчики</h3>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="p-3 rounded-xl border bg-gray-50">Черновики<br/><span className="font-semibold">{deadInfo.draft ?? '-'}</span></div>
                <div className="p-3 rounded-xl border bg-gray-50">Опубликованные<br/><span className="font-semibold">{deadInfo.approved ?? '-'}</span></div>
                <div className="p-3 rounded-xl border bg-gray-50">Мёртвые ссылки<br/><span className="font-semibold">{deadInfo.dead ?? '-'}</span></div>
              </div>
              <h3 className="font-semibold mt-4 mb-2">Мёртвые ссылки</h3>
              <div className="space-y-2 max-h-48 overflow-auto">
                {(deadList || []).map((d) => (
                  <div key={d.id} className="p-2 rounded-xl border flex items-center justify-between">
                    <div className="text-sm truncate mr-2">{d.name}</div>
                    <a href={d.link.startsWith("http") ? d.link : `https://${d.link}`} target="_blank" rel="noreferrer" className="btn">Открыть</a>
                  </div>
                ))}
                {(!deadList || deadList.length === 0) && (<div className="text-sm text-gray-500">Нет проблемных ссылок</div>)}
              </div>
            </div>
          </div>
        )}

        {tab === "add" && (
          <form onSubmit={saveManual} className="card card-pad grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="h-11 rounded-xl border px-4" placeholder="Название" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Ссылка t.me/..." value={manual.link} onChange={(e) => setManual({ ...manual, link: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Аватар URL" value={manual.avatar_url} onChange={(e) => setManual({ ...manual, avatar_url: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Категория" value={manual.category} onChange={(e) => setManual({ ...manual, category: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Язык" value={manual.language} onChange={(e) => setManual({ ...manual, language: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Страна" value={manual.country} onChange={(e) => setManual({ ...manual, country: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Город" value={manual.city} onChange={(e) => setManual({ ...manual, city: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Подписчики" type="number" value={manual.subscribers} onChange={(e) => setManual({ ...manual, subscribers: Number(e.target.value) })} />
            <input className="h-11 rounded-xl border px-4" placeholder="ER %" type="number" step="0.1" value={manual.er} onChange={(e) => setManual({ ...manual, er: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Цена (₽)" type="number" value={manual.price_rub} onChange={(e) => setManual({ ...manual, price_rub: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="CPM (₽)" type="number" step="0.1" value={manual.cpm_rub} onChange={(e) => setManual({ ...manual, cpm_rub: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Рост 30д %" type="number" step="0.1" value={manual.growth_30d} onChange={(e) => setManual({ ...manual, growth_30d: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Последний пост (ISO)" value={manual.last_post_at} onChange={(e) => setManual({ ...manual, last_post_at: e.target.value })} />
            <input className="h-11 rounded-xl border px-4 md:col-span-3" placeholder="Короткое описание" value={manual.short_description} onChange={(e) => setManual({ ...manual, short_description: e.target.value })} />
            <button className="btn-primary md:col-span-3">Сохранить черновик</button>
          </form>
        )}

        {tab === "import" && (
          <div className="card card-pad space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select className="h-11 rounded-xl border px-4" value={importSource} onChange={(e) => setImportSource(e.target.value)}>
                <option value="telemetr">Telemetr</option>
                <option value="tgstat">TGStat</option>
                <option value="telega">Telega.in</option>
              </select>
              <input className="h-11 rounded-xl border px-4 md:col-span-3" placeholder="URL списка для парсинга" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
              <button className="btn-primary" onClick={runImport}>Запустить</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <textarea className="h-24 rounded-xl border px-4 py-2 md:col-span-4" placeholder="Вставьте t.me ссылки (через перенос строки, запятую или пробел)" value={pasteLinks} onChange={(e) => setPasteLinks(e.target.value)} />
              <button className="btn-primary" onClick={runPasteImport}>Импорт из ссылок</button>
            </div>
          </div>
        )}

        {tab === "drafts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {drafts.map((d) => (
              <div key={d.id} className="card card-pad">
                <div className="flex items-center justify-between"><div className="font-semibold">{d.name}</div><div className="text-xs text-gray-500">{d.category || "-"}</div></div>
                <div className="text-sm text-gray-600 mt-1">{d.link}</div>
                <textarea className="w-full h-24 rounded-xl border px-3 py-2 mt-2" placeholder="SEO-описание" defaultValue={d.seo_description || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { seo_description: e.target.value }); }} />
                <div className="flex items-center gap-2 mt-2">
                  <button className="btn" onClick={() => approve(d.id)}>Опубликовать</button>
                  <button className="btn" onClick={() => reject(d.id)}>Отклонить</button>
                </div>
              </div>
            ))}
            {drafts.length === 0 && <div className="text-sm text-gray-600">Черновиков нет</div>}
          </div>
        )}

        {tab === "approved" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approved.map((d) => (
              <div key={d.id} className="card card-pad">
                <div className="flex items-center justify-between"><div className="font-semibold">{d.name}</div><div className="text-xs text-gray-500">{d.category || "-"}</div></div>
                <div className="text-sm text-gray-600 mt-1">{d.link}</div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <label className="flex items-center gap-2">Избранный <input type="checkbox" defaultChecked={d.is_featured} onChange={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { is_featured: e.target.checked }); }} /></label>
                  <label>ER %<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.er || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { er: Number(e.target.value || 0) }); }} /></label>
                  <label>Цена ₽<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.price_rub || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { price_rub: Number(e.target.value || 0) }); }} /></label>
                  <label>CPM ₽<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.cpm_rub || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { cmp_rub: Number(e.target.value || 0) }); }} /></label>
                  <label>Рост 30д %<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.growth_30d || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { growth_30d: Number(e.target.value || 0) }); }} /></label>
                  <label>Язык<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.language || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { language: e.target.value }); }} /></label>
                  <label>Страна<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.country || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { country: e.target.value }); }} /></label>
                  <label>Город<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.city || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { city: e.target.value }); }} /></label>
                  <label>Последний пост ISO<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.last_post_at || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { last_post_at: e.target.value }); }} /></label>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button className="ml-auto btn" onClick={() => onOpenDetail(d)}>Открыть</button>
                </div>
              </div>
            ))}
            {approved.length === 0 && <div className="text-sm text-gray-600">Опубликованных каналов нет</div>}
          </div>
        )}

        {tab === "creators" && (
          <div className="space-y-4">
            {/* Creators Management Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Создатели ({creators.length})</h3>
              <div className="flex items-center gap-2">
                <button className="btn" onClick={seedCreators}>Заполнить демо создателей</button>
                <button className="btn-primary" onClick={() => {
                  setEditingCreator(null);
                  setCreatorForm({
                    name: "", bio: "", category: "", tags: "", country: "RU", 
                    language: "ru", avatar_url: "", priority_level: "normal",
                    "pricing.min_price": "", "pricing.max_price": "", "pricing.currency": "RUB",
                    "contacts.email": "", "contacts.tg_username": "", "contacts.other_links": ""
                  });
                }}>Добавить создателя</button>
              </div>
            </div>

            {/* Creator Form */}
            {(editingCreator || creatorForm.name) && (
              <form onSubmit={saveCreator} className="card card-pad space-y-4">
                <h4 className="font-semibold">{editingCreator ? 'Редактировать создателя' : 'Новый создатель'}</h4>
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input 
                    className="h-11 rounded-xl border px-4" 
                    placeholder="Имя *" 
                    value={creatorForm.name} 
                    onChange={(e) => setCreatorForm({...creatorForm, name: e.target.value})} 
                    required 
                  />
                  <input 
                    className="h-11 rounded-xl border px-4" 
                    placeholder="Категория" 
                    value={creatorForm.category} 
                    onChange={(e) => setCreatorForm({...creatorForm, category: e.target.value})} 
                  />
                  <select 
                    className="h-11 rounded-xl border px-4" 
                    value={creatorForm.priority_level} 
                    onChange={(e) => setCreatorForm({...creatorForm, priority_level: e.target.value})}
                  >
                    <option value="normal">Normal</option>
                    <option value="featured">Featured</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                
                <textarea 
                  className="w-full h-24 rounded-xl border px-4 py-2" 
                  placeholder="Описание создателя" 
                  value={creatorForm.bio} 
                  onChange={(e) => setCreatorForm({...creatorForm, bio: e.target.value})} 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input 
                    className="h-11 rounded-xl border px-4" 
                    placeholder="Теги (через запятую)" 
                    value={creatorForm.tags} 
                    onChange={(e) => setCreatorForm({...creatorForm, tags: e.target.value})} 
                  />
                  <input 
                    className="h-11 rounded-xl border px-4" 
                    placeholder="Страна (RU, UA, BY)" 
                    value={creatorForm.country} 
                    onChange={(e) => setCreatorForm({...creatorForm, country: e.target.value})} 
                  />
                  <input 
                    className="h-11 rounded-xl border px-4" 
                    placeholder="Язык (ru, en)" 
                    value={creatorForm.language} 
                    onChange={(e) => setCreatorForm({...creatorForm, language: e.target.value})} 
                  />
                </div>
                
                <input 
                  className="w-full h-11 rounded-xl border px-4" 
                  placeholder="URL аватара" 
                  value={creatorForm.avatar_url} 
                  onChange={(e) => setCreatorForm({...creatorForm, avatar_url: e.target.value})} 
                />
                
                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input 
                    className="h-11 rounded-xl border px-4" 
                    placeholder="Мин. цена ₽" 
                    type="number" 
                    value={creatorForm["pricing.min_price"]} 
                    onChange={(e) => setCreatorForm({...creatorForm, "pricing.min_price": e.target.value})} 
                  />
                  <input 
                    className="h-11 rounded-xl border px-4" 
                    placeholder="Макс. цена ₽" 
                    type="number" 
                    value={creatorForm["pricing.max_price"]} 
                    onChange={(e) => setCreatorForm({...creatorForm, "pricing.max_price": e.target.value})} 
                  />
                  <select 
                    className="h-11 rounded-xl border px-4" 
                    value={creatorForm["pricing.currency"]} 
                    onChange={(e) => setCreatorForm({...creatorForm, "pricing.currency": e.target.value})}
                  >
                    <option value="RUB">RUB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                
                {/* Contacts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input 
                    className="h-11 rounded-xl border px-4" 
                    placeholder="Email" 
                    type="email" 
                    value={creatorForm["contacts.email"]} 
                    onChange={(e) => setCreatorForm({...creatorForm, "contacts.email": e.target.value})} 
                  />
                  <input 
                    className="h-11 rounded-xl border px-4" 
                    placeholder="Telegram username" 
                    value={creatorForm["contacts.tg_username"]} 
                    onChange={(e) => setCreatorForm({...creatorForm, "contacts.tg_username": e.target.value})} 
                  />
                </div>
                
                <textarea 
                  className="w-full h-20 rounded-xl border px-4 py-2" 
                  placeholder="Другие ссылки (по одной на строку)" 
                  value={creatorForm["contacts.other_links"]} 
                  onChange={(e) => setCreatorForm({...creatorForm, "contacts.other_links": e.target.value})} 
                />
                
                <div className="flex items-center gap-2">
                  <button type="submit" className="btn-primary">
                    {editingCreator ? 'Обновить' : 'Создать'}
                  </button>
                  {editingCreator && (
                    <button type="button" className="btn" onClick={() => setEditingCreator(null)}>
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Creators List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.map((creator) => (
                <div key={creator.id} className="card card-pad">
                  <div className="flex items-start gap-3">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt={creator.name} className="h-16 w-16 rounded-xl object-cover border" />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {(creator.name || '?').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{creator.name}</h4>
                        {creator.flags?.verified && <span className="badge badge-green">✓</span>}
                        {creator.priority_level === "premium" && <span className="badge badge-yellow">Premium</span>}
                        {creator.priority_level === "featured" && <span className="badge badge-blue">Featured</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{creator.category} • {creator.language}</div>
                      {creator.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{creator.bio}</p>}
                    </div>
                  </div>
                  
                  {/* Metrics */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>👥 {ruShort(creator.metrics?.subscribers_total || 0)}</div>
                    <div>📢 {creator.metrics?.channels_count || 0} каналов</div>
                    {creator.pricing?.min_price && (
                      <div>💰 {ruShort(creator.pricing.min_price)}-{ruShort(creator.pricing.max_price)} ₽</div>
                    )}
                    {creator.metrics?.avg_er_percent && (
                      <div>📊 ER {creator.metrics.avg_er_percent}%</div>
                    )}
                  </div>
                  
                  {/* Tags */}
                  {creator.tags && creator.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {creator.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded-lg">{tag}</span>
                      ))}
                      {creator.tags.length > 3 && <span className="text-xs text-gray-500">+{creator.tags.length - 3}</span>}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <button className="btn" onClick={() => editCreator(creator)}>Изменить</button>
                    <button 
                      className={creator.flags?.verified ? "btn" : "btn-primary"} 
                      onClick={() => verifyCreator(creator.id, !creator.flags?.verified)}
                    >
                      {creator.flags?.verified ? 'Убрать галочку' : 'Верифицировать'}
                    </button>
                    <select 
                      className="h-8 rounded border px-2 text-xs" 
                      value={creator.priority_level} 
                      onChange={(e) => featureCreator(creator.id, e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="featured">Featured</option>
                      <option value="premium">Premium</option>
                    </select>
                    <button className="btn text-red-600" onClick={() => deleteCreator(creator.id)}>Удалить</button>
                  </div>
                </div>
              ))}
              {creators.length === 0 && <div className="text-sm text-gray-600 col-span-full">Создателей нет</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const [canFirst, setCanFirst] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  
  useEffect(() => { 
    if (!localStorage.getItem("token")) {
      axios.get(`${API}/auth/can-register`).then((res) => { 
        if (res.data && res.data.allowed) setCanFirst(true); 
      }); 
    }
  }, []);

  const goAdmin = () => { 
    if (localStorage.getItem('token')) {
      navigate('/admin');
    } else {
      // Open auth modal instead of redirecting
      setAuthModalMode(canFirst ? 'register' : 'login');
      setAuthModalOpen(true);
    }
  };
  
  const openDetail = (ch) => { navigate(`/c/${ch.id}`); };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    navigate('/admin');
  };

  // Functions to open specific modal modes
  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Catalog onGoAdmin={goAdmin} onOpenLogin={openLoginModal} onOpenRegister={openRegisterModal} onOpenDetail={openDetail} />} />
        <Route path="/creators" element={<CreatorsCatalog onGoAdmin={goAdmin} />} />
        <Route path="/c/:id" element={<RouteDetail />} />
        <Route path="/admin" element={<Admin onLogout={() => { localStorage.removeItem("token"); navigate('/'); }} onOpenDetail={openDetail} />} />
        <Route path="/login" element={<Login onLoggedIn={() => navigate('/admin')} onBack={() => navigate('/')} />} />
        {canFirst && <Route path="/first" element={<FirstAdmin onDone={() => navigate('/admin')} onBackToCatalog={() => navigate('/')} />} />}
        <Route path="*" element={<Catalog onGoAdmin={goAdmin} onOpenLogin={openLoginModal} onOpenRegister={openRegisterModal} onOpenDetail={openDetail} />} />
      </Routes>
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

const RouteDetail = () => {
  const navigate = useNavigate();
  const id = window.location.pathname.replace('/c/', '');
  return <Detail id={id} onBack={() => navigate('/')} />;
};

// Creators Catalog Component (Public)
const CreatorsCatalog = ({ onGoAdmin }) => {
  const [creators, setCreators] = useState([]);
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    priority_level: "",
    verified: "",
    country: "",
    subscribers_min: "",
    subscribers_max: "",
    price_min: "",
    price_max: ""
  });
  
  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);
  const [sortBy, setSortBy] = useState("subscribers");  // Frontend-friendly name
  const [sortOrder, setSortOrder] = useState("desc");

  // Map frontend sort names to backend field names
  const getSortField = (frontendSort) => {
    const sortMap = {
      "subscribers": "subscribers",  // Backend maps this to metrics.subscribers_total
      "name": "name",
      "created_at": "created_at",
      "price": "price",
      "er": "er"
    };
    return sortMap[frontendSort] || "subscribers";
  };

  // Load creators data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const backendSortField = getSortField(sortBy);
        console.log('Loading creators data...', `${API}/creators?limit=100&sort=${backendSortField}&order=${sortOrder}`);
        const [creatorsRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/creators?limit=100&sort=${backendSortField}&order=${sortOrder}`),
          axios.get(`${API}/categories`)
        ]);
        
        console.log('Creators response:', creatorsRes.data);
        console.log('Categories response:', categoriesRes.data);
        
        setCreators(creatorsRes.data.items || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Failed to load creators:', error);
        setCreators([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sortBy, sortOrder]);

  // Apply filters
  useEffect(() => {
    console.log('Applying filters to creators:', creators.length, 'creators');
    let filtered = [...creators];

    // Text search
    if (filters.q) {
      const query = filters.q.toLowerCase();
      filtered = filtered.filter(creator => 
        creator.name?.toLowerCase().includes(query) ||
        creator.bio?.toLowerCase().includes(query) ||
        creator.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(creator => creator.category === filters.category);
    }

    // Priority level filter
    if (filters.priority_level) {
      filtered = filtered.filter(creator => creator.priority_level === filters.priority_level);
    }

    // Verified filter
    if (filters.verified !== "") {
      const isVerified = filters.verified === "true";
      filtered = filtered.filter(creator => creator.flags?.verified === isVerified);
    }

    // Country filter
    if (filters.country) {
      filtered = filtered.filter(creator => creator.country === filters.country);
    }

    // Subscriber range filter
    if (filters.subscribers_min) {
      filtered = filtered.filter(creator => (creator.metrics?.subscribers_total || 0) >= Number(filters.subscribers_min));
    }
    if (filters.subscribers_max) {
      filtered = filtered.filter(creator => (creator.metrics?.subscribers_total || 0) <= Number(filters.subscribers_max));
    }

    // Price range filter
    if (filters.price_min) {
      filtered = filtered.filter(creator => (creator.pricing?.min_price || 0) >= Number(filters.price_min));
    }
    if (filters.price_max) {
      filtered = filtered.filter(creator => (creator.pricing?.max_price || 0) <= Number(filters.price_max));
    }

    console.log('Filtered creators:', filtered.length, 'out of', creators.length);
    setFilteredCreators(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [creators, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredCreators.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCreators = filteredCreators.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      q: "", category: "", priority_level: "", verified: "", country: "",
      subscribers_min: "", subscribers_max: "", price_min: "", price_max: ""
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Загрузка создателей...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Каталог Создателей</h1>
          <div className="flex items-center gap-4">
            <a href="/" className="btn">← Каналы</a>
            <button onClick={onGoAdmin} className="btn">Админ</button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-80 sidebar sticky top-6 h-fit">
            <h3 className="font-semibold mb-4">Фильтры</h3>
            
            {/* Search */}
            <input
              className="w-full h-11 rounded-xl border px-4 mb-4"
              placeholder="Поиск по имени, описанию, тегам"
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
            />

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Категория</label>
              <select
                className="w-full h-11 rounded-xl border px-4"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">Все категории</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Priority Level */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Уровень</label>
              <select
                className="w-full h-11 rounded-xl border px-4"
                value={filters.priority_level}
                onChange={(e) => handleFilterChange('priority_level', e.target.value)}
              >
                <option value="">Все уровни</option>
                <option value="premium">Premium</option>
                <option value="featured">Featured</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            {/* Verified */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Верификация</label>
              <select
                className="w-full h-11 rounded-xl border px-4"
                value={filters.verified}
                onChange={(e) => handleFilterChange('verified', e.target.value)}
              >
                <option value="">Все</option>
                <option value="true">Верифицированные</option>
                <option value="false">Не верифицированные</option>
              </select>
            </div>

            {/* Country */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Страна</label>
              <select
                className="w-full h-11 rounded-xl border px-4"
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
              >
                <option value="">Все страны</option>
                <option value="RU">Россия</option>
                <option value="UA">Украина</option>
                <option value="BY">Беларусь</option>
                <option value="KZ">Казахстан</option>
              </select>
            </div>

            {/* Subscriber Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Подписчики</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="h-10 rounded-lg border px-3 text-sm"
                  placeholder="От"
                  value={filters.subscribers_min}
                  onChange={(e) => handleFilterChange('subscribers_min', e.target.value)}
                />
                <input
                  type="number"
                  className="h-10 rounded-lg border px-3 text-sm"
                  placeholder="До"
                  value={filters.subscribers_max}
                  onChange={(e) => handleFilterChange('subscribers_max', e.target.value)}
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Цена (₽)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="h-10 rounded-lg border px-3 text-sm"
                  placeholder="От"
                  value={filters.price_min}
                  onChange={(e) => handleFilterChange('price_min', e.target.value)}
                />
                <input
                  type="number"
                  className="h-10 rounded-lg border px-3 text-sm"
                  placeholder="До"
                  value={filters.price_max}
                  onChange={(e) => handleFilterChange('price_max', e.target.value)}
                />
              </div>
            </div>

            <button onClick={clearFilters} className="w-full btn">
              Сбросить фильтры
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                Найдено: {filteredCreators.length} создателей
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Сортировать:</span>
                <select
                  className="h-10 rounded-lg border px-3 text-sm"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSort, newOrder] = e.target.value.split('-');
                    setSortBy(newSort);
                    setSortOrder(newOrder);
                  }}
                >
                  <option value="subscribers-desc">По подписчикам ↓</option>
                  <option value="subscribers-asc">По подписчикам ↑</option>
                  <option value="name-asc">По имени ↑</option>
                  <option value="name-desc">По имени ↓</option>
                  <option value="created_at-desc">Новые ↓</option>
                  <option value="created_at-asc">Старые ↑</option>
                </select>
              </div>
            </div>

            {/* Creators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>

            {/* No Results */}
            {filteredCreators.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">Создатели не найдены</div>
                <button onClick={clearFilters} className="btn-primary">
                  Сбросить фильтры
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  className="btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ← Пред
                </button>
                
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`pagination ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  className="btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  След →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Creator Card Component
const CreatorCard = ({ creator }) => {
  return (
    <div className="card card-pad hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        {creator.avatar_url ? (
          <img src={creator.avatar_url} alt={creator.name} className="h-16 w-16 rounded-xl object-cover border" />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {(creator.name || '?').slice(0, 2).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{creator.name}</h3>
            {creator.flags?.verified && <span className="badge badge-green">✓</span>}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            {creator.priority_level === "premium" && <span className="badge badge-yellow">Premium</span>}
            {creator.priority_level === "featured" && <span className="badge badge-blue">Featured</span>}
            <span className="text-sm text-gray-500">{creator.category} • {creator.language}</span>
          </div>
          
          {creator.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{creator.bio}</p>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">👥</span>
          <span>{ruShort(creator.metrics?.subscribers_total || 0)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📢</span>
          <span>{creator.metrics?.channels_count || 0} каналов</span>
        </div>
        
        {creator.pricing?.min_price && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">💰</span>
              <span>{ruShort(creator.pricing.min_price)} ₽</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📊</span>
              <span>{creator.metrics?.avg_er_percent ? `${creator.metrics.avg_er_percent}%` : '—'}</span>
            </div>
          </>
        )}
      </div>

      {/* Tags */}
      {creator.tags && creator.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {creator.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded-lg">
              {tag}
            </span>
          ))}
          {creator.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{creator.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button className="flex-1 btn-primary">Подробнее</button>
        {creator.contacts?.tg_username && (
          <a
            href={`https://t.me/${creator.contacts.tg_username}`}
            target="_blank"
            rel="noreferrer"
            className="btn"
          >
            Telegram
          </a>
        )}
        {creator.contacts?.email && (
          <a
            href={`mailto:${creator.contacts.email}`}
            className="btn"
          >
            Email
          </a>
        )}
      </div>
    </div>
  );
};

export default App;