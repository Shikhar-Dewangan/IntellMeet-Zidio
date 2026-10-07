import { useNavigate } from "react-router-dom";
import {
  Bell, Video, UserPlus, FolderKanban, CheckSquare, Clock, X,
} from "lucide-react";

const TYPE_CONFIG = {
  meeting_invitation: {
    icon: Video,
    iconBg: "bg-accent-500/15",
    iconColor: "text-accent-600 dark:text-accent-400",
  },
  meeting_reminder: {
    icon: Clock,
    iconBg: "bg-accent-amber/15",
    iconColor: "text-accent-amber",
  },
  task_assigned: {
    icon: CheckSquare,
    iconBg: "bg-accent-emerald/15",
    iconColor: "text-accent-emerald",
  },
  task_updated: {
    icon: CheckSquare,
    iconBg: "bg-accent-emerald/15",
    iconColor: "text-accent-emerald",
  },
  project_invitation: {
    icon: FolderKanban,
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-500",
  },
  other: {
    icon: Bell,
    iconBg: "bg-surface border border-line",
    iconColor: "text-fg-3",
  },
};

function formatRelativeTime(iso) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  compact = false,
}) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.other;
  const Icon = config.icon;
  const isUnread = !notification.isRead;

  const getTargetRoute = () => {
    if (notification.relatedMeeting?._id) {
      return `/meetings/${notification.relatedMeeting._id}`;
    }
    if (notification.relatedTask?._id) {
      return `/tasks`;
    }
    if (notification.relatedProject?._id) {
      return `/projects/${notification.relatedProject._id}`;
    }
    return null;
  };

  const handleClick = () => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification._id);
    }
    const route = getTargetRoute();
    if (route) {
      navigate(route);
    }
  };

  return (
    <div
      className={`group flex items-start gap-3 transition ${
        compact ? "p-3" : "p-4 sm:p-5"
      } ${isUnread ? "bg-accent-500/5" : "hover:bg-surface/50"}`}
    >
      {/* Icon */}
      <button
        type="button"
        onClick={handleClick}
        className={`flex shrink-0 items-center justify-center rounded-xl ${
          compact ? "h-9 w-9" : "h-10 w-10"
        } ${config.iconBg}`}
      >
        <Icon className={`${compact ? "h-4 w-4" : "h-5 w-5"} ${config.iconColor}`} />
      </button>

      {/* Content */}
      <button
        type="button"
        onClick={handleClick}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-semibold ${
              isUnread ? "text-fg" : "text-fg-2"
            } ${compact ? "line-clamp-1" : ""}`}
          >
            {notification.title || "Notification"}
          </p>
          {isUnread && (
            <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-accent-600" />
          )}
        </div>
        <p
          className={`mt-1 text-xs text-fg-3 leading-relaxed ${
            compact ? "line-clamp-2" : ""
          }`}
        >
          {notification.message || "Workspace activity"}
        </p>
        <p className="mt-1 text-[11px] text-fg-3">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </button>

      {/* Delete */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
          className={`shrink-0 flex items-center justify-center rounded-lg text-fg-3 hover:text-accent-rose hover:bg-accent-rose/10 transition ${
            compact ? "h-7 w-7" : "h-9 w-9"
          }`}
          title="Delete"
        >
          <X className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      )}
    </div>
  );
}