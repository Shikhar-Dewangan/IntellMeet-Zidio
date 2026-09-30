import { NavLink } from "react-router-dom";
import { LayoutDashboard, Video, Users, FolderKanban, BarChart3, Settings, LogOut, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const links = [
  ["/dashboard", LayoutDashboard, "Dashboard"],
  ["/meetings", Video, "Meetings"],
  ["/teams", Users, "Teams"],
  ["/projects", FolderKanban, "Projects"],
  ["/analytics", BarChart3, "Analytics"],
  ["/settings", Settings, "Settings"]
];

export default function Sidebar({ mobileOpen = false, onClose }) {
  const { logout } = useAuth();

  const handleNavigate = () => {
    if (onClose) onClose();
  };

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? "show" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-head">
          <NavLink to="/dashboard" className="brand sidebar-brand" onClick={handleNavigate}>
            <span className="brand-mark">I</span><span>IntellMeet</span>
          </NavLink>
          <button className="mobile-close" onClick={onClose} aria-label="Close menu"><X size={21}/></button>
        </div>
        <div className="workspace">WORKSPACE</div>
        <nav className="side-links">
          {links.map(([to, Icon, label]) => (
            <NavLink key={to} to={to} onClick={handleNavigate} className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="side-link logout-btn" onClick={logout}><LogOut size={19}/><span>Sign out</span></button>
      </aside>
    </>
  );
}
