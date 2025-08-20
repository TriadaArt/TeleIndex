import React from "react";

export default function FilterSidebar({ q, setQ, categories, ranges, setRanges, flags, setFlags, selects, setSelects }){
  const onRange = (k, v) => setRanges({ ...ranges, [k]: v });
  const onSelect = (k, v) => setSelects({ ...selects, [k]: v });

  const [openCat, setOpenCat] = React.useState(false);

  return (
    <aside className="space-y-3 min-w-[320px]">
      <div className="lg:sticky lg:top-24">
        <div className="tg-sidebar">
          <div className="text-sm font-semibold">Фильтр</div>

          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск..." className="tg-input-lg w-full" />

          {/* Категория: выпадающее меню со скроллом */}
          <div>
            <div className="tg-section">Категория</div>
            <div className="tg-dropdown">
              <button type="button" className="tg-input w-full text-left" onClick={()=>setOpenCat(!openCat)}>
                {selects.category || 'Выбрать категории'}
              </button>
              {openCat && (
                <div className="tg-dropdown-menu" onMouseLeave={()=>setOpenCat(false)}>
                  {(categories||[]).map(c => (
                    <div key={c} className={`tg-dropdown-item ${selects.category===c?'tg-dropdown-item-active':''}`} onClick={()=>{ onSelect('category', c); setOpenCat(false); }}>{c}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Соцсеть */}
          <div>
            <div className="tg-section">Социальная сеть</div>
            <select className="tg-select w-full" value={selects.social||'Telegram'} onChange={(e)=>onSelect('social', e.target.value)}>
              <option>Telegram</option>
              <option>Instagram</option>
              <option>YouTube</option>
              <option>VK</option>
            </select>
          </div>

          {/* Пол блогера: округлые кнопки */}
          <div>
            <div className="tg-section">Пол блогера</div>
            <div className="tg-pills">
              {['Мужской','Женский'].map(g => (
                <button key={g} className={`tg-pill ${selects.genderBlogger===g?'tg-pill-active':''}`} onClick={()=>onSelect('genderBlogger', selects.genderBlogger===g? '': g)}>{g}</button>
              ))}
            </div>
          </div>

          {/* Пол аудитории: округлые кнопки */}
          <div>
            <div className="tg-section">Пол аудитории</div>
            <div className="tg-pills">
              {['Мужской','Женский'].map(g => (
                <button key={g} className={`tg-pill ${selects.genderAudience===g?'tg-pill-active':''}`} onClick={()=>onSelect('genderAudience', selects.genderAudience===g? '': g)}>{g}</button>
              ))}
            </div>
          </div>

          {/* Диапазоны */}
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

          <div>
            <div className="tg-section">Страна блогера</div>
            <select className="tg-select w-full" value={selects.country||''} onChange={(e)=>onSelect('country', e.target.value)}>
              <option value="">Выберите страну</option>
              <option>Россия</option>
              <option>Украина</option>
              <option>Беларусь</option>
              <option>Казахстан</option>
            </select>
          </div>

          <div>
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

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="tg-checkbox" checked={!!flags.featured} onChange={()=>setFlags({...flags, featured: !flags.featured})} /> Только избранные</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="tg-checkbox" checked={!!flags.alive} onChange={()=>setFlags({...flags, alive: !flags.alive})} /> Только живые ссылки</label>
        </div>
      </div>
    </aside>
  );
}