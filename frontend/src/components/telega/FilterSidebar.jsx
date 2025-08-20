import React from "react";

export default function FilterSidebar({ q, setQ, categories, activeCategory, setActiveCategory, ranges, setRanges, flags, setFlags, selects, setSelects }){
  const onRange = (k, v) => setRanges({ ...ranges, [k]: v });
  const onFlag = (k) => setFlags({ ...flags, [k]: !flags[k] });
  const onSelect = (k, v) => setSelects({ ...selects, [k]: v });

  const [showCats, setShowCats] = React.useState(false);
  const toggleCat = (c) => {
    const arr = new Set(selects.categories || []);
    if (arr.has(c)) arr.delete(c); else arr.add(c);
    setSelects({ ...selects, categories: Array.from(arr) });
  };

  return (
    <aside className="space-y-3 min-w-[320px]">
      <div className="lg:sticky lg:top-24">
        <div className="tg-sidebar">
          <div className="text-sm font-semibold">Фильтр</div>

          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск каналов..." className="tg-input-lg w-full" />

          <div className="space-y-2">
            <div className="tg-section">Категория</div>
            <button type="button" className="tg-input w-full text-left" onClick={()=>setShowCats(!showCats)}>
              { (selects.categories && selects.categories.length>0) ? selects.categories.join(', ') : 'Выбрать категории' }
            </button>
            {showCats && (
              <div className="border rounded-xl p-2 space-y-1 max-h-48 overflow-auto">
                {(categories||[]).map(c => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="tg-checkbox" checked={(selects.categories||[]).includes(c)} onChange={()=>toggleCat(c)} /> {c}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="tg-section">Социальная сеть</div>
            <select className="tg-select w-full" value={selects.social||'Telegram'} onChange={(e)=>onSelect('social', e.target.value)}>
              <option>Telegram</option>
              <option>Instagram</option>
              <option>YouTube</option>
              <option>VK</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="tg-section">Пол блогера</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="tg-checkbox" checked={!!selects.genderBloggerM} onChange={()=>onSelect('genderBloggerM', !selects.genderBloggerM)} /> Мужской</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="tg-checkbox" checked={!!selects.genderBloggerF} onChange={()=>onSelect('genderBloggerF', !selects.genderBloggerF)} /> Женский</label>
          </div>

          <div className="space-y-1">
            <div className="tg-section">Пол аудитории</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="tg-checkbox" checked={!!selects.genderAudienceM} onChange={()=>onSelect('genderAudienceM', !selects.genderAudienceM)} /> Мужской</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="tg-checkbox" checked={!!selects.genderAudienceF} onChange={()=>onSelect('genderAudienceF', !selects.genderAudienceF)} /> Женский</label>
          </div>

          <div>
            <div className="tg-section">Количество подписчиков</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="numeric" value={ranges.minSubs||''} onChange={(e)=>onRange('minSubs', e.target.value)} placeholder="от" className="tg-input" />
              <input inputMode="numeric" value={ranges.maxSubs||''} onChange={(e)=>onRange('maxSubs', e.target.value)} placeholder="до" className="tg-input" />
            </div>
          </div>

          <div>
            <div className="tg-section">Охваты</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="numeric" value={ranges.minReach||''} onChange={(e)=>onRange('minReach', e.target.value)} placeholder="от" className="tg-input" />
              <input inputMode="numeric" value={ranges.maxReach||''} onChange={(e)=>onRange('maxReach', e.target.value)} placeholder="до" className="tg-input" />
            </div>
          </div>

          <div>
            <div className="tg-section">Цена за размещение</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="numeric" value={ranges.minPrice||''} onChange={(e)=>onRange('minPrice', e.target.value)} placeholder="от" className="tg-input" />
              <input inputMode="numeric" value={ranges.maxPrice||''} onChange={(e)=>onRange('maxPrice', e.target.value)} placeholder="до" className="tg-input" />
            </div>
          </div>

          <div>
            <div className="tg-section">CPV</div>
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="decimal" value={ranges.minCpv||''} onChange={(e)=>onRange('minCpv', e.target.value)} placeholder="от" className="tg-input" />
              <input inputMode="decimal" value={ranges.maxCpv||''} onChange={(e)=>onRange('maxCpv', e.target.value)} placeholder="до" className="tg-input" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="tg-section">Страна блогера</div>
            <select className="tg-select w-full" value={selects.country||''} onChange={(e)=>onSelect('country', e.target.value)}>
              <option value="">Выберите страну</option>
              <option>Россия</option>
              <option>Украина</option>
              <option>Беларусь</option>
              <option>Казахстан</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="tg-section">Город блогера</div>
            <select className="tg-select w-full" value={selects.city||''} onChange={(e)=>onSelect('city', e.target.value)}>
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

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="tg-checkbox" checked={!!flags.featured} onChange={()=>onFlag('featured')} /> Только избранные</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="tg-checkbox" checked={!!flags.alive} onChange={()=>onFlag('alive')} /> Только живые ссылки</label>
        </div>
      </div>
    </aside>
  );
}