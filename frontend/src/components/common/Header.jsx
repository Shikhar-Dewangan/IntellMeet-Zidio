import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  // Two separate refs — one for desktop, one for mobile
  const desktopDropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const inDesktop = desktopDropdownRef.current?.contains(e.target);
      const inMobile = mobileDropdownRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    } finally {
      dispatch(clearCredentials());
      toast.success("Logged out");
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-page border-b border-line">
      {/* ================= DESKTOP (lg+) ================= */}
      <div className="hidden lg:grid grid-cols-[auto_1fr_auto] items-center gap-6 px-6 h-16">
        {/* LEFT: Theme toggle */}
        <div className="flex items-center shrink-0">
          <ThemeToggle />
        </div>

        {/* CENTER: Search bar */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-2xl xl:max-w-3xl">
            <Search className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search meetings, notes, tasks, or projects..."
              className="w-full rounded-xl border border-line bg-card py-2.5 pl-9 pr-4 text-sm text-fg placeholder:text-fg-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* RIGHT: Notifications + Profile */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/notifications"
            className="relative p-2 rounded-lg hover:bg-surface text-fg-2 transition"
            aria-label={
              unreadNotificationCount
                ? `Notifications, ${unreadNotificationCount} unread`
                : "Notifications"
            }
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-page">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </Link>

          <div className="w-px h-7 bg-line mx-1" />

          {/* Profile dropdown (desktop) */}
          <div className="relative" ref={desktopDropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-surface transition"
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.fullName?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
              <div className="text-left leading-tight">
                <p className="text-sm font-semibold text-fg truncate max-w-30">
                  {user?.name || user?.fullName || "User"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-fg-3" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl bg-card border border-line shadow-xl overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <DropdownContent
                  user={user}
                  onClose={() => setDropdownOpen(false)}
                  onLogout={handleLogout}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MOBILE + TABLET (< lg) — UNTOUCHED ================= */}
      <div className="lg:hidden relative flex items-center gap-2 px-4 h-14">
        <button
          onClick={() => dispatch(setMobileSidebarOpen(true))}
          className="p-2 -ml-1 rounded-lg hover:bg-surface text-fg-2"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/30">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="hidden min-[400px]:inline text-base font-bold text-fg">
            IntelliMeet
          </span>
        </Link>

        <div className="flex items-center gap-1 ml-auto">
          <ThemeToggle />

          <Link
            to="/notifications"
            className="relative p-2 rounded-lg hover:bg-surface text-fg-2 transition"
            aria-label={
              unreadNotificationCount
                ? `Notifications, ${unreadNotificationCount} unread`
                : "Notifications"
            }
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-page">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </Link>

          {/* Profile dropdown (mobile) — separate ref, separate dropdown */}
          <div className="relative" ref={mobileDropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="p-1 rounded-xl hover:bg-surface transition"
              aria-label="Open profile menu"
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.fullName?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
            </button>

            {dropdownOpen && (
              <div
                className="fixed right-3 top-[4.25rem] z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl bg-card border border-line shadow-xl overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <DropdownContent
                  user={user}
                  onClose={() => setDropdownOpen(false)}
                  onLogout={handleLogout}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MOBILE SEARCH ROW — UNTOUCHED ================= */}
      <div className="lg:hidden px-4 pb-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search meetings, notes, tasks..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-line focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm text-fg placeholder:text-fg-3 transition"
          />
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   DROPDOWN CONTENT (shared between desktop + mobile)
   ============================================================ */

function DropdownContent({ user, onClose, onLogout }) {
  return (
    <>
      <div className="px-4 py-3 border-b border-line flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user?.name?.charAt(0).toUpperCase() ||
            user?.fullName?.charAt(0).toUpperCase() ||
            "U"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg truncate">
            {user?.name || user?.fullName || "User"}
          </p>
          <p className="text-xs text-fg-3 truncate">
            {user?.email || "user@example.com"}
          </p>
        </div>
      </div>

      <div className="py-1">
        <MenuItem to="/profile" icon={UserIcon} onClick={onClose}>
          Profile
        </MenuItem>
        <MenuItem to="/settings" icon={SettingsIcon} onClick={onClose}>
          Settings
        </MenuItem>
        <MenuItem to="/billing" icon={CreditCard} onClick={onClose}>
          Billing
        </MenuItem>
        <MenuItem to="/help" icon={HelpCircle} onClick={onClose}>
          Help & Support
        </MenuItem>
      </div>

      <div className="border-t border-line">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );
}

function MenuItem({ to, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-fg-2 hover:bg-surface"
    >
      <Icon className="w-4 h-4 text-fg-3" />
      {children}
    </Link>
  );
}