// frontend/src/components/task/TaskTable.jsx
import { Link } from "react-router-dom";
import { Calendar, User, FolderKanban, Users } from "lucide-react";

const PRIORITY_CONFIG = {
  high: { label: "High", color: "text-accent-rose", bg: "bg-accent-rose/15", border: "border-accent-rose/20" },
  medium: { label: "Medium", color: "text-amber-500", bg: "bg-amber-500/15", border: "border-amber-500/20" },
  low: { label: "Low", color: "text-accent-emerald", bg: "bg-accent-emerald/15", border: "border-accent-emerald/20" },
};

const STATUS_CONFIG = {
  todo: { label: "To Do", bg: "bg-slate-500/15", color: "text-slate-400", border: "border-slate-500/20" },
  "in-progress": { label: "In Progress", bg: "bg-accent-blue/15", color: "text-accent-blue", border: "border-accent-blue/20" },
  completed: { label: "Completed", bg: "bg-accent-emerald/15", color: "text-accent-emerald", border: "border-accent-emerald/20" },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function TaskTable({ tasks = [] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-card p-10 text-center">
        <p className="text-sm text-fg-3">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      {/* Header - desktop only */}
      <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-line bg-surface/50">
        <div className="text-[11px] font-bold uppercase tracking-wider text-fg-3">Task</div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-fg-3">Project</div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-fg-3">Team</div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-fg-3">Assignee</div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-fg-3">Status</div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-fg-3 text-right">Due Date</div>
      </div>

      <div className="divide-y divide-line">
        {tasks.map((task) => {
          const isCompleted = task.status === "completed";
          const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
          const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
          const assignee = task.assignee;

          return (
            <Link
              key={task._id}
              to={`/tasks/${task._id}`}
              className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-2 lg:gap-3 px-4 py-3 hover:bg-surface/30 transition items-center"
            >
              {/* Task */}
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${
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
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isCompleted ? "text-fg-3 line-through" : "text-fg"}`}>
                      {task.title}
                    </p>
                    <span className={`mt-0.5 inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${priority.bg} ${priority.color} ${priority.border}`}>
                      {priority.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project */}
              <div className="hidden lg:block min-w-0">
                {task.project ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-2 truncate">
                    <FolderKanban className="h-3 w-3 shrink-0 text-accent-blue" />
                    <span className="truncate">{task.project.name}</span>
                  </span>
                ) : (
                  <span className="text-xs text-fg-3">—</span>
                )}
              </div>

              {/* Team */}
              <div className="hidden lg:block min-w-0">
                {task.team ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-2 truncate">
                    <Users className="h-3 w-3 shrink-0 text-accent-blue" />
                    <span className="truncate">{task.team.name}</span>
                  </span>
                ) : (
                  <span className="text-xs text-fg-3">—</span>
                )}
              </div>

              {/* Assignee */}
              <div className="hidden lg:flex items-center gap-2 min-w-0">
                {assignee ? (
                  <>
                    <div className="h-6 w-6 shrink-0 rounded-full bg-linear-to-br from-accent-400 to-accent-700 flex items-center justify-center text-white text-[9px] font-bold overflow-hidden">
                      {assignee.avatar ? (
                        <img src={assignee.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        getInitials(assignee.fullName)
                      )}
                    </div>
                    <span className="text-xs font-medium text-fg-2 truncate">
                      {assignee.fullName}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-fg-3">Unassigned</span>
                )}
              </div>

              {/* Status */}
              <div className="hidden lg:block">
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.color} ${status.border}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {status.label}
                </span>
              </div>

              {/* Due Date */}
              <div className="hidden lg:block text-right">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    isCompleted
                      ? "text-fg-3 line-through"
                      : task.dueDate && new Date(task.dueDate) < new Date()
                      ? "text-accent-rose"
                      : "text-fg-2"
                  }`}
                >
                  <Calendar className="h-3 w-3 shrink-0" />
                  {formatDate(task.dueDate)}
                </span>
              </div>

              {/* Mobile: compact footer */}
              <div className="lg:hidden flex items-center justify-between text-[11px] text-fg-3 pt-1 border-t border-line/50">
                <span className="truncate">
                  {task.project?.name || "No project"}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${status.bg} ${status.color} ${status.border}`}>
                  {status.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}