import React, { useMemo, useState } from "react";
import FilterSidebar from "../components/telega/FilterSidebar";
import CatalogGrid from "../components/telega/CatalogGrid";
import Pagination from "../components/telega/Pagination";
import { telegaDemo } from "../data/telegaDemo";

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
  const reachOf = (x) => Math.round((x.price_rub/(x.cpm_rub||1))*1000);
  const cpvOf = (x) => (x.cpm_rub||0)/1000;
  if (minReach) arr = arr.filter(x => reachOf(x) >= Number(minReach));
  if (maxReach) arr = arr.filter(x => reachOf(x) <= Number(maxReach));
  if (minCpv) arr = arr.filter(x => cpvOf(x) >= Number(minCpv));
  if (maxCpv) arr = arr.filter(x => cpvOf(x) <= Number(maxCpv));
  if (flags.featured) arr = arr.filter(x => x.is_featured);
  switch (sort) { case 'name': arr.sort((a,b)=> a.name.localeCompare(b.name)); break; case 'price': arr.sort((a,b)=> (b.price_rub||0)-(a.price_rub||0)); break; case 'er': arr.sort((a,b)=> (b.er||0)-(a.er||0)); break; default: arr.sort((a,b)=> (b.subscribers||0)-(a.subscribers||0)); }
  return arr;
}

export default function TelegaClone(){
  const [q, setQ] = useState("");
  const [ranges, setRanges] = useState({});
  const [flags, setFlags] = useState({ featured: false, alive: false });
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [selects, setSelects] = useState({ social: 'Telegram', category: '', genderBlogger: '', genderAudience: '', country: '', city: '' });
  const limit = 24;

  const source = React.useMemo(()=> expandTo48(telegaDemo), []);
  const filtered = useMemo(()=> applyFilters(source, { q, ranges, flags, sort, selects }), [q, selects, ranges, flags, sort, source]);
  const start = (page-1)*limit;
  const items = filtered.slice(start, start+limit);
  React.useEffect(()=> setPage(1), [q, selects, ranges, flags, sort]);

  return (
    <div className="min-h-screen">
      <div className="tg-hero">
        <div className="tg-hero-inner">
          <div className="text-white/90 text-xs uppercase tracking-wide">TeleIndex</div>
          <h2 className="tg-hero-title">Каталог Telegram‑каналов</h2>
          <p className="tg-hero-sub">Подборка проверенных блогеров. Метрики, цены и охваты — в одном месте.</p>
        </div>
      </div>

      <div className="tg-header">
        <div className="flex items-center gap-2 mr-auto">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" />
          <h1 className="font-semibold text-lg">TeleIndex</h1>
        </div>
        <div className="text-sm text-gray-600">Каталог</div>
      </div>

      <div className="tg-container mt-4 grid grid-cols-1 lg:grid-cols-[360px_920px] gap-8">
        <FilterSidebar q={q} setQ={setQ} categories={[...new Set(source.map(x=>x.category))]} ranges={ranges} setRanges={setRanges} flags={flags} setFlags={setFlags} selects={selects} setSelects={setSelects} />
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {[{k:'popular',label:'Популярные'},{k:'new',label:'Новые'},{k:'name',label:'По имени'},{k:'price',label:'Цена'},{k:'er',label:'ER'}].map(t=> (
              <button key={t.k} onClick={()=>setSort(t.k)} className={`tg-chip ${sort===t.k?'tg-chip-active':''}`}>{t.label}</button>
            ))}
          </div>
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
        </div>
      </div>
    </div>
  );
}