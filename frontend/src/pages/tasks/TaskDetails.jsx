// frontend/src/pages/TaskDetails.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  ArrowLeft, Loader2, Trash2, Save, X, Pencil, Calendar,
  Users, FolderKanban, User as UserIcon, Flag, CheckCircle2,
  FileText, ExternalLink, AlertCircle,
} from "lucide-react";

import {
  getTaskById,
  updateTask,
  deleteTask,
} from "../../services/task.service.js";
import {
  getApiError,
  unwrapApiData,
} from "../../utils/apiData.js";
import { LoadingState, EmptyState } from "../../components/ui/Shared.jsx";

const STATUS_CONFIG = {
  todo: { label: "To Do", cls: "bg-slate-500/15 text-slate-400 border-slate-500/20" },
  "in-progress": { label: "In Progress", cls: "bg-accent-blue/15 text-accent-blue border-accent-blue/20" },
  completed: { label: "Completed", cls: "bg-accent-emerald/15 text-accent-emerald border-accent-emerald/20" },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", cls: "bg-accent-emerald/15 text-accent-emerald border-accent-emerald/20" },
  medium: { label: "Medium", cls: "bg-amber-500/15 text-amber-500 border-amber-500/20" },
  high: { label: "High", cls: "bg-accent-rose/15 text-accent-rose border-accent-rose/20" },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 ? 2 : 0)} ${units[i]}`;
}

export default function TaskDetails() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);
  const currentUserId = currentUser?._id;
  const isAdmin = currentUser?.role === "admin";

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTaskById(taskId);
      const data = unwrapApiData(res);
      setTask(data);
      setDraft({
        title: data?.title || "",
        description: data?.description || "",
        status: data?.status || "todo",
        priority: data?.priority || "medium",
        dueDate: data?.dueDate
          ? new Date(data.dueDate).toISOString().split("T")[0]
          : "",
      });
    } catch (err) {
      toast.error(getApiError(err, "Could not load task"));
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const isAssignee = (task?.assignee?._id || task?.assignee) === currentUserId;
  const isCreator = (task?.createdBy?._id || task?.createdBy) === currentUserId;
  const isManager = isAdmin || isCreator;
  const canEdit = isManager;
  const canDelete = isAdmin || isCreator;
  const canEditStatusOnly = !canEdit && isAssignee;

  const handleSave = async () => {
    if (!draft.title?.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        status: draft.status,
        priority: draft.priority,
      };
      if (draft.dueDate) payload.dueDate = draft.dueDate;
      const res = await updateTask(taskId, payload);
      setTask(unwrapApiData(res));
      setEditing(false);
      toast.success("Task updated");
    } catch (err) {
      toast.error(getApiError(err, "Could not update task"));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await updateTask(taskId, { status: newStatus });
      setTask(unwrapApiData(res));
      toast.success("Status updated");
    } catch (err) {
      toast.error(getApiError(err, "Could not update status"));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await deleteTask(taskId);
      toast.success("Task deleted");
      navigate("/tasks", { replace: true });
    } catch (err) {
      toast.error(getApiError(err, "Could not delete task"));
    }
  };

  if (loading) return <LoadingState text="Loading task..." />;

  if (!task) {
    return (
      <div className="space-y-5">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
        <div className="rounded-2xl border border-line bg-card">
          <EmptyState
            icon={AlertCircle}
            title="Task not found"
            description="This task may have been deleted or you don't have access."
          />
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const attachments = task.attachments || [];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* BREADCRUMB */}
      <Link
        to="/tasks"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      {/* HEADER */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full text-xl font-bold bg-transparent border-b-2 border-accent-blue text-fg focus:outline-none pb-1"
              />
            ) : (
              <h1 className={`text-xl sm:text-2xl font-bold ${task.status === "completed" ? "text-fg-3 line-through" : "text-fg"}`}>
                {task.title}
              </h1>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${status.cls}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {status.label}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${priority.cls}`}>
                <Flag className="h-2.5 w-2.5" />
                {priority.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-surface px-3.5 py-2 text-xs font-semibold text-fg transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-accent-rose/30 bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20 transition"
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* META GRID */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetaCard
          icon={FolderKanban}
          label="Project"
          value={task.project?.name || "—"}
        />
        <MetaCard
          icon={Users}
          label="Team"
          value={task.team?.name || "—"}
        />
        <MetaCard
          icon={UserIcon}
          label="Assignee"
          value={task.assignee?.fullName || "Unassigned"}
        />
        <MetaCard
          icon={Calendar}
          label="Due Date"
          value={formatDate(task.dueDate)}
        />
      </div>

      {/* STATUS UPDATE (for assignee or manager) */}
      {(canEdit || canEditStatusOnly) && (
        <div className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-sm font-bold text-fg mb-3">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {["todo", "in-progress", "completed"].map((s) => {
              const cfg = STATUS_CONFIG[s];
              const active = task.status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={active || saving}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? `${cfg.cls} cursor-default`
                      : "border-line bg-surface hover:bg-card text-fg-2"
                  } disabled:opacity-60`}
                >
                  {active && <CheckCircle2 className="h-3 w-3" />}
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DESCRIPTION */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-sm font-bold text-fg mb-3">Description</h2>
        {editing ? (
          <div className="space-y-3">
            <textarea
              rows={5}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 resize-none"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value })
                }
                className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-accent-blue focus:outline-none"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft({ ...draft, priority: e.target.value })
                }
                className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-accent-blue focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) =>
                  setDraft({ ...draft, dueDate: e.target.value })
                }
                className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-accent-blue focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent-blue hover:bg-accent-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setDraft({
                    title: task.title || "",
                    description: task.description || "",
                    status: task.status || "todo",
                    priority: task.priority || "medium",
                    dueDate: task.dueDate
                      ? new Date(task.dueDate).toISOString().split("T")[0]
                      : "",
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-surface px-4 py-2 text-sm font-semibold text-fg transition"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap">
            {task.description || "No description provided."}
          </p>
        )}
      </div>

      {/* ATTACHMENTS */}
      {attachments.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-sm font-bold text-fg mb-3">
            Attachments ({attachments.length})
          </h2>
          <div className="space-y-2">
            {attachments.map((a) => (
              <a
                key={a._id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-line bg-surface/50 p-3 hover:bg-surface transition"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/15 shrink-0">
                  <FileText className="h-4 w-4 text-accent-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-fg truncate">
                    {a.name}
                  </p>
                  <p className="text-[10px] text-fg-3">
                    {formatBytes(a.size)} ·{" "}
                    {formatDate(a.uploadedAt)}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-fg-3 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetaRow
            icon={UserIcon}
            label="Created By"
            value={task.createdBy?.fullName || "—"}
          />
          <MetaRow
            icon={Calendar}
            label="Created"
            value={formatDate(task.createdAt)}
          />
          {task.completedAt && (
            <MetaRow
              icon={CheckCircle2}
              label="Completed"
              value={formatDate(task.completedAt)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MetaCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-fg-3 mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-sm font-semibold text-fg truncate">{value}</p>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-fg-3 shrink-0" />
      <span className="text-xs text-fg-3">{label}:</span>
      <span className="text-xs font-semibold text-fg truncate">{value}</span>
    </div>
  );
}