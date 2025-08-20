import React from "react";
import { ruShort, daysAgo, computeReach, computeCpv } from "./helpers";

export default function CatalogCard({ item, onOpen }){
  const initials = (item?.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const reach = item.reach_avg ?? computeReach(item.price_rub, item.cpm_rub);
  const cpv = item.cpv_rub ?? computeCpv(item.cpm_rub);
  return (
    <div className="tg-card overflow-hidden">
      <div className="tg-card-pad">
        <div className="flex items-center gap-3">
          {item.avatar_url ? (
            <img src={item.avatar_url} alt={item.name} className="h-14 w-14 rounded-xl object-cover border" />
          ) : (
            <div className="h-14 w-14 rounded-xl items-center justify-center font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 flex">{initials}</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="tg-title truncate" title={item.name}>{item.name}</h3>
              {item.is_featured && <span className="tg-badge tg-badge-warn">Избранный</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 flex-wrap">
              {item.category && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.category}</span>}
              {item.language && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.language}</span>}
              {item.country && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.country}{item.city?` • ${item.city}`:""}</span>}
            </div>
          </div>
        </div>
        <p className="tg-desc line-clamp-2">{item.short_description}</p>
        <div className="tg-metrics">
          <span>👥 {ruShort(item.subscribers)}</span>
          <span className="tg-dot" />
          <span>📈 ER {item.er}%</span>
          <span className="tg-dot" />
          <span>💰 ₽ {Intl.NumberFormat('ru-RU').format(item.price_rub)}</span>
          <span className="tg-dot" />
          <span>📊 CPM ₽ {item.cpm_rub}</span>
          <span className="tg-dot" />
          <span>👀 Охваты {reach? ruShort(reach): '-'}</span>
          <span className="tg-dot" />
          <span>🎯 CPV ₽ {cpv ?? '-'}</span>
          <span className="tg-dot" />
          <span>🕒 Последний пост {daysAgo(item.last_post_at)} дн.</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => onOpen(item)} className="tg-btn-primary">Открыть</button>
          <a href={item.link} target="_blank" rel="noreferrer" className="tg-btn">Перейти</a>
        </div>
      </div>
    </div>
  );
}