import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
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
  PageHeader,
  SectionCard,
} from "../../components/ui/Shared.jsx";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyNotifications()
      .then((response) => setNotifications(unwrapApiList(response)))
      .catch((error) => {
        toast.error(getApiError(error, "Could not load notifications"));
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const markAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((items) =>
        items.map((item) => ({ ...item, isRead: true })),
      );
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

  const unread = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        subtitle={
          unread ? `${unread} unread notifications.` : "You are all caught up."
        }
        action={
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50    "
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        }
      />

      {notifications.length ? (
        <SectionCard>
          <ul className="divide-y divide-slate-100 ">
            {notifications.map((item) => (
              <li
                key={item._id}
                className={`flex gap-3 p-4 sm:p-5 ${item.isRead ? "bg-transparent" : "bg-blue-50/50 "}`}
              >
                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600  ">
                  <Bell className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => markRead(item._id)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 ">
                        {item.title || item.type || "Notification"}
                      </p>
                      {!item.isRead && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700  ">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 ">
                      {item.message || "Workspace activity."}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 ">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "Just now"}
                    </p>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => remove(item._id)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100   "
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : (
        <SectionCard>
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="Activity and updates will appear here."
          />
        </SectionCard>
      )}
    </div>
  );
}
