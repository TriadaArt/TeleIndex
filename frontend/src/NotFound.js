import React from "react";
export default function NotFound(){
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Страница не найдена</h1>
        <p className="text-gray-600 mt-2">Вернитесь на главную страницу каталога.</p>
        <a href="/" className="inline-block mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white">На главную</a>
      </div>
    </div>
  );
}
