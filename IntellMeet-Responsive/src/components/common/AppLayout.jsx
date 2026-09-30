import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="main-shell">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <section className="page-content"><Outlet /></section>
      </main>
    </div>
  );
}
