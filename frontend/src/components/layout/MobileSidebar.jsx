import { useEffect } from "react";
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
  X,
  Crown,
  ArrowRight,
} from "lucide-react";
import { setMobileSidebarOpen } from "../../store/slices/uiSlice.js";

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

export default function MobileSidebar({ unreadNotificationCount = 0 }) {
  const dispatch = useDispatch();
  const isOpen = useSelector((s) => s.ui.isMobileSidebarOpen);
  const close = () => dispatch(setMobileSidebarOpen(false));

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          onClick={close}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-page border-r border-line z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-line shrink-0">
          <Link to="/dashboard" onClick={close} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/30">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-fg">IntelliMeet</span>
          </Link>
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-surface text-fg-3 hover:text-fg transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.to}
                    onClick={close}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                          : "text-fg-2 hover:bg-surface hover:text-fg"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="truncate flex-1">{item.name}</span>
                    {item.to === "/notifications" &&
                      unreadNotificationCount > 0 && (
                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {unreadNotificationCount > 99
                            ? "99+"
                            : unreadNotificationCount}
                        </span>
                      )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Upgrade card */}
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
              onClick={close}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition"
            >
              Upgrade Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
