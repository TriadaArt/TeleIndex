import React from "react";

export default function HeroAnimated(){
  return (
    <div className="tg-hero">
      <svg className="tg-hero-poly" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* polygonal abstraction */}
        <defs>
          <linearGradient id="pgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon points="0,0 30,0 20,20 0,30" fill="url(#pgrad)" />
        <polygon points="30,0 60,0 55,18 40,25" fill="url(#pgrad)" />
        <polygon points="60,0 100,0 100,20 80,25" fill="url(#pgrad)" />
        <polygon points="0,30 25,25 20,45 0,50" fill="url(#pgrad)" />
        <polygon points="25,25 55,18 48,40 20,45" fill="url(#pgrad)" />
        <polygon points="55,18 80,25 70,45 48,40" fill="url(#pgrad)" />
        <polygon points="80,25 100,20 100,45 70,45" fill="url(#pgrad)" />
        {/* animated diamonds */}
        <rect className="poly-diamond" x="12" y="18" width="2.5" height="2.5" transform="rotate(45 13.25 19.25)" />
        <rect className="poly-diamond s" x="35" y="28" width="2" height="2" transform="rotate(45 36 29)" />
        <rect className="poly-diamond l" x="58" y="22" width="3" height="3" transform="rotate(45 59.5 23.5)" />
        <rect className="poly-diamond" x="72" y="34" width="2.5" height="2.5" transform="rotate(45 73.25 35.25)" />
        <rect className="poly-diamond s" x="18" y="40" width="2" height="2" transform="rotate(45 19 41)" />
        <rect className="poly-diamond" x="86" y="16" width="2.5" height="2.5" transform="rotate(45 87.25 17.25)" />
      </svg>
      <div className="tg-hero-inner">
        <div className="text-white/90 text-xs uppercase tracking-wide">TeleIndex</div>
        <h2 className="tg-hero-title">Каталог Telegram‑каналов</h2>
        <p className="tg-hero-sub">Подборка проверенных блогеров. Метрики, цены и охваты — в одном месте.</p>
      </div>
    </div>
  );
}