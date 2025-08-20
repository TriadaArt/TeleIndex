import React, { useMemo, useState } from "react";
import FilterSidebar from "../components/telega/FilterSidebar";
import CatalogGrid from "../components/telega/CatalogGrid";
import Pagination from "../components/telega/Pagination";
import { telegaDemo } from "../data/telegaDemo";

// expand demo to 48 items temporarily to showcase pagination
const expandTo48 = (arr) => {
  const out = [];
  let i = 0;
  while (out.length < 48) {
    const base = arr[i % arr.length];
    out.push({ ...base, id: `${base.id}-${out.length+1}` });
    i++;
  }
  return out;
};

function applyFilters(list, { q, category, ranges, flags, sort }){
  let arr = [...list];
  if (q) {
    const s = q.trim().toLowerCase();
    arr = arr.filter(x => (x.name||'').toLowerCase().includes(s) || (x.short_description||'').toLowerCase().includes(s));
  }
  if (category) arr = arr.filter(x => x.category === category);
  const { minSubs, maxSubs, minPrice, maxPrice, minEr, maxEr } = ranges;
  if (minSubs) arr = arr.filter(x => x.subscribers >= Number(minSubs));
  if (maxSubs) arr = arr.filter(x => x.subscribers <= Number(maxSubs));
  if (minPrice) arr = arr.filter(x => x.price_rub >= Number(minPrice));
  if (maxPrice) arr = arr.filter(x => x.price_rub <= Number(maxPrice));
  if (minEr) arr = arr.filter(x => x.er >= Number(minEr));
  if (maxEr) arr = arr.filter(x => x.er <= Number(maxEr));
  if (flags.featured) arr = arr.filter(x => x.is_featured);
  // alive флаг пропускаем, тк демо ссылки все валидны

  switch (sort) {
    case 'name': arr.sort((a,b)=> a.name.localeCompare(b.name)); break;
    case 'price': arr.sort((a,b)=> (b.price_rub||0) - (a.price_rub||0)); break;
    case 'er': arr.sort((a,b)=> (b.er||0) - (a.er||0)); break;
    case 'new': default: arr.sort((a,b)=> (b.subscribers||0) - (a.subscribers||0));
  }
  return arr;
}

export default function TelegaClone(){
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [ranges, setRanges] = useState({});
  const [flags, setFlags] = useState({ featured: false, alive: false });
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const limit = 24;

  const categories = useMemo(()=> Array.from(new Set(telegaDemo.map(x=>x.category))), []);
  const filtered = useMemo(()=> applyFilters(telegaDemo, { q, category, ranges, flags, sort }), [q, category, ranges, flags, sort]);
  const start = (page-1)*limit;
  const items = filtered.slice(start, start+limit);

  // Reset page on filters change
  React.useEffect(()=> setPage(1), [q, category, ranges, flags, sort]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 border-b bg-white">
        <div className="flex items-center gap-2 mr-auto">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" />
          <h1 className="font-semibold text-lg">TeleIndex</h1>
        </div>
        <div className="text-sm text-gray-600">Каталог</div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <FilterSidebar q={q} setQ={setQ} categories={categories} activeCategory={category} setActiveCategory={setCategory} ranges={ranges} setRanges={setRanges} flags={flags} setFlags={setFlags} />
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {[{k:'popular',label:'Популярные'},{k:'new',label:'Новые'},{k:'name',label:'По имени'},{k:'price',label:'Цена'},{k:'er',label:'ER'}].map(t=> (
              <button key={t.k} onClick={()=>setSort(t.k)} className={`px-3 py-1.5 rounded-full border text-sm ${sort===t.k?'bg-indigo-600 text-white border-indigo-600':'bg-white hover:bg-gray-50'}`}>{t.label}</button>
            ))}
          </div>
          <CatalogGrid items={items} onOpen={(it)=> window.open(`/c/${it.id}`, '_self')} />
          <Pagination page={page} total={filtered.length} limit={limit} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}