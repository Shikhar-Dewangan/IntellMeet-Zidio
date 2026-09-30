import { Bell, Menu, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ onMenu }) {
  const { user } = useAuth();
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={22}/></button>
      <div className="search-box"><Search size={18}/><input placeholder="Search meetings, tasks, people..." /></div>
      <div className="top-actions">
        <button className="icon-btn" aria-label="Notifications"><Bell size={20}/><span className="notif-dot"/></button>
        <div className="user-chip">
          <div className="avatar">{(user?.name || "U").slice(0,1).toUpperCase()}</div>
          <div><strong>{user?.name || "User"}</strong><small>{user?.role || "Member"}</small></div>
        </div>
      </div>
    </header>
  );
}
