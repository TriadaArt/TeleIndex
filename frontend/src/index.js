import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import TelegaClone from "./pages/TelegaClone";
import Admin from "./components/Admin";
import ChannelCardPage from "./pages/ChannelCardPage";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TelegaClone />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/channel/:id" element={<ChannelDetail />} />
        <Route path="*" element={<TelegaClone />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
