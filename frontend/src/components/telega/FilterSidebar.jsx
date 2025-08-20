import React from "react";

export default function FilterSidebar({ q, setQ, categories, activeCategory, setActiveCategory, ranges, setRanges, flags, setFlags }){
  const onRange = (k, v) => setRanges({ ...ranges, [k]: v });
  const onFlag = (k) => setFlags({ ...flags, [k]: !flags[k] });
  return (
    <aside className="space-y-3 min-w-[280px]">
      <div className="lg:sticky lg:top-24">
        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-3">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск каналов..." className="w-full h-11 rounded-xl border px-4" />
          <div>
            <div className="text-sm font-medium mb-2">Категории</div>
            <div className="flex flex-wrap gap-2">
              <button className={`px-3 py-1.5 rounded-full border text-sm ${!activeCategory ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-50'}`} onClick={()=>setActiveCategory("")}>Все</button>
              {(categories||[]).map(c => (
                <button key={c} className={`px-3 py-1.5 rounded-full border text-sm ${activeCategory===c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-50'}`} onClick={()=>setActiveCategory(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Подписчики</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="numeric" value={ranges.minSubs||''} onChange={(e)=>onRange('minSubs', e.target.value)} placeholder="от" className="h-10 rounded-xl border px-3" />
              <input inputMode="numeric" value={ranges.maxSubs||''} onChange={(e)=>onRange('maxSubs', e.target.value)} placeholder="до" className="h-10 rounded-xl border px-3" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Цена ₽</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="numeric" value={ranges.minPrice||''} onChange={(e)=>onRange('minPrice', e.target.value)} placeholder="от" className="h-10 rounded-xl border px-3" />
              <input inputMode="numeric" value={ranges.maxPrice||''} onChange={(e)=>onRange('maxPrice', e.target.value)} placeholder="до" className="h-10 rounded-xl border px-3" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">ER %</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="decimal" value={ranges.minEr||''} onChange={(e)=>onRange('minEr', e.target.value)} placeholder="от" className="h-10 rounded-xl border px-3" />
              <input inputMode="decimal" value={ranges.maxEr||''} onChange={(e)=>onRange('maxEr', e.target.value)} placeholder="до" className="h-10 rounded-xl border px-3" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!flags.featured} onChange={()=>onFlag('featured')} /> Только избранные</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!flags.alive} onChange={()=>onFlag('alive')} /> Только живые ссылки</label>
        </div>
      </div>
    </aside>
  );
}