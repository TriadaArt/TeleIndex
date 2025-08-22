import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import TelegaClone from "./pages/TelegaClone";
import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Users from "./admin/pages/Users";
import Owners from "./admin/pages/Owners";
import Advertisers from "./admin/pages/Advertisers";
import Channels from "./admin/pages/Channels";
import Moderation from "./admin/pages/Moderation";
import Config from "./admin/pages/Config";
import Tools from "./admin/pages/Tools";
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
          <Route path="owners" element={<Owners />} />
          <Route path="advertisers" element={<Advertisers />} />
          <Route path="channels" element={<Channels />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="config" element={<Config />} />
          <Route path="tools" element={<Tools />} />
        </Route>
        <Route path="/tchannel/:username" element={<ChannelCardPage />} />
        <Route path="*" element={<TelegaClone />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
