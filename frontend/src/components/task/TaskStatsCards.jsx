// frontend/src/components/task/TaskStatsCards.jsx
import { CheckCircle2, Clock3, ListTodo, AlertCircle, Target } from "lucide-react";

export default function TaskStatsCards({ stats = {} }) {
  const totals = stats.totals || {};
  const total = totals.total || 0;
  const completionRate = stats.completionRate || 0;

  const cards = [
    {
      label: "Total Tasks",
      value: total,
      icon: ListTodo,
      color: "text-accent-blue",
      bg: "bg-accent-blue/15",
    },
    {
      label: "To Do",
      value: totals.todo || 0,
      icon: ListTodo,
      color: "text-amber-500",
      bg: "bg-amber-500/15",
      percent: total ? Math.round(((totals.todo || 0) / total) * 100) : 0,
    },
    {
      label: "In Progress",
      value: totals.inProgress || 0,
      icon: Clock3,
      color: "text-accent-blue",
      bg: "bg-accent-blue/15",
      percent: total
        ? Math.round(((totals.inProgress || 0) / total) * 100)
        : 0,
    },
    {
      label: "Completed",
      value: totals.completed || 0,
      icon: CheckCircle2,
      color: "text-accent-emerald",
      bg: "bg-accent-emerald/15",
      percent: total
        ? Math.round(((totals.completed || 0) / total) * 100)
        : 0,
    },
    {
      label: "Overdue",
      value: totals.overdue || 0,
      icon: AlertCircle,
      color: "text-accent-rose",
      bg: "bg-accent-rose/15",
      percent: total
        ? Math.round(((totals.overdue || 0) / total) * 100)
        : 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="rounded-2xl border border-line bg-card p-4 hover:shadow-md transition"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}
            >
              <Icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold leading-tight ${c.color}`}>
                {c.value}
              </p>
              {c.percent !== undefined && c.percent > 0 && (
                <span className="text-[10px] font-bold text-fg-3">
                  {c.percent}%
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs font-semibold text-fg-2">
              {c.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}