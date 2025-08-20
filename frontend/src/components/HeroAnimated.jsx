import React from "react";

export default function HeroAnimated(){
  return (
    <div className="tg-hero">
      <div className="tg-hero-inner">
        <div className="text-white/90 text-xs uppercase tracking-wide">TeleIndex</div>
        <h2 className="tg-hero-title">Каталог Telegram‑каналов</h2>
        <p className="tg-hero-sub">Подборка проверенных блогеров. Метрики, цены и охваты — в одном месте.</p>
      </div>
      <div className="tg-hero-dots">
        <span className="tg-dot" style={{left:'10%', top:'20%'}} />
        <span className="tg-dot s" style={{left:'25%', top:'60%'}} />
        <span className="tg-dot l" style={{left:'40%', top:'35%'}} />
        <span className="tg-dot" style={{left:'55%', top:'15%'}} />
        <span className="tg-dot s" style={{left:'70%', top:'50%'}} />
        <span className="tg-dot l" style={{left:'85%', top:'30%'}} />
        <svg className="tg-diamond" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="dg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <polygon points="50,5 95,50 50,95 5,50" fill="none" stroke="url(#dg)" strokeWidth="2" />
          <polyline points="50,5 50,95" stroke="url(#dg)" strokeWidth="1" opacity="0.6" />
          <polyline points="5,50 95,50" stroke="url(#dg)" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
}