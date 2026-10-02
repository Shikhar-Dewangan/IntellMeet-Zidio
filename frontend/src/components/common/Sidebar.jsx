import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  LayoutDashboard,
  Video,
  PlayCircle,
  Users,
  FolderKanban,
  ListChecks,
  BarChart3,
  Bell,
  User,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { toggleSidebar } from "../../store/slices/uiSlice.js";

const navItems = [
  { name: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { name: "Meetings", to: "/meetings", icon: Video },
  { name: "Recorded Meetings", to: "/recordings", icon: PlayCircle },
  { name: "Teams", to: "/teams", icon: Users },
  { name: "Projects", to: "/projects", icon: FolderKanban },
  { name: "Tasks", to: "/tasks", icon: ListChecks },
  { name: "Analytics", to: "/analytics", icon: BarChart3 },
  { name: "Notifications", to: "/notifications", icon: Bell },
  { name: "Profile", to: "/profile", icon: User },
  { name: "Settings", to: "/settings", icon: Settings },
];

export default function Sidebar({ unreadNotificationCount = 0 }) {
  const dispatch = useDispatch();
  const isSidebarOpen = useSelector((s) => s.ui.isSidebarOpen);

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-slate-200 transition-all duration-200 sticky top-0 h-screen ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo — top */}
      <div className="flex items-center px-4 h-16 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/25">
            <Video className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && (
            <span className="text-lg font-bold text-slate-900 truncate">
              IntelliMeet
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const showBadge =
              item.to === "/notifications" && unreadNotificationCount > 0;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.to}
                  title={!isSidebarOpen ? item.name : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl text-sm font-medium transition ${
                      isSidebarOpen
                        ? "px-3 py-2.5"
                        : "justify-center px-2 py-2.5"
                    } ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {isSidebarOpen && (
                    <>
                      <span className="truncate flex-1">{item.name}</span>
                      {showBadge && (
                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {unreadNotificationCount > 99
                            ? "99+"
                            : unreadNotificationCount}
                        </span>
                      )}
                    </>
                  )}
                  {!isSidebarOpen && showBadge && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle — bottom */}
      <div className="p-3 border-t border-slate-200 shrink-0">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className={`flex items-center gap-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition w-full ${
            isSidebarOpen ? "px-3 py-2.5" : "justify-center px-2 py-2.5"
          }`}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <>
              <PanelLeftClose className="w-5 h-5 shrink-0" />
              <span className="truncate">Collapse</span>
            </>
          ) : (
            <PanelLeftOpen className="w-5 h-5 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}
