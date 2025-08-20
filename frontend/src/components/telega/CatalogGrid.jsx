import React from "react";
import CatalogCard from "./CatalogCard";

export default function CatalogGrid({ items, onOpen }){
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((it)=> (
        <CatalogCard key={it.id} item={it} onOpen={onOpen} />
      ))}
    </div>
  );
}