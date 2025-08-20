import React from "react";

export default function HeroAnimated(){
  return (
    <div className="tg-hero">
      <svg className="tg-hero-poly" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        {/* polygonal tiles */}
        <polygon points="0,0 25,0 18,18 0,24" fill="url(#pgrad)" />
        <polygon points="25,0 55,0 50,16 32,22" fill="url(#pgrad)" />
        <polygon points="55,0 100,0 100,18 78,22" fill="url(#pgrad)" />
        <polygon points="0,24 20,20 16,40 0,44" fill="url(#pgrad)" />
        <polygon points="20,20 50,16 44,36 18,40" fill="url(#pgrad)" />
        <polygon points="50,16 78,22 68,40 44,36" fill="url(#pgrad)" />
        <polygon points="78,22 100,18 100,40 68,40" fill="url(#pgrad)" />
        {/* tiny animated diamonds */}
        <rect className="poly-diamond" x="12" y="18" width="1.6" height="1.6" transform="rotate(45 12.8 18.8)" />
        <rect className="poly-diamond s" x="34" y="28" width="1.2" height="1.2" transform="rotate(45 34.6 28.6)" />
        <rect className="poly-diamond l" x="56" y="22" width="2" height="2" transform="rotate(45 57 23)" />
        <rect className="poly-diamond" x="72" y="34" width="1.6" height="1.6" transform="rotate(45 72.8 34.8)" />
        <rect className="poly-diamond s" x="18" y="40" width="1.2" height="1.2" transform="rotate(45 18.6 40.6)" />
        <rect className="poly-diamond" x="86" y="16" width="1.6" height="1.6" transform="rotate(45 86.8 16.8)" />
      </svg>
      <div className="tg-hero-inner">
        <div className="text-white/90 text-xs uppercase tracking-wide">TeleIndex</div>
        <h2 className="tg-hero-title">Каталог Telegram‑каналов</h2>
        <p className="tg-hero-sub">Подборка проверенных блогеров. Метрики, цены и охваты — в одном месте.</p>
      </div>
    </div>
  );
}