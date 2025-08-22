import React from "react";
import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  const items = [
    { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/admin/users", label: "Пользователи", icon: "👥" },
    { to: "/admin/owners", label: "Владельцы", icon: "👤" },
    { to: "/admin/advertisers", label: "Рекламодатели", icon: "💼" },
    { to: "/admin/channels", label: "Каналы", icon: "📚" },
    { to: "/admin/moderation", label: "Модерация", icon: "🛡️" },
    { to: "/admin/config", label: "Настройки", icon: "⚙️" },
    { to: "/admin/tools", label: "Инструменты", icon: "🧰" },
  ];
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r shadow-sm p-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">A</div>
        <div className="font-semibold">Admin</div>
      </div>
      <nav className="space-y-1">
        {items.map(it => (
          <NavLink key={it.to} to={it.to} className={({isActive}) => `flex items-center gap-2 px-3 py-2 rounded-lg ${isActive? 'bg-indigo-50 text-indigo-700':'text-gray-700 hover:bg-gray-50'}`}>
            <span>{it.icon}</span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}