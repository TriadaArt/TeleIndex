import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function classNames(...c) {
  return c.filter(Boolean).join(" ");
}

function formatNum(n) {
  if (n == null) return "-";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const useFetch = (url, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get(url)
      .then((res) => mounted && setData(res.data))
      .catch((e) => mounted && setError(e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, deps);
  return { data, loading, error };
};

const Header = () => (
  <header className="w-full sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" />
        <h1 className="font-semibold text-lg">TeleIndex</h1>
      </div>
      <a
        href="https://t.me"
        target="_blank"
        rel="noreferrer"
        className="text-sm text-indigo-600 hover:text-indigo-700"
      >
        Telegram
      </a>
    </div>
  </header>
);

const Filters = ({ q, setQ, category, setCategory, sort, setSort, categories }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search channels..."
            className="w-full h-11 rounded-xl border px-4 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⌘K</span>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 rounded-xl border px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All categories</option>
          {(categories || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          {[
            { k: "popular", label: "Popular" },
            { k: "new", label: "New" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setSort(t.k)}
              className={classNames(
                "h-11 flex-1 rounded-xl border px-4 shadow-sm",
                sort === t.k
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white hover:bg-gray-50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChannelCard = ({ item }) => {
  const fallback = useMemo(() => {
    const initials = (item?.name || "?")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return initials;
  }, [item?.name]);

  return (
    <div className="group rounded-2xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        {item.avatar_url ? (
          <img
            src={item.avatar_url}
            alt={item.name}
            className="h-12 w-12 rounded-xl object-cover border"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const sib = e.currentTarget.nextSibling;
              if (sib) sib.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={classNames(
            "h-12 w-12 rounded-xl items-center justify-center font-semibold text-white",
            item.avatar_url ? "hidden" : "flex",
            "bg-gradient-to-br from-indigo-500 to-purple-500"
          )}
        >
          {fallback}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate" title={item.name}>
              {item.name}
            </h3>
            {item.language ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">
                {item.language}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {item.short_description || item.seo_description || "No description"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="text-sm text-gray-600">👥 {formatNum(item.subscribers)} subscribers</div>
        <div className="flex items-center gap-2">
          <a
            href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
          >
            Open
          </a>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);

  // Fetch categories once
  const { data: cats } = useFetch(`${API}/categories`, []);

  // Build URL for channels
  const channelsUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (sort) p.set("sort", sort);
    p.set("page", String(page));
    p.set("limit", String(24));
    return `${API}/channels?${p.toString()}`;
  }, [q, category, sort, page]);

  const { data: channels, loading } = useFetch(channelsUrl, [channelsUrl]);

  useEffect(() => {
    // reset page when filters change
    setPage(1);
  }, [q, category, sort]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />
      <Filters
        q={q}
        setQ={setQ}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
        categories={cats}
      />

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse border" />
            ))}
          </div>
        ) : channels && channels.items && channels.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.items.map((item) => (
                <ChannelCard key={item.id} item={item} />
              ))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Total: {channels.total} • Page {channels.page}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
                  disabled={channels.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
                  disabled={!channels.has_more}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gray-100 border flex items-center justify-center">📭</div>
            <p className="mt-4 text-gray-700">No channels yet. Use admin panel to add some.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;