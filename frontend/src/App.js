import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function classNames(...c) { return c.filter(Boolean).join(" "); }
function formatNum(n) { if (n == null) return "-"; if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"; if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"; return String(n); }

axios.interceptors.request.use((config) => { const t = localStorage.getItem("token"); if (t) config.headers.Authorization = `Bearer ${t}`; return config; });

const useFetch = (url, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let mounted = true; setLoading(true);
    axios.get(url).then((res) => mounted && setData(res.data)).catch((e) => mounted && setError(e)).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, deps);
  return { data, loading, error };
};

const Header = ({ onGoAdmin }) => (
  <header className="w-full sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" />
        <h1 className="font-semibold text-lg">TeleIndex</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm text-gray-600 hover:text-gray-900" onClick={onGoAdmin}>Админ</button>
      </div>
    </div>
  </header>
);

const CategoryBar = ({ categories, active, setActive }) => (
  <div className="max-w-6xl mx-auto px-4 mt-3 overflow-x-auto">
    <div className="flex items-center gap-2">
      <button className={classNames("px-3 py-1.5 rounded-full border text-sm", !active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white")} onClick={() => setActive("")}>Все</button>
      {(categories || []).map((c) => (
        <button key={c} className={classNames("px-3 py-1.5 rounded-full border text-sm", active === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white") } onClick={() => setActive(c)}>{c}</button>
      ))}
    </div>
  </div>
);

const Filters = ({ q, setQ, sort, setSort }) => (
  <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="md:col-span-2 relative">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск каналов..." className="w-full h-11 rounded-xl border px-4 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⌘K</span>
      </div>
      <div className="flex items-center gap-2">
        {[{ k: "popular", label: "Популярные" }, { k: "new", label: "Новые" }, { k: "name", label: "По имени" }].map((t) => (
          <button key={t.k} onClick={() => setSort(t.k)} className={classNames("h-11 flex-1 rounded-xl border px-4 shadow-sm", sort === t.k ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-50")}>{t.label}</button>
        ))}
      </div>
    </div>
  </div>
);

const ChannelCard = ({ item }) => {
  const initials = (item?.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="group rounded-2xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        {item.avatar_url ? (<img src={item.avatar_url} alt={item.name} className="h-12 w-12 rounded-xl object-cover border" onError={(e) => { e.currentTarget.style.display = "none"; }} />) : (
          <div className="h-12 w-12 rounded-xl items-center justify-center font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 flex">{initials}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate" title={item.name}>{item.name}</h3>
            {item.category ? (<span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">{item.category}</span>) : null}
            {item.is_featured ? (<span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 border">🔥 Избранный</span>) : null}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{item.short_description || item.seo_description || "Описание отсутствует"}</p>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="text-sm text-gray-600">👥 {formatNum(item.subscribers)} подписчиков</div>
        <a href={item.link.startsWith("http") ? item.link : `https://${item.link}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">Открыть</a>
      </div>
    </div>
  );
};

const Trending = () => { const { data } = useFetch(`${API}/channels/trending`, []); if (!data || !data.length) return null; return (
  <section className="max-w-6xl mx-auto px-4 mt-6">
    <h2 className="text-lg font-semibold mb-3">Тренды</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{data.map((item) => (<ChannelCard key={item.id} item={item} />))}</div>
  </section> ); };

const Catalog = ({ onGoAdmin }) => {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const { data: cats } = useFetch(`${API}/categories`, []);
  const channelsUrl = useMemo(() => { const p = new URLSearchParams(); if (q) p.set("q", q); if (category) p.set("category", category); if (sort) p.set("sort", sort); p.set("page", String(page)); p.set("limit", String(24)); return `${API}/channels?${p.toString()}`; }, [q, category, sort, page]);
  const { data: channels, loading } = useFetch(channelsUrl, [channelsUrl]);
  useEffect(() => { setPage(1); }, [q, category, sort]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header onGoAdmin={onGoAdmin} />
      <Filters q={q} setQ={setQ} sort={sort} setSort={setSort} />
      <CategoryBar categories={cats} active={category} setActive={setCategory} />
      <Trending />
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 9 }).map((_, i) => (<div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse border" />))}</div>
        ) : channels && channels.items && channels.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{channels.items.map((item) => (<ChannelCard key={item.id} item={item} />))}</div>
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">Всего: {channels.total} • Страница {channels.page}</div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50" disabled={channels.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</button>
                <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50" disabled={!channels.has_more} onClick={() => setPage((p) => p + 1)}>Вперёд</button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16"><div className="mx-auto h-16 w-16 rounded-2xl bg-gray-100 border flex items-center justify-center">📭</div><p className="mt-4 text-gray-700">Каналов пока нет. Добавьте через админ-панель.</p></div>
        )}
      </main>
    </div>
  );
};

const FirstAdmin = ({ onDone }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      const { data: reg } = await axios.post(`${API}/auth/register`, { email, password, role: "admin" });
      // auto-login
      const { data: login } = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem("token", login.access_token);
      onDone();
    } catch (e) { setErr("Не удалось создать администратора. Возможно, регистрация отключена."); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Создание первого администратора</h2>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-11 rounded-xl border px-4 mb-2" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full h-11 rounded-xl border px-4 mb-2" />
        {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
        <button className="w-full h-11 rounded-xl bg-indigo-600 text-white">Создать и войти</button>
      </form>
    </div>
  );
};

const Login = ({ onLoggedIn, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try { const { data } = await axios.post(`${API}/auth/login`, { email, password }); localStorage.setItem("token", data.access_token); onLoggedIn(); }
    catch { setErr("Неверные учетные данные"); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Вход администратора</h2>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-11 rounded-xl border px-4 mb-2" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full h-11 rounded-xl border px-4 mb-2" />
        {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
        <div className="flex gap-2">
          <button className="flex-1 h-11 rounded-xl bg-indigo-600 text-white">Войти</button>
          <button type="button" className="h-11 rounded-xl border px-4" onClick={onBack}>Назад</button>
        </div>
      </form>
    </div>
  );
};

const Admin = ({ onLogout }) => {
  const [tab, setTab] = useState("summary");
  const [drafts, setDrafts] = useState([]);
  const [approved, setApproved] = useState([]);
  const [deadInfo, setDeadInfo] = useState({ dead: 0 });
  const [deadList, setDeadList] = useState([]);
  const [manual, setManual] = useState({ name: "", link: "", category: "", subscribers: 0 });
  const [importUrl, setImportUrl] = useState("");
  const [importSource, setImportSource] = useState("telemetr");
  const { data: trending } = useFetch(`${API}/channels/trending`, []);

  const reload = async () => {
    const d = await axios.get(`${API}/admin/channels?status=draft`); setDrafts(d.data.items || []);
    const a = await axios.get(`${API}/admin/channels?status=approved`); setApproved(a.data.items || []);
    const s = await axios.get(`${API}/admin/summary`); setDeadInfo(s.data);
    const dl = await axios.get(`${API}/admin/dead`); setDeadList(dl.data || []);
  };
  useEffect(() => { reload(); }, []);

  const approve = async (id) => { await axios.post(`${API}/admin/channels/${id}/approve`); reload(); };
  const reject = async (id) => { await axios.post(`${API}/admin/channels/${id}/reject`); reload(); };
  const saveManual = async (e) => { e.preventDefault(); await axios.post(`${API}/admin/channels`, { ...manual, status: "draft" }); setManual({ name: "", link: "", category: "", subscribers: 0 }); reload(); };
  const runImport = async () => { const ep = importSource === "telemetr" ? "telemetr" : "tgstat"; await axios.post(`${API}/parser/${ep}`, null, { params: { list_url: importUrl } }); reload(); };
  const runLinkCheck = async () => { await axios.post(`${API}/admin/links/check`, null, { params: { limit: 50, replace_dead: false } }); reload(); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Админ-панель</h2>
        <div className="flex items-center gap-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">{(trending || []).map((it) => (<ChannelCard key={it.id} item={it} />))}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border shadow-sm">
              <h3 className="font-semibold mb-3">Мертвые ссылки</h3>
              <div className="space-y-2">
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
          <form onSubmit={saveManual} className="bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="h-11 rounded-xl border px-4" placeholder="Название" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Ссылка t.me/..." value={manual.link} onChange={(e) => setManual({ ...manual, link: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Категория" value={manual.category} onChange={(e) => setManual({ ...manual, category: e.target.value })} />
            <input className="h-11 rounded-xl border px-4" placeholder="Подписчики" type="number" value={manual.subscribers} onChange={(e) => setManual({ ...manual, subscribers: Number(e.target.value) })} />
            <button className="h-11 rounded-xl bg-indigo-600 text-white">Сохранить черновик</button>
          </form>
        )}

        {tab === "import" && (
          <div className="bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className="h-11 rounded-xl border px-4" value={importSource} onChange={(e) => setImportSource(e.target.value)}>
              <option value="telemetr">Telemetr</option>
              <option value="tgstat">TGStat</option>
            </select>
            <input className="h-11 rounded-xl border px-4 md:col-span-2" placeholder="URL списка для парсинга" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
            <button className="h-11 rounded-xl bg-indigo-600 text-white" onClick={runImport}>Запустить</button>
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
          </div>
        )}

        {tab === "approved" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approved.map((d) => (
              <div key={d.id} className="bg-white p-4 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between"><div className="font-semibold">{d.name}</div><div className="text-xs text-gray-500">{d.category || "-"}</div></div>
                <div className="text-sm text-gray-600 mt-1">{d.link}</div>
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-sm">Избранный</label>
                  <input type="checkbox" defaultChecked={d.is_featured} onChange={async (e) => { await axios.patch(`${API}/admin/channels/${d.id}`, { is_featured: e.target.checked }); }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [view, setView] = useState("catalog");
  const [canFirst, setCanFirst] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("token")) { setView("admin"); return; }
    axios.get(`${API}/auth/can-register`).then((res) => { if (res.data && res.data.allowed) { setCanFirst(true); setView("first"); } });
  }, []);
  if (view === "admin") return <Admin onLogout={() => { localStorage.removeItem("token"); setView("catalog"); }} />;
  if (view === "login") return <Login onLoggedIn={() => setView("admin")} onBack={() => setView("catalog")} />;
  if (view === "first" && canFirst) return <FirstAdmin onDone={() => setView("admin")} />;
  return <Catalog onGoAdmin={() => setView(localStorage.getItem("token") ? "admin" : (canFirst ? "first" : "login"))} />;
}

export default App;