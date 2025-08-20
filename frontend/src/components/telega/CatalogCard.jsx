import React from "react";
import { ruShort, daysAgo, computeReach, computeCpv } from "./helpers";

const Icon = ({ name }) => {
  const cls = "tg-icon";
  switch (name) {
    case 'users':
      return (<svg className={cls} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
    case 'er':
      return (<svg className={cls} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);
    case 'price':
      return (<svg className={cls} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/></svg>);
    case 'cpm':
      return (<svg className={cls} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>);
    case 'reach':
      return (<svg className={cls} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M19 13l-5-5-4 4-3-3"/></svg>);
    case 'cpv':
      return (<svg className={cls} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>);
    case 'time':
      return (<svg className={cls} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>);
    default: return null;
  }
};

export default function CatalogCard({ item, onOpen }){
  const initials = (item?.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const reach = item.reach_avg ?? computeReach(item.price_rub, item.cpm_rub);
  const cpv = item.cpv_rub ?? computeCpv(item.cpm_rub);
  const [imgOk, setImgOk] = React.useState(true);

  return (
    <div className="tg-card overflow-hidden">
      <div className="tg-card-pad">
        <div className="flex items-center gap-3">
          {item.avatar_url && imgOk ? (
            <img src={item.avatar_url} alt={item.name} className="h-14 w-14 rounded-full object-cover border border-gray-200" onError={()=>setImgOk(false)} />
          ) : (
            <div className="h-14 w-14 rounded-full items-center justify-center font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 flex">{initials}</div>
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
          <span><Icon name="users" />{ruShort(item.subscribers)}</span>
          <span className="tg-dot" />
          <span><Icon name="er" />ER {item.er}%</span>
          <span className="tg-dot" />
          <span><Icon name="price" />₽ {Intl.NumberFormat('ru-RU').format(item.price_rub)}</span>
          <span className="tg-dot" />
          <span><Icon name="cpm" />CPM ₽ {item.cpm_rub}</span>
          <span className="tg-dot" />
          <span><Icon name="reach" />Охв. {reach? ruShort(reach): '-'}</span>
          <span className="tg-dot" />
          <span><Icon name="cpv" />CPV ₽ {cpv ?? '-'}</span>
          <span className="tg-dot" />
          <span><Icon name="time" />{daysAgo(item.last_post_at)} дн.</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => onOpen(item)} className="tg-btn-primary">Открыть</button>
          <a href={item.link} target="_blank" rel="noreferrer" className="tg-btn">Перейти</a>
        </div>
      </div>
    </div>
  );
}