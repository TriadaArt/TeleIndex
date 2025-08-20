import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import { Routes, Route, useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function classNames(...c) { return c.filter(Boolean).join(" "); }
function ruShort(n){ if(n==null) return "-"; try{ const v=Number(n); if(v>=1_000_000) return (Math.round(v/100_000)/10).toString().replace('.',',')+" млн"; if(v>=1_000) return (Math.round(v/100)/10).toString().replace('.',',')+" тыс"; return Intl.NumberFormat('ru-RU').format(v);}catch{ return String(n);} }
function daysAgo(iso) { if (!iso) return "-"; try { const d = new Date(iso); const diff = Math.floor((Date.now() - d.getTime())/(1000*60*60*24)); return String(diff); } catch { return "-"; } }

axios.interceptors.request.use((config) => { const t = localStorage.getItem("token"); if (t) config.headers.Authorization = `Bearer ${t}`; return config; });

const useFetch = (url, deps = []) => { const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); useEffect(() => { let mounted = true; setLoading(true); axios.get(url).then((res) => mounted && setData(res.data)).catch((e) => mounted && setError(e)).finally(() => mounted && setLoading(false)); return () => { mounted = false; }; }, deps); return { data, loading, error }; };

const Header = ({ onGoAdmin, q, setQ, scrollToCats }) => (
  <header className="w-full sticky top-0 z-10 backdrop-blur bg-white/80 border-b">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
      <div className="flex items-center gap-2 mr-auto">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" />
        <h1 className="font-semibold text-lg">TeleIndex</h1>
      </div>
      <div className="flex-1 hidden md:block">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск каналов..." className="w-full h-11 rounded-xl border px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <button className="text-sm text-gray-600 hover:text-gray-900" onClick={scrollToCats}>Категории</button>
      <button className="text-sm text-gray-600 hover:text-gray-900" onClick={onGoAdmin}>Админ</button>
    </div>
  </header>
);

const CategoryBar = React.forwardRef(({ categories, active, setActive }, ref) => (
  <div ref={ref} className="max-w-6xl mx-auto px-4 mt-3 overflow-x-auto">
    <div className="flex items-center gap-2">
      <button className={classNames("px-3 py-1.5 rounded-full border text-sm", !active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white")} onClick={() => setActive("")}>Все</button>
      {(categories || []).map((c) => (
        <button key={c} className={classNames("px-3 py-1.5 rounded-full border text-sm", active === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white") } onClick={() => setActive(c)}>{c}</button>
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
        <button key={t.k} onClick={() => setSort(t.k)} className={classNames("px-3 py-1.5 rounded-lg border text-sm", sort === t.k ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-50")}>{t.label}</button>
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
        <div key={it.id} className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-3">
          <div className="flex items-center gap-3">
            {it.avatar_url ? <img src={it.avatar_url} alt={it.name} className="h-10 w-10 rounded-xl object-cover border" /> : <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white bg-indigo-500 font-semibold">{(it.name||'?').slice(0,2).toUpperCase()}</div>}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate font-medium" title={it.name}>{it.name}</div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 border">В тренде</span>
              </div>
              <div className="text-xs text-gray-600">👥 {ruShort(it.subscribers)}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button onClick={() => onOpen(it)} className="text-xs px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Открыть</button>
            <a href={it.link.startsWith("http") ? it.link : `https://${it.link}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-lg border">Перейти</a>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Card = ({ item, onOpen }) => {
  const initials = (item?.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          {item.avatar_url ? (
            <img src={item.avatar_url} alt={item.name} className="h-14 w-14 rounded-xl object-cover border" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <div className="h-14 w-14 rounded-xl items-center justify-center font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 flex">{initials}</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate" title={item.name}>{item.name}</h3>
              {item.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 border">Избранный</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 flex-wrap">
              {item.category && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.category}</span>}
              {item.language && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.language}</span>}
              {item.country && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.country}{item.city?` • ${item.city}`:""}</span>}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-2 line-clamp-3">{item.short_description || item.seo_description || "Описание отсутствует"}</p>
        <div className="mt-3 text-sm text-gray-700 flex items-center flex-wrap gap-x-4 gap-y-1">
          <span>👥 {ruCompact(item.subscribers)}</span>
          <span>📈 ER {item.er != null ? `${item.er}%` : "-"}</span>
          <span>💰 ₽ {item.price_rub != null ? Intl.NumberFormat('ru-RU').format(item.price_rub) : "-"}</span>
          <span>📊 CPM ₽ {item.cpm_rub != null ? item.cpm_rub : "-"}</span>
          <span>📉 Рост 30д {item.growth_30d != null ? `${item.growth_30d}%` : "-"}</span>
          <span>🕒 Последний пост {daysAgo(item.last_post_at)} дн.</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => onOpen(item)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Открыть</button>
          <a href={item.link.startsWith("http") ? item.link : `https://${item.link}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">Перейти</a>
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
    <div className="flex items-center justify-between mt-6">
      <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50" disabled={page <= 1} onClick={() => onChange(page - 1)}>Назад</button>
      <div className="flex items-center gap-2">
        {items.map((p) => (
          <button key={p} className={classNames("px-3 py-1.5 rounded-lg border text-sm", p === page ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-50")} onClick={() => onChange(p)}>{p}</button>
        ))}
      </div>
      <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50" disabled={page >= pages} onClick={() => onChange(page + 1)}>Вперёд</button>
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
          <div className="rounded-2xl border bg-white shadow-sm p-6">
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
                  <span>👥 {ruCompact(ch.subscribers)} подписчиков</span>
                  {ch.price_rub != null && <span>💰 Цена: ₽ {Intl.NumberFormat('ru-RU').format(ch.price_rub)}</span>}
                </div>
              </div>
              <a href={ch.link.startsWith('http') ? ch.link : `https://${ch.link}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Перейти в Telegram</a>
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
            <div className="p-4 rounded-2xl border bg-white shadow-sm space-y-3">
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск каналов..." className="w-full h-11 rounded-xl border px-4" />
              <div>
                <div className="text-sm font-medium mb-2">Категории</div>
                <div className="flex flex-wrap gap-2">
                  <button className={classNames("px-3 py-1.5 rounded-full border text-sm", !category ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-50")} onClick={()=>setCategory("")}>Все</button>
                  {(cats.data||[]).map(c => (
                    <button key={c} className={classNames("px-3 py-1.5 rounded-full border text-sm", category===c?"bg-indigo-600 text-white border-indigo-600":"bg-white hover:bg-gray-50")} onClick={()=>setCategory(c)}>{c}</button>
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

// -------------------- Admin --------------------

const FirstAdmin = ({ onDone, onBackToCatalog }) => { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [err, setErr] = useState(""); const submit = async (e) => { e.preventDefault(); setErr(""); try { await axios.post(`${API}/auth/register`, { email, password, role: "admin" }); const { data: login } = await axios.post(`${API}/auth/login`, { email, password }); localStorage.setItem("token", login.access_token); onDone(); } catch (e) { setErr("Не удалось создать администратора. Возможно, регистрация отключена."); } }; return (<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4"><form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded-2xl border shadow-sm"><h2 className="text-lg font-semibold mb-4">Создание первого администратора</h2><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-11 rounded-xl border px-4 mb-2" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full h-11 rounded-xl border px-4 mb-2" />{err && <div className="text-red-600 text-sm mb-2">{err}</div>}<div className="flex gap-2"><button className="flex-1 h-11 rounded-xl bg-indigo-600 text-white">Создать и войти</button><button type="button" onClick={onBackToCatalog} className="h-11 rounded-xl border px-4">Отмена</button></div></form></div>); };

const Login = ({ onLoggedIn, onBack }) => { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [err, setErr] = useState(""); const submit = async (e) => { e.preventDefault(); setErr(""); try { const { data } = await axios.post(`${API}/auth/login`, { email, password }); localStorage.setItem("token", data.access_token); onLoggedIn(); } catch { setErr("Неверные учетные данные"); } }; return (<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4"><form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded-2xl border shadow-sm"><h2 className="text-lg font-semibold mb-4">Вход администратора</h2><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-11 rounded-xl border px-4 mb-2" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full h-11 rounded-xl border px-4 mb-2" />{err && <div className="text-red-600 text-sm mb-2">{err}</div>}<div className="flex gap-2"><button className="flex-1 h-11 rounded-xl bg-indigo-600 text-white">Войти</button><button type="button" className="h-11 rounded-xl border px-4" onClick={onBack}>Назад</button></div></form></div>); };

const Admin = ({ onLogout, onOpenDetail }) => {
  const [tab, setTab] = useState("summary");
  const [drafts, setDrafts] = useState([]);
  const [approved, setApproved] = useState([]);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Админ-панель</h2>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm" onClick={seedDemo}>Заполнить демо</button>
          <div className="text-sm text-gray-600">Мертвые ссылки: {deadInfo.dead}</div>
          <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm" onClick={runLinkCheck}>Проверить ссылки</button>
          <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm" onClick={onLogout}>Выйти</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {[{ k: "summary", label: "Сводка" }, { k: "drafts", label: "Черновики" }, { k: "approved", label: "Опубликованные" }, { k: "add", label: "Добавить" }, { k: "import", label: "Импорт" }].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={classNames("px-3 py-1.5 rounded-lg border text-sm", tab === t.k ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-50")}>{t.label}</button>
          ))}
        </div>

        {tab === "summary" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white p-4 rounded-2xl border shadow-sm">
              <h3 className="font-semibold mb-3">Тренды</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">{(trending || []).map((it) => (<Card key={it.id} item={it} onOpen={onOpenDetail} />))}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border shadow-sm">
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
                    <a href={d.link.startsWith("http") ? d.link : `https://${d.link}`} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-lg border">Открыть</a>
                  </div>
                ))}
                {(!deadList || deadList.length === 0) && (<div className="text-sm text-gray-500">Нет проблемных ссылок</div>)}
              </div>
            </div>
          </div>
        )}

        {tab === "add" && (
          <form onSubmit={saveManual} className="bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <button className="h-11 rounded-xl bg-indigo-600 text-white md:col-span-3">Сохранить черновик</button>
          </form>
        )}

        {tab === "import" && (
          <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select className="h-11 rounded-xl border px-4" value={importSource} onChange={(e) => setImportSource(e.target.value)}>
                <option value="telemetr">Telemetr</option>
                <option value="tgstat">TGStat</option>
                <option value="telega">Telega.in</option>
              </select>
              <input className="h-11 rounded-xl border px-4 md:col-span-3" placeholder="URL списка для парсинга" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
              <button className="h-11 rounded-xl bg-indigo-600 text-white" onClick={runImport}>Запустить</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <textarea className="h-24 rounded-xl border px-4 py-2 md:col-span-4" placeholder="Вставьте t.me ссылки (через перенос строки, запятую или пробел)" value={pasteLinks} onChange={(e) => setPasteLinks(e.target.value)} />
              <button className="h-11 rounded-xl bg-indigo-600 text-white" onClick={runPasteImport}>Импорт из ссылок</button>
            </div>
          </div>
        )}

        {tab === "drafts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {drafts.map((d) => (
              <div key={d.id} className="bg-white p-4 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between"><div className="font-semibold">{d.name}</div><div className="text-xs text-gray-500">{d.category || "-"}</div></div>
                <div className="text-sm text-gray-600 mt-1">{d.link}</div>
                <textarea className="w-full h-24 rounded-xl border px-3 py-2 mt-2" placeholder="SEO-описание" defaultValue={d.seo_description || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { seo_description: e.target.value }); }} />
                <div className="flex items-center gap-2 mt-2">
                  <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm" onClick={() => approve(d.id)}>Опубликовать</button>
                  <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm" onClick={() => reject(d.id)}>Отклонить</button>
                </div>
              </div>
            ))}
            {drafts.length === 0 && <div className="text-sm text-gray-600">Черновиков нет</div>}
          </div>
        )}

        {tab === "approved" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approved.map((d) => (
              <div key={d.id} className="bg-white p-4 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between"><div className="font-semibold">{d.name}</div><div className="text-xs text-gray-500">{d.category || "-"}</div></div>
                <div className="text-sm text-gray-600 mt-1">{d.link}</div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <label className="flex items-center gap-2">Избранный <input type="checkbox" defaultChecked={d.is_featured} onChange={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { is_featured: e.target.checked }); }} /></label>
                  <label>ER %<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.er || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { er: Number(e.target.value || 0) }); }} /></label>
                  <label>Цена ₽<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.price_rub || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { price_rub: Number(e.target.value || 0) }); }} /></label>
                  <label>CPM ₽<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.cpm_rub || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { cpm_rub: Number(e.target.value || 0) }); }} /></label>
                  <label>Рост 30д %<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.growth_30d || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { growth_30d: Number(e.target.value || 0) }); }} /></label>
                  <label>Язык<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.language || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { language: e.target.value }); }} /></label>
                  <label>Страна<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.country || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { country: e.target.value }); }} /></label>
                  <label>Город<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.city || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { city: e.target.value }); }} /></label>
                  <label>Последний пост ISO<input className="w-full h-9 rounded-xl border px-2" defaultValue={d.last_post_at || ""} onBlur={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { last_post_at: e.target.value }); }} /></label>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button className="ml-auto px-2 py-1 text-xs rounded-lg border" onClick={() => onOpenDetail(d)}>Открыть</button>
                </div>
              </div>
            ))}
            {approved.length === 0 && <div className="text-sm text-gray-600">Опубликованных каналов нет</div>}
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------- App Router (react-router) --------------------

function App() {
  const navigate = useNavigate();
  const [canFirst, setCanFirst] = useState(false);
  useEffect(() => { if (!localStorage.getItem("token")) axios.get(`${API}/auth/can-register`).then((res) => { if (res.data && res.data.allowed) setCanFirst(true); }); }, []);

  const goAdmin = () => { navigate(localStorage.getItem('token') ? '/admin' : (canFirst ? '/first' : '/login')); };
  const openDetail = (ch) => { navigate(`/c/${ch.id}`); };

  return (
    <Routes>
      <Route path="/" element={<Catalog onGoAdmin={goAdmin} onOpenDetail={openDetail} />} />
      <Route path="/c/:id" element={<RouteDetail />} />
      <Route path="/admin" element={<Admin onLogout={() => { localStorage.removeItem("token"); navigate('/'); }} onOpenDetail={openDetail} />} />
      <Route path="/login" element={<Login onLoggedIn={() => navigate('/admin')} onBack={() => navigate('/')} />} />
      {canFirst && <Route path="/first" element={<FirstAdmin onDone={() => navigate('/admin')} onBackToCatalog={() => navigate('/')} />} />}
      <Route path="*" element={<Catalog onGoAdmin={goAdmin} onOpenDetail={openDetail} />} />
    </Routes>
  );
}

const RouteDetail = () => {
  const navigate = useNavigate();
  const id = window.location.pathname.replace('/c/', '');
  return <Detail id={id} onBack={() => navigate('/')} />;
};

export default App;