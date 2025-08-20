import React from "react";

export default function FilterSidebar({ q, setQ, categories, activeCategory, setActiveCategory, ranges, setRanges, flags, setFlags, selects, setSelects }){
  const onRange = (k, v) => setRanges({ ...ranges, [k]: v });
  const onFlag = (k) => setFlags({ ...flags, [k]: !flags[k] });
  const onSelect = (k, v) => setSelects({ ...selects, [k]: v });

  // Multiselect categories dropdown imitation
  const [showCats, setShowCats] = React.useState(false);
  const toggleCat = (c) => {
    const arr = new Set(selects.categories || []);
    if (arr.has(c)) arr.delete(c); else arr.add(c);
    setSelects({ ...selects, categories: Array.from(arr) });
  };

  return (
    <aside className="space-y-3 min-w-[280px]">
      <div className="lg:sticky lg:top-24">
        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-3">
          <div className="text-sm font-semibold">Фильтр</div>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск каналов..." className="w-full h-11 rounded-xl border px-4" />

          <div className="space-y-2">
            <div className="text-sm font-medium">Категория</div>
            <button type="button" className="h-10 w-full rounded-xl border px-3 text-left" onClick={()=>setShowCats(!showCats)}>
              { (selects.categories && selects.categories.length>0) ? selects.categories.join(', ') : 'Выбрать категории' }
            </button>
            {showCats && (
              <div className="border rounded-xl p-2 space-y-1 max-h-48 overflow-auto">
                {(categories||[]).map(c => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={(selects.categories||[]).includes(c)} onChange={()=>toggleCat(c)} /> {c}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Социальная сеть</div>
            <select className="h-10 w-full rounded-xl border px-3" value={selects.social||'Telegram'} onChange={(e)=>onSelect('social', e.target.value)}>
              <option>Telegram</option>
              <option>Instagram</option>
              <option>YouTube</option>
              <option>VK</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Пол блогера</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!selects.genderBloggerM} onChange={()=>onSelect('genderBloggerM', !selects.genderBloggerM)} /> Мужской</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!selects.genderBloggerF} onChange={()=>onSelect('genderBloggerF', !selects.genderBloggerF)} /> Женский</label>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Пол аудитории</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!selects.genderAudienceM} onChange={()=>onSelect('genderAudienceM', !selects.genderAudienceM)} /> Мужской</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!selects.genderAudienceF} onChange={()=>onSelect('genderAudienceF', !selects.genderAudienceF)} /> Женский</label>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Количество подписчиков</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="numeric" value={ranges.minSubs||''} onChange={(e)=>onRange('minSubs', e.target.value)} placeholder="от" className="h-10 rounded-xl border px-3" />
              <input inputMode="numeric" value={ranges.maxSubs||''} onChange={(e)=>onRange('maxSubs', e.target.value)} placeholder="до" className="h-10 rounded-xl border px-3" />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Охваты</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="numeric" value={ranges.minReach||''} onChange={(e)=>onRange('minReach', e.target.value)} placeholder="от" className="h-10 rounded-xl border px-3" />
              <input inputMode="numeric" value={ranges.maxReach||''} onChange={(e)=>onRange('maxReach', e.target.value)} placeholder="до" className="h-10 rounded-xl border px-3" />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Цена за размещение</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="numeric" value={ranges.minPrice||''} onChange={(e)=>onRange('minPrice', e.target.value)} placeholder="от" className="h-10 rounded-xl border px-3" />
              <input inputMode="numeric" value={ranges.maxPrice||''} onChange={(e)=>onRange('maxPrice', e.target.value)} placeholder="до" className="h-10 rounded-xl border px-3" />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">CPV</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="decimal" value={ranges.minCpv||''} onChange={(e)=>onRange('minCpv', e.target.value)} placeholder="от" className="h-10 rounded-xl border px-3" />
              <input inputMode="decimal" value={ranges.maxCpv||''} onChange={(e)=>onRange('maxCpv', e.target.value)} placeholder="до" className="h-10 rounded-xl border px-3" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Страна блогера</div>
            <select className="h-10 w-full rounded-xl border px-3" value={selects.country||''} onChange={(e)=>onSelect('country', e.target.value)}>
              <option value="">Выберите страну</option>
              <option>Россия</option>
              <option>Украина</option>
              <option>Беларусь</option>
              <option>Казахстан</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Город блогера</div>
            <select className="h-10 w-full rounded-xl border px-3" value={selects.city||''} onChange={(e)=>onSelect('city', e.target.value)}>
              <option value="">Выберите город</option>
              <option>Москва</option>
              <option>Санкт-Петербург</option>
              <option>Киев</option>
              <option>Минск</option>
              <option>Казань</option>
              <option>Новосибирск</option>
              <option>Алматы</option>
              <option>Сочи</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!flags.featured} onChange={()=>onFlag('featured')} /> Только избранные</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!flags.alive} onChange={()=>onFlag('alive')} /> Только живые ссылки</label>
        </div>
      </div>
    </aside>
  );
}