import { Link } from "react-router-dom";
import { Video, FolderKanban, CheckCircle2, Clock } from "lucide-react";

const TYPE_CONFIG = {
  meeting: {
    icon: Video,
    color: "text-accent-blue",
    bg: "bg-accent-blue/15",
    label: "Meeting",
    path: "/meetings",
  },
  project: {
    icon: FolderKanban,
    color: "text-accent-violet",
    bg: "bg-accent-violet/15",
    label: "Project",
    path: "/projects",
  },
  task: {
    icon: CheckCircle2,
    color: "text-accent-emerald",
    bg: "bg-accent-emerald/15",
    label: "Task",
    path: "/tasks",
  },
};

function relativeTime(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function RecentActivityFeed({ activities = [] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
          <Clock className="h-5 w-5 text-fg-3" />
        </div>
        <p className="text-sm text-fg-2">No recent activity</p>
        <p className="text-xs text-fg-3 mt-1">Activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-line">
      {activities.slice(0, 6).map((activity) => {
        const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.task;
        const Icon = config.icon;
        const user = activity.user;

        return (
          <Link
            key={`${activity.type}-${activity._id}`}
            to={`${config.path}/${activity._id}`}
            className="flex items-start gap-3 px-4 py-3 hover:bg-surface/50 transition group"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-fg truncate group-hover:text-accent-blue transition">
                {activity.title}
              </p>
              <p className="text-[10px] text-fg-3 mt-0.5">
                <span className="capitalize">{config.label}</span>
                {user?.fullName && ` · ${user.fullName}`}
              </p>
            </div>
            <span className="text-[10px] text-fg-3 shrink-0 mt-0.5">
              {relativeTime(activity.createdAt)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}