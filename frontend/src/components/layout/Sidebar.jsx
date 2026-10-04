import { Link, NavLink } from "react-router-dom";
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
  Crown,
  ArrowRight,
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
      className={`hidden lg:flex flex-col shrink-0 bg-page border-r border-line transition-all duration-200 sticky top-0 h-screen ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo — top */}
      <div
        className={`flex items-center h-16 border-b border-line shrink-0 ${
          isSidebarOpen ? "px-4" : "justify-center px-2"
        }`}
      >
        <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-accent-purple to-accent-blue flex items-center justify-center shrink-0 shadow-lg shadow-accent-purple/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && (
            <span className="text-lg font-bold text-fg truncate">
              IntelliMeet
            </span>
          )}
        </Link>
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
                        : "text-fg-2 hover:bg-surface hover:text-fg"
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
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-page" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Upgrade card (only when expanded) */}
      {isSidebarOpen && (
        <div className="p-3 border-t border-line shrink-0">
          <div className="p-4 rounded-2xl border border-line bg-linear-to-br from-blue-600/15 to-accent-violet/10">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-3">
              <Crown className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-fg">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-fg-2 leading-relaxed">
              Get more AI credits and advanced features.
            </p>
            <Link
              to="/billing"
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition"
            >
              Upgrade Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Collapse toggle — bottom */}
      <div className="p-3 border-t border-line shrink-0">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className={`flex items-center gap-3 rounded-xl text-sm font-medium text-fg-2 hover:bg-surface hover:text-fg transition w-full ${
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
