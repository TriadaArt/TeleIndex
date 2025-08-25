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
import MeLayout from "./me/MeLayout";
import MeDashboard from "./me/pages/Dashboard";
import MyChannels from "./me/pages/MyChannels";
import ChannelForm from "./me/pages/ChannelForm";
import Favorites from "./me/pages/Favorites";
import Billing from "./me/pages/Billing";
import Payouts from "./me/pages/Payouts";
import Invoices from "./me/pages/Invoices";
import Transactions from "./me/pages/Transactions";
import Blog from "./me/pages/help/Blog";
import Faq from "./me/pages/help/Faq";
import Support from "./me/pages/help/Support";

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
        <Route path="/me" element={<MeLayout />}>
          <Route path="dashboard" element={<MeDashboard />} />
          <Route path="channels" element={<MyChannels />} />
          <Route path="channels/new" element={<ChannelForm />} />
          <Route path="channels/:id/edit" element={<ChannelForm />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="billing" element={<Billing />} />
          <Route path="payouts" element={<Payouts />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="help/blog" element={<Blog />} />
          <Route path="help/faq" element={<Faq />} />
          <Route path="help/support" element={<Support />} />
        </Route>
        <Route path="*" element={<TelegaClone />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
