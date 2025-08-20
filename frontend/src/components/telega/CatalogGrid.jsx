import React from "react";
import CatalogCard from "./CatalogCard";

export default function CatalogGrid({ items, onOpen }){
  return (
    <div className="flex flex-col gap-4">{/* список в один столбец */}
      {items.map((it)=> (
        <CatalogCard key={it.id} item={it} onOpen={onOpen} />
      ))}
    </div>
  );
}