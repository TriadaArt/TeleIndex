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
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="owners" element={<(await import('./admin/pages/Owners')).default />} />
          <Route path="advertisers" element={<(await import('./admin/pages/Advertisers')).default />} />
          <Route path="channels" element={<Channels />} />
          <Route path="moderation" element={<(await import('./admin/pages/Moderation')).default />} />
          <Route path="config" element={<(await import('./admin/pages/Config')).default />} />
          <Route path="tools" element={<(await import('./admin/pages/Tools')).default />} />
        </Route>
        <Route path="/tchannel/:username" element={<ChannelCardPage />} />
        <Route path="*" element={<TelegaClone />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
