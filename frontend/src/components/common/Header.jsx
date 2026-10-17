import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Menu,
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
import NotificationPanel from "../notification/NotificationPanel.jsx";
import { setMobileSidebarOpen } from "../../store/slices/uiSlice.js";
import { clearCredentials } from "../../store/slices/authSlice.js";
import { logoutUser } from "../../services/auth.service.js";
import { getUnreadNotificationCount } from "../../services/notification.service.js";
import GlobalSearch from "../search/GlobalSearch.jsx";
import { unwrapApiData } from "../../utils/apiData.js";
import useSocket from "../../hooks/useSocket.js";
import toast from "react-hot-toast";

/* ============================================================
   SHARED AVATAR COMPONENT
   ============================================================ */
function UserAvatar({ user, size = "md" }) {
  const sizes = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-sm",
    lg: "w-10 h-10 text-sm",
  };
  const cls = sizes[size];
  const name = user?.fullName || user?.name || "User";
  const initial = name[0]?.toUpperCase() || "U";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={name}
        className={`${cls} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${cls} rounded-full bg-linear-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white font-bold shrink-0`}
    >
      {initial}
    </div>
  );
}

/* ============================================================
   HEADER
   ============================================================ */
export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  // Dropdown + notification panel state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs — desktop + mobile
  const desktopDropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);
  const desktopPanelRef = useRef(null);
  const mobilePanelRef = useRef(null);

  // Socket
  const socketRef = useSocket({ enabled: true });

  /* ============ PROFILE DROPDOWN — CLOSE ON OUTSIDE CLICK ============ */
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

  /* ============ NOTIFICATION PANEL — CLOSE ON OUTSIDE CLICK ============ */
  useEffect(() => {
    const handler = (e) => {
      const inDesktop = desktopPanelRef.current?.contains(e.target);
      const inMobile = mobilePanelRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ============ FETCH UNREAD COUNT + REAL-TIME SOCKET ============ */
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await getUnreadNotificationCount();
        setUnreadCount(unwrapApiData(res)?.count ?? 0);
      } catch {
        // Silent fail
      }
    };

    fetchUnread();

    // Listen for updates (from mark-read / delete events)
    const handleUpdated = () => fetchUnread();
    const handleFocus = () => fetchUnread();
    window.addEventListener("notifications:updated", handleUpdated);
    window.addEventListener("focus", handleFocus);

    // Real-time socket listener
    const socket = socketRef?.current;
    const seenNotificationIds = new Set();
    const handleNew = (payload) => {
      // The socket may be shared by multiple UI surfaces; avoid double-counting
      // the same notification event if it is delivered more than once.
      if (payload?._id) {
        if (seenNotificationIds.has(payload._id)) return;
        seenNotificationIds.add(payload._id);
      }
      if (!payload?.isRead) setUnreadCount((count) => count + 1);
      window.dispatchEvent(
        new CustomEvent("notifications:new", { detail: payload })
      );
      window.dispatchEvent(new Event("notifications:updated"));
      if (payload?.title) {
        toast(payload.title, { icon: "🔔" });
      }
    };
    if (socket) {
      socket.on("notification:new", handleNew);
    }

    return () => {
      window.removeEventListener("notifications:updated", handleUpdated);
      window.removeEventListener("focus", handleFocus);
      if (socket) socket.off("notification:new", handleNew);
    };
  }, [socketRef]);

  const handleLogout = async () => {
  
    try {
      await logoutUser();
      toast.success("Logged out");
    } catch (error) {

      toast.error(error?.message || "Logged out locally; server logout could not be confirmed");
    } finally {
      dispatch(clearCredentials());
      setDropdownOpen(false);
      setPanelOpen(false);
      setUnreadCount(0);
      navigate("/", { replace: true });
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

        {/* CENTER: Global search */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl xl:max-w-3xl">
            <GlobalSearch placeholder="Search meetings, notes, tasks, or projects..." />
          </div>
        </div>

        {/* RIGHT: Notifications + Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notification bell + panel */}
          <div className="relative" ref={desktopPanelRef}>
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="relative p-2 rounded-lg hover:bg-surface text-fg-2 transition"
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-accent-rose text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-page">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <NotificationPanel
              open={panelOpen}
              onClose={() => setPanelOpen(false)}
            />
          </div>

          <div className="w-px h-7 bg-line mx-1" />

          {/* Profile dropdown */}
          <div className="relative" ref={desktopDropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-surface transition"
            >
              <UserAvatar user={user} size="md" />
              <div className="text-left leading-tight">
                <p className="text-sm font-semibold text-fg truncate max-w-30">
                  {user?.fullName || user?.name || "User"}
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

      {/* ================= MOBILE + TABLET (< lg) ================= */}
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

          {/* Notification bell + panel */}
          <div className="relative" ref={mobilePanelRef}>
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="relative p-2 rounded-lg hover:bg-surface text-fg-2 transition"
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-accent-rose text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-page">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {panelOpen && (
              <div className="fixed right-2 left-2 top-16 z-50">
                <NotificationPanel
                  open={panelOpen}
                  onClose={() => setPanelOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={mobileDropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="p-1 rounded-xl hover:bg-surface transition"
              aria-label="Open profile menu"
            >
              <UserAvatar user={user} size="md" />
            </button>

            {dropdownOpen && (
              <div
                className="fixed right-3 top-15 z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl bg-card border border-line shadow-xl overflow-hidden"
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

      {/* ================= MOBILE SEARCH ROW ================= */}
      <div className="lg:hidden px-4 pb-3">
        <GlobalSearch placeholder="Search meetings, notes, tasks..." />
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
        <UserAvatar user={user} size="lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg truncate">
            {user?.fullName || user?.name || "User"}
          </p>
          <p className="text-xs text-fg-3 truncate">
            {user?.email || "user@example.com"}
          </p>
        </div>
      </div>

      <div className="py-1">
        <MenuItem to="/settings" icon={UserIcon} onClick={onClose}>
          Profile
        </MenuItem>
        <MenuItem to="/settings" icon={SettingsIcon} onClick={onClose}>
          Settings
        </MenuItem>
        <MenuItem to="/help" icon={HelpCircle} onClick={onClose}>
          Help & Support
        </MenuItem>
      </div>

      <div className="border-t border-line">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-rose hover:bg-accent-rose/10 transition"
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