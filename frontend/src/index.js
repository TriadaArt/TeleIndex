import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

// Simple test component to verify changes are applied
const TestApp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-6xl font-bold mb-4">🎉 TeleIndex Works!</h1>
        <p className="text-xl">Changes are being applied successfully</p>
        <div className="mt-8">
          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg mr-4">
            Войти
          </button>
          <button className="bg-white text-purple-600 px-6 py-3 rounded-lg">
            Регистрация
          </button>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <TestApp />
    </BrowserRouter>
  </React.StrictMode>,
);
