import React from "react";
import { ruShort, daysAgo, computeReach, computeCpv } from "./helpers";

const Icon = ({ name }) => {
  const cls = "tg-icon";
  switch (name) {
    case 'users': return (<svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
    case 'views': return (<svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
    case 'er': return (<svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);
    case 'price': return (<svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/></svg>);
    case 'cpm': return (<svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>);
    case 'cpv': return (<svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>);
    case 'time': return (<svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>);
    default: return null;
  }
};

export default function CatalogCard({ item }){
  const initials = (item?.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const reach = item.reach_avg ?? computeReach(item.price_rub, item.cpm_rub);
  const cpv = item.cpv_rub ?? computeCpv(item.cpm_rub);
  const [imgOk, setImgOk] = React.useState(true);

  return (
    <div className="tg-card overflow-hidden">
      <div className="tg-card-pad">
        <div className="flex gap-4">
          {/* Left block: avatar, title, tags, description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {item.avatar_url && imgOk ? (
                <img src={item.avatar_url} alt={item.name} className="h-12 w-12 rounded-full object-cover border border-gray-200" onError={()=>setImgOk(false)} />
              ) : (
                <div className="h-12 w-12 rounded-full items-center justify-center font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 flex">{initials}</div>
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
          </div>

          {/* Right block: metrics (compact) + price panel below on md */}
          <div className="flex flex-col gap-2 items-stretch">
            <div className="tg-metrics-right">
              <div className="tg-metric-kv"><Icon name="users" /><span className="tg-metric-subtle">Подписчики</span></div>
              <div className="tg-metric-val">{ruShort(item.subscribers)}</div>
              <div className="tg-metric-kv"><Icon name="views" /><span className="tg-metric-subtle">Просмотры</span></div>
              <div className="tg-metric-val">{reach ? ruShort(reach) : '-'}</div>
              <div className="tg-metric-kv"><Icon name="er" /><span className="tg-metric-subtle">ER</span></div>
              <div className="tg-metric-val">{item.er}%</div>
              <div className="tg-metric-kv"><Icon name="cpm" /><span className="tg-metric-subtle">CPM</span></div>
              <div className="tg-metric-val">₽ {item.cpm_rub}</div>
              <div className="tg-metric-kv"><Icon name="cpv" /><span className="tg-metric-subtle">CPV</span></div>
              <div className="tg-metric-val">₽ {cpv ?? '-'}</div>
              <div className="tg-metric-kv"><Icon name="time" /><span className="tg-metric-subtle">Пост</span></div>
              <div className="tg-metric-val">{daysAgo(item.last_post_at)} дн.</div>
            </div>
            <div className="tg-price-wrap">
              <div className="tg-price-panel">
                <div className="tg-price-top">
                  <div className="grid grid-cols-2 gap-2">
                    <select className="tg-format-select">
                      <option>1/24</option>
                      <option>2/24</option>
                    </select>
                    <select className="tg-qty-select">
                      <option>1</option>
                      <option>2</option>
                    </select>
                  </div>
                </div>
                <div className="tg-price-bottom">
                  <div className="tg-price">{Intl.NumberFormat('ru-RU').format(item.price_rub)} ₽</div>
                  <div className="text-sm opacity-90">🛒</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}