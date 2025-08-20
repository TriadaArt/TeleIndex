import React from "react";

export default function HeroAnimated(){
  return (
    <div className="tg-hero">
      {/* Polygonal background + three animated diamonds + corner sparkles */}
      <svg className="tg-hero-poly" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="dg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* polygon tiles */}
        <polygon points="0,0 25,0 18,18 0,24" fill="url(#pgrad)" />
        <polygon points="25,0 55,0 50,16 32,22" fill="url(#pgrad)" />
        <polygon points="55,0 100,0 100,18 78,22" fill="url(#pgrad)" />
        <polygon points="0,24 20,20 16,40 0,44" fill="url(#pgrad)" />
        <polygon points="20,20 50,16 44,36 18,40" fill="url(#pgrad)" />
        <polygon points="50,16 78,22 68,40 44,36" fill="url(#pgrad)" />
        <polygon points="78,22 100,18 100,40 68,40" fill="url(#pgrad)" />

        {/* Three Telegram-like diamonds (smaller, elegant) */}
        <g className="tg-diamond-group swim1" transform="translate(18 26)">
          <polygon points="8,0 16,6 8,12 0,6" fill="none" stroke="url(#dg2)" strokeWidth="0.9" />
          <polyline points="8,0 8,12" stroke="url(#dg2)" strokeWidth="0.6" opacity="0.6" />
          <polyline points="0,6 16,6" stroke="url(#dg2)" strokeWidth="0.6" opacity="0.6" />
          <polyline points="5,3 11,9" stroke="url(#dg2)" strokeWidth="0.5" opacity="0.5" />
          <polyline points="11,3 5,9" stroke="url(#dg2)" strokeWidth="0.5" opacity="0.5" />
        </g>
        <g className="tg-diamond-group swim2" transform="translate(44 18)">
          <polygon points="8,0 16,6 8,12 0,6" fill="none" stroke="url(#dg2)" strokeWidth="0.9" />
          <polyline points="8,0 8,12" stroke="url(#dg2)" strokeWidth="0.6" opacity="0.6" />
          <polyline points="0,6 16,6" stroke="url(#dg2)" strokeWidth="0.6" opacity="0.6" />
          <polyline points="5,3 11,9" stroke="url(#dg2)" strokeWidth="0.5" opacity="0.5" />
          <polyline points="11,3 5,9" stroke="url(#dg2)" strokeWidth="0.5" opacity="0.5" />
        </g>
        <g className="tg-diamond-group swim3" transform="translate(72 30)">
          <polygon points="8,0 16,6 8,12 0,6" fill="none" stroke="url(#dg2)" strokeWidth="0.9" />
          <polyline points="8,0 8,12" stroke="url(#dg2)" strokeWidth="0.6" opacity="0.6" />
          <polyline points="0,6 16,6" stroke="url(#dg2)" strokeWidth="0.6" opacity="0.6" />
          <polyline points="5,3 11,9" stroke="url(#dg2)" strokeWidth="0.5" opacity="0.5" />
          <polyline points="11,3 5,9" stroke="url(#dg2)" strokeWidth="0.5" opacity="0.5" />
        </g>

        {/* Corner sparkles on polygon vertices with fading glow */}
        <circle className="corner-spark l" cx="25" cy="0" r="0.8" />
        <circle className="corner-spark" cx="55" cy="0" r="0.7" />
        <circle className="corner-spark s" cx="100" cy="0" r="0.6" />
        <circle className="corner-spark" cx="78" cy="22" r="0.7" />
        <circle className="corner-spark s" cx="100" cy="18" r="0.6" />
        <circle className="corner-spark l" cx="100" cy="40" r="0.8" />
        <circle className="corner-spark" cx="68" cy="40" r="0.7" />
        <circle className="corner-spark s" cx="50" cy="16" r="0.6" />
        <circle className="corner-spark" cx="44" cy="36" r="0.7" />
        <circle className="corner-spark s" cx="20" cy="20" r="0.6" />
        <circle className="corner-spark" cx="0" cy="24" r="0.7" />
        <circle className="corner-spark l" cx="0" cy="44" r="0.9" />
      </svg>

      {/* Right sparkles (animated bright points) */}
      <div className="tg-sparkles">
        <span className="tg-sparkle l" style={{top:'20%', left:'10%'}} />
        <span className="tg-sparkle" style={{top:'35%', left:'25%'}} />
        <span className="tg-sparkle s" style={{top:'50%', left:'15%'}} />
        <span className="tg-sparkle" style={{top:'65%', left:'5%'}} />
        <span className="tg-sparkle l" style={{top:'40%', left:'30%'}} />
        <span className="tg-sparkle s" style={{top:'55%', left:'22%'}} />
      </div>

      <div className="tg-hero-inner">
        <div className="text-white/90 text-xs uppercase tracking-wide">TeleIndex</div>
        <h2 className="tg-hero-title">Каталог Telegram‑каналов</h2>
        <p className="tg-hero-sub">Подборка проверенных блогеров. Метрики, цены и охваты — в одном месте.</p>
      </div>
    </div>
  );
}