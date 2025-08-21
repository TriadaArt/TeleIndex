import React from "react";
import { useNavigate } from "react-router-dom";

export default function CatalogCard({ item }) {
  const navigate = useNavigate();
  return (
    <div className="tg-card" role="group">
      <div className="tg-card-pad tg-card-grid">
        <div>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold flex items-center justify-center">
              {item.avatar_url ? (
                <img src={item.avatar_url} alt={item.name} className="w-full h-full rounded-xl object-cover"/>
              ) : (
                (item.name || 'CH').slice(0,2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button className="tg-title truncate text-left hover:underline" onClick={(e)=>{e.stopPropagation(); navigate(`/tchannel/${item.username || (item.link||'').replace('https://t.me/','')}`)}}>{item.name}</button>
                {item.is_featured && <span className="tg-badge">Featured</span>}
                {item.category && <span className="tg-badge">{item.category}</span>}
              </div>
              {item.short_description && (
                <button className="tg-desc line-clamp-2 text-left hover:underline" onClick={(e)=>{e.stopPropagation(); navigate(`/tchannel/${item.username || (item.link||'').replace('https://t.me/','')}`)}}>
                  {item.short_description}
                </button>
              )}
              <div className="tg-metrics-row">
                <span>👥 {item.subscribers?.toLocaleString?.() || item.subscribers}</span>
                <span className="tg-sep">•</span>
                <span>ER {item.er ? `${item.er}%` : '—'}</span>
                <span className="tg-sep">•</span>
                <span>CPM ₽ {item.cpm_rub || '—'}</span>
                <span className="tg-sep">•</span>
                <span>Рост 30д {item.growth_30d ? `${item.growth_30d}%` : '—'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="tg-price-panel">
          <div className="tg-price-top">
            <div className="text-[12.5px] text-gray-500">1/24</div>
          </div>
          <div className="tg-price-bottom">
            <div className="tg-price">{item.price_rub ? `₽ ${item.price_rub.toLocaleString?.() || item.price_rub}` : '—'}</div>
            <button className="tg-btn-primary" onClick={(e) => { e.stopPropagation(); navigate(`/channel/${item.id}`); }}>Открыть</button>
          </div>
        </div>
      </div>
    </div>
  );
}