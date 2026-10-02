import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  HelpCircle,
  CreditCard,
  Video,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import { setMobileSidebarOpen } from "../../store/slices/uiSlice.js";
import { clearCredentials } from "../../store/slices/authSlice.js";
import { logoutUser } from "../../services/auth.service.js";
import toast from "react-hot-toast";

export default function Header({ unreadNotificationCount = 0 }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // ignore
    } finally {
      dispatch(clearCredentials());
      toast.success("Logged out");
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="relative flex items-center gap-3 sm:gap-4 px-4 sm:px-6 h-16">
        {/* Mobile: hamburger + logo */}
        <button
          onClick={() => dispatch(setMobileSidebarOpen(true))}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 text-slate-600"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile logo (desktop pe sidebar mein logo hai) */}
        <Link
          to="/dashboard"
          className="lg:hidden flex items-center gap-2 shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">
            IntelliMeet
          </span>
        </Link>

        {/* Search */}
        <div className="hidden lg:flex fixed left-1/2 top-8 z-40 w-[min(28vw,36rem)] -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search meetings, notes, tasks, or projects..."
              className="w-full pl-9 pr-14 py-2.5 rounded-xl bg-slate-100 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm text-slate-800 placeholder-slate-400 transition"
            />
            <kbd className="hidden lg:flex items-center gap-0.5 absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md border border-slate-200 bg-white text-[10px] font-medium text-slate-400">
              ⌘ K
            </kbd>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Theme toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
            aria-label={
              unreadNotificationCount
                ? `Notifications, ${unreadNotificationCount} unread`
                : "Notifications"
            }
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </Link>

          <div className="hidden sm:block w-px h-7 bg-slate-200 mx-1" />

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-100 transition"
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.fullName?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-sm font-semibold text-slate-900 truncate max-w-30">
                  {user?.name || user?.fullName || "User"}
                </p>
                <p className="text-[11px] text-slate-500 truncate max-w-30">
                  Free Plan
                </p>
              </div>
              <ChevronDown className="hidden md:block w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {user?.name?.charAt(0).toUpperCase() ||
                      user?.fullName?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.name || user?.fullName || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                </div>

                <div className="py-1">
                  <MenuItem
                    to="/profile"
                    icon={UserIcon}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem
                    to="/settings"
                    icon={SettingsIcon}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Settings
                  </MenuItem>
                  <MenuItem
                    to="/billing"
                    icon={CreditCard}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Billing
                  </MenuItem>
                  <MenuItem
                    to="/help"
                    icon={HelpCircle}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Help & Support
                  </MenuItem>
                </div>

                <div className="border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ to, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
    >
      <Icon className="w-4 h-4 text-slate-400" />
      {children}
    </Link>
  );
}
