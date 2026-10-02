import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  FolderKanban,
  ListTodo,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "../../services/project.service.js";
import { getTasks } from "../../services/task.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";
import {
  EmptyState,
  LoadingState,
  PageHeader,
  PriorityBadge,
  SectionCard,
  StatusBadge,
} from "../../components/ui/Shared.jsx";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const loadProject = useCallback(() => {
    Promise.all([getProjectById(projectId), getTasks({ project: projectId })])
      .then(([projectResponse, taskResponse]) => {
        setProject(unwrapApiData(projectResponse) || null);
        setTasks(unwrapApiList(taskResponse));
      })
      .catch((error) => {
        toast.error(getApiError(error, "Could not load project"));
        setProject(null);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const save = async () => {
    try {
      const response = await updateProject(projectId, {
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
      });
      setProject(unwrapApiData(response) || project);
      setEditing(false);
      toast.success("Project updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not update project"));
    }
  };

  const remove = async () => {
    try {
      await deleteProject(projectId);
      toast.success("Project deleted");
      navigate("/projects", { replace: true });
    } catch (error) {
      toast.error(getApiError(error, "Could not delete project"));
    }
  };

  if (loading) return <LoadingState text="Loading project..." />;

  if (!project) {
    return <PageHeader title="Project" subtitle="Project not found." />;
  }

  return (
    <div className="space-y-5">
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:underline "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <PageHeader
        title={project.name}
        subtitle={project.description || "Project workspace."}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50    "
            >
              <Pencil className="h-4 w-4" />
              {editing ? "Cancel" : "Edit"}
            </button>
            <button
              type="button"
              onClick={remove}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100   "
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Overview" icon={FolderKanban}>
          <div className="space-y-4 p-5">
            {editing ? (
              <>
                <label className="block text-sm font-medium text-slate-700 ">
                  Project name
                  <input
                    value={project.name || ""}
                    onChange={(event) =>
                      setProject({ ...project, name: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700 ">
                  Description
                  <textarea
                    value={project.description || ""}
                    onChange={(event) =>
                      setProject({
                        ...project,
                        description: event.target.value,
                      })
                    }
                    className="mt-1.5 min-h-27.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700 ">
                    Status
                    <select
                      value={project.status || "active"}
                      onChange={(event) =>
                        setProject({ ...project, status: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700 ">
                    Priority
                    <select
                      value={project.priority || "medium"}
                      onChange={(event) =>
                        setProject({ ...project, priority: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={save}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Save changes
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={project.status || "active"} />
                  <PriorityBadge priority={project.priority || "medium"} />
                </div>
                <p className="text-sm leading-6 text-slate-600 ">
                  {project.description || "No description provided."}
                </p>
              </>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Summary" icon={ListTodo}>
          <div className="space-y-4 p-5">
            <div className="rounded-xl bg-slate-50 p-4 ">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Progress
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900 ">
                {Math.min(tasks.length * 25, 100)}%
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 ">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Tasks
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900 ">
                {tasks.length}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Tasks" icon={ListTodo}>
        {tasks.length ? (
          <div className="divide-y divide-slate-100 ">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 ">
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 ">
                    {task.status || "Todo"}
                  </p>
                </div>
                <PriorityBadge priority={task.priority || "medium"} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ListTodo}
            title="No tasks in this project"
            description="Add tasks to track the work for this project."
          />
        )}
      </SectionCard>
    </div>
  );
}
