import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bell, CheckCheck } from "lucide-react";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
} from "../../services/notification.service.js";
import { getApiError, unwrapApiList } from "../../utils/apiData.js";
import {
  EmptyState,
  LoadingState,
  SectionCard,
  Tabs,
} from "../../components/ui/Shared.jsx";
import NotificationItem from "../../components/notification/NotificationItem.jsx";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  /* ============ FETCH ============ */
  const loadNotifications = async () => {
    try {
      const response = await getMyNotifications();
      setNotifications(unwrapApiList(response));
    } catch (error) {
      toast.error(getApiError(error, "Could not load notifications"));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  /* ============ FILTER ============ */
  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    if (filter === "invitations")
      return notifications.filter((n) => n.type === "meeting_invitation");
    if (filter === "tasks")
      return notifications.filter(
        (n) => n.type === "task_assigned" || n.type === "task_updated",
      );
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  /* ============ ACTIONS ============ */
  const markAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((items) => items.map((i) => ({ ...i, isRead: true })));
      window.dispatchEvent(new Event("notifications:updated"));
      toast.success("Notifications marked as read");
    } catch (error) {
      toast.error(getApiError(error, "Could not update notifications"));
    }
  };

  const markRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((items) =>
        items.map((item) =>
          item._id === id ? { ...item, isRead: true } : item,
        ),
      );
      window.dispatchEvent(new Event("notifications:updated"));
    } catch (error) {
      toast.error(getApiError(error, "Could not update notification"));
    }
  };

  const remove = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((items) => items.filter((item) => item._id !== id));
      window.dispatchEvent(new Event("notifications:updated"));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error(getApiError(error, "Could not delete notification"));
    }
  };

  if (loading) return <LoadingState text="Loading notifications..." />;

  return (
    <div className="space-y-5">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-fg-2">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}.`
              : "You are all caught up."}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface shrink-0"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* ============ FILTER TABS ============ */}
      <Tabs
        tabs={[
          { value: "all", label: `All${notifications.length ? ` (${notifications.length})` : ""}` },
          { value: "unread", label: `Unread${unreadCount ? ` (${unreadCount})` : ""}` },
          { value: "invitations", label: "Invitations" },
          { value: "tasks", label: "Tasks" },
        ]}
        active={filter}
        onChange={setFilter}
      />

      {/* ============ LIST ============ */}
      {filtered.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Bell}
            title={
              filter === "unread"
                ? "No unread notifications"
                : filter === "invitations"
                ? "No invitations"
                : filter === "tasks"
                ? "No task notifications"
                : "No notifications"
            }
            description="Activity and updates will appear here."
          />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-line">
            {filtered.map((item) => (
              <NotificationItem
                key={item._id}
                notification={item}
                onMarkRead={markRead}
                onDelete={remove}
              />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}