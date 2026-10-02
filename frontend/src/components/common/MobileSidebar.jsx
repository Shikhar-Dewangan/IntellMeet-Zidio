import { useEffect } from "react";
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
  X,
  Crown,
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
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              IntelliMeet
            </span>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
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
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
      </aside>
    </>
  );
}
