import { Link } from "react-router-dom";
import { Calendar, AlertCircle, Clock } from "lucide-react";

const PRIORITY_COLORS = {
  high: "bg-rose-500/15 text-rose-500 border-rose-500/20",
  medium: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  low: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
};

function formatDeadline(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;

  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function UpcomingDeadlines({ deadlines = [] }) {
  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
          <Calendar className="h-5 w-5 text-fg-3" />
        </div>
        <p className="text-sm text-fg-2">No upcoming deadlines</p>
        <p className="text-xs text-fg-3 mt-1">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-line">
      {deadlines.slice(0, 5).map((item) => {
        const isTask = item.type === "task";
        const priorityClass = isTask
          ? PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium
          : "";

        return (
          <Link
            key={`${item.type}-${item._id}`}
            to={isTask ? `/tasks` : `/meetings/${item._id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-amber/15">
              {isTask ? (
                <AlertCircle className="h-4 w-4 text-accent-amber" />
              ) : (
                <Calendar className="h-4 w-4 text-accent-amber" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-fg truncate group-hover:text-accent-blue transition">
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {isTask && item.priority && (
                  <span
                    className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${priorityClass}`}
                  >
                    {item.priority}
                  </span>
                )}
                {item.project?.name && (
                  <span className="text-[10px] text-fg-3 truncate">
                    {item.project.name}
                  </span>
                )}
              </div>
            </div>

            <span className="text-[10px] font-semibold text-fg-2 shrink-0 inline-flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {formatDeadline(item.dueDate)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}