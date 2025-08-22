import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import TelegaClone from "./pages/TelegaClone";
import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Users from "./admin/pages/Users";
import Channels from "./admin/pages/Channels";
import ChannelCardPage from "./pages/ChannelCardPage";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TelegaClone />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/tchannel/:username" element={<ChannelCardPage />} />
        <Route path="*" element={<TelegaClone />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
