// frontend/src/components/project/ProjectStats.jsx
import { FolderKanban, CheckCircle2, Clock3, AlertCircle } from "lucide-react";

const STAT_CONFIG = {
  total: {
    label: "Total",
    icon: FolderKanban,
    color: "text-accent-blue",
    bg: "bg-accent-blue/15",
  },
  active: {
    label: "Active",
    icon: Clock3,
    color: "text-accent-blue",
    bg: "bg-accent-blue/15",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-accent-emerald",
    bg: "bg-accent-emerald/15",
  },
  atRisk: {
    label: "At Risk",
    icon: AlertCircle,
    color: "text-accent-rose",
    bg: "bg-accent-rose/15",
  },
};

/**
 * Compute stats from a list of projects.
 * A project is "At Risk" if:
 *   - status is not "completed"/"archived"
 *   - dueDate exists and is in the past
 */
export function computeProjectStats(projects = []) {
  const now = new Date();
  return {
    total: projects.length,
    active: projects.filter(
      (p) => p.status === "active" || p.status === "planning"
    ).length,
    completed: projects.filter((p) => p.status === "completed").length,
    atRisk: projects.filter((p) => {
      if (p.status === "completed" || p.status === "archived") return false;
      if (!p.dueDate) return false;
      return new Date(p.dueDate) < now;
    }).length,
  };
}

export default function ProjectStats({ projects = [] }) {
  const stats = computeProjectStats(projects);

  const items = [
    { key: "total", value: stats.total },
    { key: "active", value: stats.active },
    { key: "completed", value: stats.completed },
    { key: "atRisk", value: stats.atRisk },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ key, value }) => {
        const cfg = STAT_CONFIG[key];
        const Icon = cfg.icon;
        return (
          <div
            key={key}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface/50 p-3"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}
            >
              <Icon className={`h-4 w-4 ${cfg.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-fg leading-tight">
                {value}
              </p>
              <p className="text-[10px] font-semibold text-fg-3 uppercase tracking-wider">
                {cfg.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}