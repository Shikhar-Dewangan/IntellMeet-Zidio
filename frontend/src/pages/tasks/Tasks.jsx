import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Plus, Search, Trash2 } from "lucide-react";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
} from "../../services/task.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";
import {
  EmptyState,
  FilterBar,
  LoadingState,
  PageHeader,
  PriorityBadge,
  SectionCard,
  StatusBadge,
} from "../../components/ui/Shared.jsx";

const initialForm = {
  title: "",
  project: "",
  assignee: "",
  priority: "medium",
  dueDate: "",
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const loadTasks = async () => {
    try {
      const response = await getTasks();
      setTasks(unwrapApiList(response));
    } catch (error) {
      toast.error(getApiError(error, "Could not load tasks"));
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await createTask({
        ...form,
        assignee: form.assignee || undefined,
        dueDate: form.dueDate || undefined,
      });
      setForm(initialForm);
      toast.success("Task created");
      await loadTasks();
    } catch (error) {
      toast.error(getApiError(error, "Could not create task"));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (task, status) => {
    try {
      const response = await updateTask(task._id, { status });
      setTasks((items) =>
        items.map((item) =>
          item._id === task._id
            ? { ...item, status: unwrapApiData(response)?.status || status }
            : item,
        ),
      );
      toast.success("Task updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not update task"));
    }
  };

  const remove = async (id) => {
    try {
      await deleteTask(id);
      setTasks((items) => items.filter((item) => item._id !== id));
      toast.success("Task deleted");
    } catch (error) {
      toast.error(getApiError(error, "Could not delete task"));
    }
  };

  const visibleTasks = tasks.filter((task) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      task.title?.toLowerCase().includes(query) ||
      task.project?.name?.toLowerCase().includes(query)
    );
  });

  if (loading) return <LoadingState text="Loading tasks..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tasks"
        subtitle="Track action items and assignment status across projects."
      />

      <SectionCard title="Create task" icon={Plus}>
        <form onSubmit={create} className="grid gap-4 p-5 xl:grid-cols-5">
          <input
            required
            placeholder="Task title"
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
          />
          <input
            placeholder="Project ID"
            value={form.project}
            onChange={(event) =>
              setForm({ ...form, project: event.target.value })
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
          />
          <input
            placeholder="Assignee ID"
            value={form.assignee}
            onChange={(event) =>
              setForm({ ...form, assignee: event.target.value })
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
          />
          <select
            value={form.priority}
            onChange={(event) =>
              setForm({ ...form, priority: event.target.value })
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            disabled={saving}
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {saving ? "Creating..." : "Create"}
          </button>
        </form>
      </SectionCard>

      <FilterBar>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
          />
        </div>
      </FilterBar>

      {visibleTasks.length ? (
        <SectionCard>
          <div className="divide-y divide-slate-100 ">
            {visibleTasks.map((task) => (
              <div
                key={task._id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-semibold ${task.status === "completed" ? "line-through text-slate-400 " : "text-slate-900 "}`}
                  >
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 ">
                    {task.project?.name || task.project || "Project"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <PriorityBadge priority={task.priority || "medium"} />
                  <StatusBadge status={task.status || "todo"} />
                  <select
                    value={task.status || "todo"}
                    onChange={(event) => changeStatus(task, event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(task._id)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100   "
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard>
          <EmptyState
            icon={CheckCircle2}
            title="No tasks found"
            description="Any tasks across your projects will appear here."
          />
        </SectionCard>
      )}
    </div>
  );
}
