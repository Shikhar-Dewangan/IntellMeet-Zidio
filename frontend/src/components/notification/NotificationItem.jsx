import { useNavigate } from "react-router-dom";
import {
  Bell,
  Video,
  UserPlus,
  UserMinus,
  FolderKanban,
  CheckSquare,
  Clock,
  X,
  ShieldCheck,
  ShieldMinus,
  Sparkles,
  CircleCheck,
  CircleX,
  Play,
  CalendarX,
} from "lucide-react";

const TYPE_CONFIG = {
  meeting_invitation: { icon: Video, iconBg: "bg-accent-500/15", iconColor: "text-accent-600 dark:text-accent-400" },
  meeting_invitation_accepted: { icon: CircleCheck, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600" },
  meeting_invitation_rejected: { icon: CircleX, iconBg: "bg-rose-500/15", iconColor: "text-rose-600" },
  meeting_reminder: { icon: Clock, iconBg: "bg-amber-500/15", iconColor: "text-amber-600" },
  meeting_started: { icon: Play, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600" },
  meeting_cancelled: { icon: CalendarX, iconBg: "bg-rose-500/15", iconColor: "text-rose-600" },
  meeting_ended: { icon: Video, iconBg: "bg-slate-500/15", iconColor: "text-slate-500" },
  meeting_updated: { icon: Clock, iconBg: "bg-blue-500/15", iconColor: "text-blue-600" },
  team_member_added: { icon: UserPlus, iconBg: "bg-blue-500/15", iconColor: "text-blue-600" },
  team_member_removed: { icon: UserMinus, iconBg: "bg-rose-500/15", iconColor: "text-rose-600" },
  project_owner_granted: { icon: ShieldCheck, iconBg: "bg-violet-500/15", iconColor: "text-violet-600" },
  project_owner_revoked: { icon: ShieldMinus, iconBg: "bg-amber-500/15", iconColor: "text-amber-600" },
  project_invitation: { icon: FolderKanban, iconBg: "bg-violet-500/15", iconColor: "text-violet-500" },
  project_updated: { icon: FolderKanban, iconBg: "bg-violet-500/15", iconColor: "text-violet-500" },
  project_member_added: { icon: UserPlus, iconBg: "bg-blue-500/15", iconColor: "text-blue-600" },
  project_member_removed: { icon: UserMinus, iconBg: "bg-rose-500/15", iconColor: "text-rose-600" },
  task_assigned: { icon: CheckSquare, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600" },
  task_reassigned: { icon: UserPlus, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600" },
  task_updated: { icon: CheckSquare, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600" },
  task_completed: { icon: CircleCheck, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600" },
  ai_summary_ready: { icon: Sparkles, iconBg: "bg-violet-500/15", iconColor: "text-violet-600" },
  ai_summary_failed: { icon: Sparkles, iconBg: "bg-rose-500/15", iconColor: "text-rose-600" },
  ai_action_items_ready: { icon: Sparkles, iconBg: "bg-violet-500/15", iconColor: "text-violet-600" },
  ai_task_created: { icon: CircleCheck, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600" },
  other: { icon: Bell, iconBg: "bg-surface border border-line", iconColor: "text-fg-3" },
};

function formatRelativeTime(iso) {
  if (!iso) return "just now";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
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
    if (notification.actionUrl) return notification.actionUrl;
    if (notification.relatedMeeting?._id) return `/meetings/${notification.relatedMeeting._id}`;
    if (notification.relatedTask?._id) return `/tasks/${notification.relatedTask._id}`;
    if (notification.relatedProject?._id) return `/projects/${notification.relatedProject._id}`;
    if (notification.relatedTeam?._id) return `/teams/${notification.relatedTeam._id}`;

    // Backward compatibility for generic entity metadata.
    if (notification.entityType && notification.entityId) {
      const routes = {
        meeting: `/meetings/${notification.entityId}`,
        project: `/projects/${notification.entityId}`,
        task: `/tasks/${notification.entityId}`,
        team: `/teams/${notification.entityId}`,
        ai_summary: `/ai-insights?meeting=${notification.entityId}`,
      };
      return routes[notification.entityType] || null;
    }
    return null;
  };

  const handleClick = async () => {
    if (isUnread && onMarkRead) await onMarkRead(notification._id);
    const route = getTargetRoute();
    if (route) navigate(route);
  };

  return (
    <div
      className={`group flex items-start gap-3 transition ${
        compact ? "p-3" : "p-4 sm:p-5"
      } ${isUnread ? "bg-accent-500/5" : "hover:bg-surface/50"}`}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Open notification: ${notification.title || "Notification"}`}
        className={`flex shrink-0 items-center justify-center rounded-xl ${
          compact ? "h-9 w-9" : "h-10 w-10"
        } ${config.iconBg}`}
      >
        <Icon className={`${compact ? "h-4 w-4" : "h-5 w-5"} ${config.iconColor}`} />
      </button>

      <button type="button" onClick={handleClick} className="min-w-0 flex-1 text-left">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${isUnread ? "text-fg" : "text-fg-2"} ${compact ? "line-clamp-1" : ""}`}>
            {notification.title || "Notification"}
          </p>
          {isUnread && <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-accent-600" />}
        </div>
        <p className={`mt-1 text-xs text-fg-3 leading-relaxed ${compact ? "line-clamp-2" : ""}`}>
          {notification.message || "Workspace activity"}
        </p>
        <p className="mt-1 text-[11px] text-fg-3">{formatRelativeTime(notification.createdAt)}</p>
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(notification._id);
          }}
          className={`shrink-0 flex items-center justify-center rounded-lg text-fg-3 hover:text-accent-rose hover:bg-accent-rose/10 transition ${
            compact ? "h-7 w-7" : "h-9 w-9"
          }`}
          title="Delete notification"
          aria-label="Delete notification"
        >
          <X className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      )}
    </div>
  );
}
