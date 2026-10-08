import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
} from "../../services/notification.service.js";
import { getApiError, unwrapApiList } from "../../utils/apiData.js";
import NotificationItem from "./NotificationItem.jsx";

export default function NotificationPanel({ open, onClose, socketRef }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);

  /* ============ FETCH ============ */
  useEffect(() => {
    if (!open) return;
    let active = true;

    setLoading(true);
    getMyNotifications()
      .then((res) => {
        if (active) setNotifications(unwrapApiList(res).slice(0, 15));
      })
      .catch((err) => {
        if (active) toast.error(getApiError(err, "Could not load"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  /* ============ SOCKET LISTENER ============ */
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !open) return undefined;

    const handleNew = (payload) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 15));
      toast(payload.title || "New notification", { icon: "🔔" });
    };

    socket.on("notification:new", handleNew);
    return () => socket.off("notification:new", handleNew);
  }, [socketRef, open]);

  /* ============ OUTSIDE CLICK ============ */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  /* ============ ACTIONS ============ */
  const markRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((items) =>
        items.map((i) => (i._id === id ? { ...i, isRead: true } : i)),
      );
      window.dispatchEvent(new Event("notifications:updated"));
    } catch (err) {
      toast.error(getApiError(err, "Could not update"));
    }
  };

  const markAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((items) => items.map((i) => ({ ...i, isRead: true })));
      window.dispatchEvent(new Event("notifications:updated"));
      toast.success("All marked as read");
    } catch (err) {
      toast.error(getApiError(err, "Could not update"));
    }
  };

  const remove = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((items) => items.filter((i) => i._id !== id));
      window.dispatchEvent(new Event("notifications:updated"));
    } catch (err) {
      toast.error(getApiError(err, "Could not delete"));
    }
  };

  if (!open) return null;

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 z-50 w-90 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-card shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-fg">Notifications</h3>
          {unread > 0 && (
            <span className="rounded-full bg-accent-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 dark:text-accent-400 hover:underline"
          >
            <CheckCheck className="h-3 w-3" />
            Mark all
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-100 overflow-y-auto divide-y divide-line">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-accent-600 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface mb-3">
              <Bell className="h-5 w-5 text-fg-3" />
            </div>
            <p className="text-sm font-medium text-fg">All caught up</p>
            <p className="mt-1 text-xs text-fg-3">
              No new notifications
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={markRead}
              onDelete={remove}
              compact
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-line p-2">
        <Link
          to="/notifications"
          onClick ={navigate => navigate("/notifications")}
          className="block w-full text-center rounded-lg py-2 text-xs font-semibold text-accent-600 dark:text-accent-400 hover:bg-surface transition"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}