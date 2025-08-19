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
  if (n &gt;= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n &gt;= 1_000) return (n / 1_000).toFixed(1) + "K";
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
      .then((res) => mounted &amp;&amp; setData(res.data))
      .catch((e) => mounted &amp;&amp; setError(e))
      .finally(() => mounted &amp;&amp; setLoading(false));
    return () => {
      mounted = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, loading, error };
};

const Header = () => (
  &lt;header className="w-full sticky top-0 z-10 backdrop-blur bg-white/70 border-b"&gt;
    &lt;div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between"&gt;
      &lt;div className="flex items-center gap-2"&gt;
        &lt;div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" /&gt;
        &lt;h1 className="font-semibold text-lg"&gt;TeleIndex&lt;/h1&gt;
      &lt;/div&gt;
      &lt;a
        href="https://t.me"
        target="_blank"
        rel="noreferrer"
        className="text-sm text-indigo-600 hover:text-indigo-700"
      &gt;
        Telegram
      &lt;/a&gt;
    &lt;/div&gt;
  &lt;/header&gt;
);

const Filters = ({ q, setQ, category, setCategory, sort, setSort, categories }) =&gt; {
  return (
    &lt;div className="max-w-6xl mx-auto px-4 pt-6 pb-4"&gt;
      &lt;div className="grid grid-cols-1 md:grid-cols-4 gap-3"&gt;
        &lt;div className="md:col-span-2 relative"&gt;
          &lt;input
            value={q}
            onChange={(e) =&gt; setQ(e.target.value)}
            placeholder="Search channels..."
            className="w-full h-11 rounded-xl border px-4 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          /&gt;
          &lt;span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"&gt;⌘K&lt;/span&gt;
        &lt;/div&gt;
        &lt;select
          value={category}
          onChange={(e) =&gt; setCategory(e.target.value)}
          className="h-11 rounded-xl border px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        &gt;
          &lt;option value=""&gt;All categories&lt;/option&gt;
          {(categories || []).map((c) =&gt; (
            &lt;option key={c} value={c}&gt;
              {c}
            &lt;/option&gt;
          ))}
        &lt;/select&gt;
        &lt;div className="flex items-center gap-2"&gt;
          {[
            { k: "popular", label: "Popular" },
            { k: "new", label: "New" },
          ].map((t) =&gt; (
            &lt;button
              key={t.k}
              onClick={() =&gt; setSort(t.k)}
              className={classNames(
                "h-11 flex-1 rounded-xl border px-4 shadow-sm",
                sort === t.k
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white hover:bg-gray-50"
              )}
            &gt;
              {t.label}
            &lt;/button&gt;
          ))}
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
};

const ChannelCard = ({ item }) =&gt; {
  const fallback = useMemo(() =&gt; {
    const initials = (item?.name || "?")
      .split(" ")
      .map((s) =&gt; s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return initials;
  }, [item?.name]);

  return (
    &lt;div className="group rounded-2xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden"&gt;
      &lt;div className="flex items-center gap-3 p-4"&gt;
        {item.avatar_url ? (
          &lt;img
            src={item.avatar_url}
            alt={item.name}
            className="h-12 w-12 rounded-xl object-cover border"
            onError={(e) =&gt; {
              e.currentTarget.style.display = "none";
              const sib = e.currentTarget.nextSibling;
              if (sib) sib.style.display = "flex";
            }}
          /&gt;
        ) : null}
        &lt;div
          className={classNames(
            "h-12 w-12 rounded-xl items-center justify-center font-semibold text-white",
            item.avatar_url ? "hidden" : "flex",
            "bg-gradient-to-br from-indigo-500 to-purple-500"
          )}
        &gt;
          {fallback}
        &lt;/div&gt;
        &lt;div className="min-w-0 flex-1"&gt;
          &lt;div className="flex items-center gap-2"&gt;
            &lt;h3 className="font-semibold truncate" title={item.name}&gt;
              {item.name}
            &lt;/h3&gt;
            {item.language ? (
              &lt;span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border"&gt;
                {item.language}
              &lt;/span&gt;
            ) : null}
          &lt;/div&gt;
          &lt;p className="text-sm text-gray-600 line-clamp-2"&gt;
            {item.short_description || item.seo_description || "No description"}
          &lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;
      &lt;div className="flex items-center justify-between px-4 pb-4"&gt;
        &lt;div className="text-sm text-gray-600"&gt;👥 {formatNum(item.subscribers)} subscribers&lt;/div&gt;
        &lt;div className="flex items-center gap-2"&gt;
          &lt;a
            href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
          &gt;
            Open
          &lt;/a&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
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
  const channelsUrl = useMemo(() =&gt; {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (sort) p.set("sort", sort);
    p.set("page", String(page));
    p.set("limit", String(24));
    return `${API}/channels?${p.toString()}`;
  }, [q, category, sort, page]);

  const { data: channels, loading } = useFetch(channelsUrl, [channelsUrl]);

  useEffect(() =&gt; {
    // reset page when filters change
    setPage(1);
  }, [q, category, sort]);

  return (
    &lt;div className="min-h-screen bg-gradient-to-b from-white to-gray-50"&gt;
      &lt;Header /&gt;
      &lt;Filters
        q={q}
        setQ={setQ}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
        categories={cats}
      /&gt;

      &lt;main className="max-w-6xl mx-auto px-4 pb-16"&gt;
        {loading ? (
          &lt;div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"&gt;
            {Array.from({ length: 9 }).map((_, i) =&gt; (
              &lt;div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse border" /&gt;
            ))}
          &lt;/div&gt;
        ) : channels &amp;&amp; channels.items &amp;&amp; channels.items.length &gt; 0 ? (
          &lt;&gt;
            &lt;div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"&gt;
              {channels.items.map((item) =&gt; (
                &lt;ChannelCard key={item.id} item={item} /&gt;
              ))}
            &lt;/div&gt;
            &lt;div className="flex items-center justify-between mt-6"&gt;
              &lt;div className="text-sm text-gray-600"&gt;
                Total: {channels.total} • Page {channels.page}
              &lt;/div&gt;
              &lt;div className="flex items-center gap-2"&gt;
                &lt;button
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
                  disabled={channels.page &lt;= 1}
                  onClick={() =&gt; setPage((p) =&gt; Math.max(1, p - 1))}
                &gt;
                  Prev
                &lt;/button&gt;
                &lt;button
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
                  disabled={!channels.has_more}
                  onClick={() =&gt; setPage((p) =&gt; p + 1)}
                &gt;
                  Next
                &lt;/button&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/&gt;
        ) : (
          &lt;div className="text-center py-16"&gt;
            &lt;div className="mx-auto h-16 w-16 rounded-2xl bg-gray-100 border flex items-center justify-center"&gt;📭&lt;/div&gt;
            &lt;p className="mt-4 text-gray-700"&gt;No channels yet. Use admin panel to add some.&lt;/p&gt;
          &lt;/div&gt;
        )}
      &lt;/main&gt;
    &lt;/div&gt;
  );
}

export default App;