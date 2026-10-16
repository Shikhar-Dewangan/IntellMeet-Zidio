import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Bell, CheckCheck } from "lucide-react";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
} from "../../services/notification.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";
import {
  EmptyState,
  LoadingState,
  SectionCard,
  Tabs,
} from "../../components/ui/Shared.jsx";
import NotificationItem from "../../components/notification/NotificationItem.jsx";

const TASK_TYPES = ["task_assigned", "task_reassigned", "task_updated", "task_completed"];
const INVITATION_TYPES = [
  "meeting_invitation",
  "meeting_invitation_accepted",
  "meeting_invitation_rejected",
  "meeting_updated",
  "project_invitation",
];
const PROJECT_TYPES = [
  "project_updated",
  "project_member_added",
  "project_member_removed",
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadNotifications = useCallback(async () => {
    try {
      const [response, unreadResponse] = await Promise.all([
        getMyNotifications({ limit: 100, page: 1 }),
        getUnreadNotificationCount(),
      ]);
      setNotifications(unwrapApiList(response));
      setUnreadCount(unwrapApiData(unreadResponse)?.count ?? 0);
    } catch (error) {
      toast.error(getApiError(error, "Could not load notifications"));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    window.addEventListener("notifications:updated", loadNotifications);
    return () => window.removeEventListener("notifications:updated", loadNotifications);
  }, [loadNotifications]);

  useEffect(() => {
    const handleNew = (event) => {
      const notification = event.detail;
      if (!notification?._id) return;
      setNotifications((items) => {
        if (items.some((item) => item._id === notification._id)) return items;
        return [notification, ...items].slice(0, 100);
      });
    };
    window.addEventListener("notifications:new", handleNew);
    return () => window.removeEventListener("notifications:new", handleNew);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((item) => !item.isRead);
    if (filter === "invitations") return notifications.filter((item) => INVITATION_TYPES.includes(item.type));
    if (filter === "tasks") return notifications.filter((item) => TASK_TYPES.includes(item.type));
    if (filter === "projects") return notifications.filter((item) => PROJECT_TYPES.includes(item.type));
    if (filter === "teams") {
      return notifications.filter((item) => [
        "team_member_added",
        "team_member_removed",
        "project_owner_granted",
        "project_owner_revoked",
      ].includes(item.type));
    }
    return notifications;
  }, [notifications, filter]);

  const markAll = async () => {
    try {
      await markAllNotificationsAsRead();
      const now = new Date().toISOString();
      setNotifications((items) => items.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt || now,
      })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("notifications:updated"));
      toast.success("Notifications marked as read");
    } catch (error) {
      toast.error(getApiError(error, "Could not update notifications"));
    }
  };

  const markRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      const wasUnread = notifications.some((item) => item._id === id && !item.isRead);
      setNotifications((items) => items.map((item) => item._id === id
        ? { ...item, isRead: true, readAt: new Date().toISOString() }
        : item));
      if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));
      window.dispatchEvent(new Event("notifications:updated"));
    } catch (error) {
      toast.error(getApiError(error, "Could not update notification"));
    }
  };

  const remove = async (id) => {
    try {
      await deleteNotification(id);
      const wasUnread = notifications.some((item) => item._id === id && !item.isRead);
      setNotifications((items) => items.filter((item) => item._id !== id));
      if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));
      window.dispatchEvent(new Event("notifications:updated"));
    } catch (error) {
      toast.error(getApiError(error, "Could not delete notification"));
    }
  };

  if (loading) return <LoadingState text="Loading notifications..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">Notifications</h1>
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
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      <Tabs
        tabs={[
          { value: "all", label: `All${notifications.length ? ` (${notifications.length})` : ""}` },
          { value: "unread", label: `Unread${unreadCount ? ` (${unreadCount})` : ""}` },
          { value: "invitations", label: "Invitations" },
          { value: "projects", label: "Projects" },
          { value: "tasks", label: "Tasks" },
          { value: "teams", label: "Teams & permissions" },
        ]}
        active={filter}
        onChange={setFilter}
      />

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
                : filter === "projects"
                ? "No project notifications"
                : filter === "teams"
                ? "No team or permission notifications"
                : "No notifications"
            }
            description="Activity and updates will appear here."
          />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-line">
            {filtered.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
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
