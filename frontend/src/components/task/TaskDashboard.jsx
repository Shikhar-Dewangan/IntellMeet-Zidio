// frontend/src/components/task/TaskDashboard.jsx
import { Link } from "react-router-dom";
import {
  FolderKanban, Calendar, CheckCircle2, Clock3, Flag, ListTodo,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

/* ============================================================
   HELPERS
   ============================================================ */

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "from-accent-400 to-accent-700",
  "from-accent-500 to-accent-900",
  "from-accent-200 to-accent-600",
  "from-accent-400 to-accent-900",
  "from-accent-500 to-accent-700",
];

function getAvatarColor(id = "") {
  const hash = id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const PRIORITY_DOT = {
  high: "bg-accent-rose",
  medium: "bg-amber-500",
  low: "bg-accent-emerald",
};

const STATUS_CONFIG = {
  todo: { label: "To Do", cls: "bg-slate-500/15 text-slate-400 border-slate-500/20" },
  "in-progress": { label: "In Progress", cls: "bg-accent-blue/15 text-accent-blue border-accent-blue/20" },
  completed: { label: "Completed", cls: "bg-accent-emerald/15 text-accent-emerald border-accent-emerald/20" },
};

/* ============================================================
   MAIN DASHBOARD
   ============================================================ */

export default function TaskDashboard({ stats = {}, tasks = [], currentUserId }) {
  const totals = stats.totals || { total: 0, completed: 0, inProgress: 0, todo: 0, overdue: 0 };
  const projectProgress = stats.projectProgress || [];
  const upcomingDeadlines = stats.upcomingDeadlines || [];
  const teamWorkload = stats.teamWorkload || [];

  const myTasks = tasks
    .filter((t) => (t.assignee?._id || t.assignee) === currentUserId)
    .slice(0, 5);

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, 5);

  const donutData = [
    { name: "To Do", value: totals.todo, color: "#94a3b8" },
    { name: "In Progress", value: totals.inProgress, color: "var(--accent-600)" },
    { name: "Completed", value: totals.completed, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const completionRate = stats.completionRate || 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* ============ LEFT COLUMN (2/3) ============ */}
      <div className="lg:col-span-2 space-y-4">
        {/* Tasks by Project */}
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-bold text-fg">Tasks by Project</h3>
            </div>
          </div>

          {projectProgress.length === 0 ? (
            <div className="p-8 text-center">
              <FolderKanban className="mx-auto h-6 w-6 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No project data yet</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {projectProgress.slice(0, 5).map((p, i) => {
                const colorClasses = [
                  "bg-accent-blue",
                  "bg-accent-500",
                  "bg-accent-400",
                  "bg-accent-700",
                  "bg-accent-900",
                ];
                const barColor = colorClasses[i % colorClasses.length];
                return (
                  <div
                    key={p.projectId}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className={`h-9 w-9 rounded-lg ${barColor} opacity-20 flex items-center justify-center shrink-0`}>
                      <FolderKanban className={`h-4 w-4 ${barColor.replace("bg-", "text-")}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-fg truncate">
                        {p.name}
                      </p>
                      <div className="mt-1.5 h-1.5 rounded-full bg-surface overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all`}
                          style={{ width: `${p.completionRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-fg-3 shrink-0">
                      {p.completed}/{p.total}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-bold text-fg">Recent Tasks</h3>
            </div>
          </div>

          {recentTasks.length === 0 ? (
            <div className="p-8 text-center">
              <ListTodo className="mx-auto h-6 w-6 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No tasks yet</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {recentTasks.map((t) => {
                const status = STATUS_CONFIG[t.status] || STATUS_CONFIG.todo;
                const isCompleted = t.status === "completed";
                return (
                  <Link
                    key={t._id}
                    to={`/tasks/${t._id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface/30 transition"
                  >
                    <div
                      className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${
                        isCompleted
                          ? "bg-accent-emerald border-accent-emerald"
                          : "border-fg-3"
                      }`}
                    >
                      {isCompleted && (
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isCompleted ? "text-fg-3 line-through" : "text-fg"}`}>
                        {t.title}
                      </p>
                      <p className="text-[10px] text-fg-3 truncate mt-0.5">
                        {t.project?.name || "No project"}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      {t.assignee && (
                        <div className={`h-6 w-6 rounded-full bg-linear-to-br ${getAvatarColor(t.assignee._id)} flex items-center justify-center text-white text-[9px] font-bold overflow-hidden`}>
                          {t.assignee.avatar ? (
                            <img src={t.assignee.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            getInitials(t.assignee.fullName)
                          )}
                        </div>
                      )}
                      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold ${status.cls}`}>
                        {status.label}
                      </span>
                      <span className="text-[10px] text-fg-3 w-16 text-right">
                        {formatDate(t.dueDate)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============ RIGHT COLUMN (1/3) ============ */}
      <div className="space-y-4">
        {/* Task Completion Donut */}
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <h3 className="text-sm font-bold text-fg">Task Completion</h3>
          </div>
          <div className="p-4">
            {donutData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="h-24 w-24 rounded-full border-8 border-surface flex items-center justify-center">
                  <span className="text-xl font-bold text-fg-3">0%</span>
                </div>
                <p className="mt-3 text-xs text-fg-3">No data yet</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        stroke="none"
                      >
                        {donutData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--line)",
                          borderRadius: "10px",
                          fontSize: "12px",
                          color: "var(--fg)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-bold text-fg">{completionRate}%</p>
                    <p className="text-[10px] text-fg-3">Complete</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {donutData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] text-fg-2 flex-1">{d.name}</span>
                      <span className="text-[11px] font-bold text-fg">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-bold text-fg">Upcoming Deadlines</h3>
            </div>
            <Link to="/tasks?filter=upcoming" className="text-[11px] font-semibold text-accent-blue hover:underline">
              View All
            </Link>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="mx-auto h-5 w-5 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {upcomingDeadlines.slice(0, 4).map((t) => (
                <Link
                  key={t._id}
                  to={`/tasks/${t._id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-surface/30 transition"
                >
                  <div className="flex flex-col items-center shrink-0 w-8">
                    <p className="text-[9px] font-bold uppercase text-accent-rose">
                      {new Date(t.dueDate).toLocaleDateString([], { month: "short" })}
                    </p>
                    <p className="text-sm font-bold text-fg">
                      {new Date(t.dueDate).getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-fg truncate">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-fg-3 truncate">
                      {t.project?.name || "No project"}
                    </p>
                  </div>
                  <span className={`shrink-0 h-5 px-1.5 rounded text-[9px] font-bold flex items-center ${
                    t.priority === "high"
                      ? "bg-accent-rose/15 text-accent-rose"
                      : t.priority === "medium"
                      ? "bg-amber-500/15 text-amber-500"
                      : "bg-accent-emerald/15 text-accent-emerald"
                  }`}>
                    {t.priority}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-bold text-fg">My Tasks</h3>
            </div>
            <Link to="/tasks?filter=my" className="text-[11px] font-semibold text-accent-blue hover:underline">
              View All
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No tasks assigned to you</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {myTasks.map((t) => {
                const status = STATUS_CONFIG[t.status] || STATUS_CONFIG.todo;
                return (
                  <Link
                    key={t._id}
                    to={`/tasks/${t._id}`}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface/30 transition"
                  >
                    <div className="h-7 w-7 rounded-lg bg-accent-blue/15 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-fg truncate">
                        {t.title}
                      </p>
                      <p className="text-[10px] text-fg-3 truncate">
                        {t.project?.name || "No project"}
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Workload */}
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-bold text-fg">Team Workload</h3>
            </div>
            <Link to="/tasks?filter=team" className="text-[11px] font-semibold text-accent-blue hover:underline">
              View All
            </Link>
          </div>

          {teamWorkload.length === 0 ? (
            <div className="p-6 text-center">
              <Clock3 className="mx-auto h-5 w-5 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No team workload data</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {teamWorkload.slice(0, 4).map((t, i) => {
                const colors = [
                  "bg-accent-blue",
                  "bg-accent-500",
                  "bg-accent-400",
                  "bg-accent-700",
                  "bg-accent-900",
                ];
                const barColor = colors[i % colors.length];
                return (
                  <div key={t.teamId} className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-full ${barColor} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                      {getInitials(t.name || "T")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-fg truncate">
                          {t.name}
                        </p>
                        <span className="text-[10px] text-fg-3">
                          {t.total} tasks
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-surface overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${t.completionRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-fg-3 w-8 text-right shrink-0">
                      {t.completionRate}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}