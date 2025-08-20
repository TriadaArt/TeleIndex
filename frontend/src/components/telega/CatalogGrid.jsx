import React from "react";
import CatalogCard from "./CatalogCard";

export default function CatalogGrid({ items }){
  return (
    <div className="flex flex-col gap-3">{/* ещё компактнее расстояние между карточками */}
      {items.map((it)=> (
        <CatalogCard key={it.id} item={it} />
      ))}
    </div>
  );
}