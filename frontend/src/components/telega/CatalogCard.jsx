import React from "react";
import { ruShort, daysAgo } from "./helpers";

export default function CatalogCard({ item, onOpen }){
  const initials = (item?.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          {item.avatar_url ? (
            <img src={item.avatar_url} alt={item.name} className="h-14 w-14 rounded-xl object-cover border" />
          ) : (
            <div className="h-14 w-14 rounded-xl items-center justify-center font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 flex">{initials}</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate" title={item.name}>{item.name}</h3>
              {item.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded border bg-yellow-100">Избранный</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 flex-wrap">
              {item.category && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.category}</span>}
              {item.language && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.language}</span>}
              {item.country && <span className="px-2 py-0.5 rounded-full bg-gray-100 border">{item.country}{item.city?` • ${item.city}`:""}</span>}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{item.short_description}</p>
        <div className="mt-3 text-sm text-gray-700 flex items-center flex-wrap gap-x-4 gap-y-1">
          <span>👥 {ruShort(item.subscribers)}</span>
          <span>📈 ER {item.er}%</span>
          <span>💰 ₽ {Intl.NumberFormat('ru-RU').format(item.price_rub)}</span>
          <span>📊 CPM ₽ {item.cpm_rub}</span>
          <span>📉 Рост 30д {item.growth_30d}%</span>
          <span>🕒 Последний пост {daysAgo(item.last_post_at)} дн.</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => onOpen(item)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Открыть</button>
          <a href={item.link} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">Перейти</a>
        </div>
      </div>
    </div>
  );
}