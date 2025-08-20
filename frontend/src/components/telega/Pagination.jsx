import React from "react";

export default function Pagination({ page, total, limit, onChange }){
  const pages = Math.max(1, Math.ceil((total || 0) / (limit || 24)));
  const items = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i=start;i<=end;i++) items.push(i);
  return (
    <div className="flex items-center justify-between mt-6">
      <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50" disabled={page<=1} onClick={()=>onChange(page-1)}>Назад</button>
      <div className="flex items-center gap-2">
        {items.map((p)=> (
          <button key={p} className={`px-3 py-1.5 rounded-lg border text-sm ${p===page? 'bg-indigo-600 text-white border-indigo-600':'bg-white hover:bg-gray-50'}`} onClick={()=>onChange(p)}>{p}</button>
        ))}
      </div>
      <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50" disabled={page>=pages} onClick={()=>onChange(page+1)}>Вперёд</button>
    </div>
  );
}