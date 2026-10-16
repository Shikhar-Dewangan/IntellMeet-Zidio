import { Link } from "react-router-dom";
import { Users, Calendar, TrendingUp } from "lucide-react";
import ProjectStats from "./ProjectStats.jsx";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const DONUT_COLORS = {
  active: "var(--accent-600)",
  completed: "#10b981",
  planning: "#94a3b8",
  archived: "#64748b",
};

const LABELS = {
  active: "In Progress",
  completed: "Completed",
  planning: "Not Started",
  archived: "Archived",
};

function ProjectOverviewDonut({ projects }) {
  const counts = {
    active: projects.filter((p) => p.status === "active").length,
    completed: projects.filter((p) => p.status === "completed").length,
    planning: projects.filter((p) => p.status === "planning").length,
    archived: projects.filter((p) => p.status === "archived").length,
  };

  const chartData = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      key: k,
      name: LABELS[k],
      value: v,
      color: DONUT_COLORS[k],
    }));

  return (
    <div className="p-4">
      <div className="relative">
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={68}
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgb(15 23 42)",
                border: "1px solid rgb(51 65 85)",
                borderRadius: "10px",
                fontSize: "12px",
                color: "white",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold text-fg">{projects.length}</p>
          <p className="text-[10px] text-fg-3 uppercase tracking-wider">
            Total Projects
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {chartData.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[11px] text-fg-2 flex-1">
              {item.name}
            </span>
            <span className="text-[11px] font-bold text-fg">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDaysLeft(iso) {
  if (!iso) return "—";
  const days = Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectSidebar({ projects = [], teams = [] }) {
  const upcoming = [...projects]
    .filter((p) => p.dueDate && p.status !== "completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Project Overview */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h3 className="text-sm font-bold text-fg">Project Overview</h3>
          <Link
            to="/analytics"
            className="text-[11px] font-semibold text-accent-blue hover:underline"
          >
            View Analytics →
          </Link>
        </div>
        <ProjectOverviewDonut projects={projects} />
      </div>

      {/* Upcoming Deadlines */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h3 className="text-sm font-bold text-fg">Upcoming Deadlines</h3>
          <Link
            to="/projects"
            className="text-[11px] font-semibold text-accent-blue hover:underline"
          >
            View all →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="p-6 text-center">
            <Calendar className="mx-auto h-5 w-5 text-fg-3 mb-2" />
            <p className="text-xs text-fg-3">No upcoming deadlines</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {upcoming.map((p) => {
              return (
                <Link
                  key={p._id}
                  to={`/projects/${p._id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/15"
                  >
                    <TrendingUp className="h-4 w-4 text-accent-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-fg truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-fg-3">
                      {formatDate(p.dueDate)}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-fg-3 shrink-0">
                    {formatDaysLeft(p.dueDate)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* My Teams */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h3 className="text-sm font-bold text-fg">My Teams</h3>
          <Link
            to="/teams"
            className="text-[11px] font-semibold text-accent-blue hover:underline"
          >
            View all →
          </Link>
        </div>
        {teams.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="mx-auto h-5 w-5 text-fg-3 mb-2" />
            <p className="text-xs text-fg-3">No teams yet</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {teams.slice(0, 4).map((t) => {
              return (
                <Link
                  key={t._id}
                  to={`/teams/${t._id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/15"
                  >
                    <Users className="h-4 w-4 text-accent-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-fg truncate">
                      {t.name}
                    </p>
                    <p className="text-[10px] text-fg-3">
                      {t.members?.length || 0} members
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}