import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FolderKanban, Plus, Search, Trash2 } from "lucide-react";
import {
  createProject,
  deleteProject,
  getProjects,
} from "../../services/project.service.js";
import { getApiError, unwrapApiList } from "../../utils/apiData.js";
import {
  EmptyState,
  FilterBar,
  LoadingState,
  PageHeader,
  PriorityBadge,
  SectionCard,
  StatusBadge,
} from "../../components/ui/Shared.jsx";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    priority: "medium",
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(unwrapApiList(response));
    } catch (error) {
      toast.error(getApiError(error, "Could not load projects"));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const create = async (event) => {
    event.preventDefault();
    try {
      await createProject(form);
      setForm({ name: "", description: "", priority: "medium" });
      toast.success("Project created");
      await loadProjects();
    } catch (error) {
      toast.error(getApiError(error, "Could not create project"));
    }
  };

  const remove = async (id) => {
    try {
      await deleteProject(id);
      setProjects((items) => items.filter((item) => item._id !== id));
      toast.success("Project deleted");
    } catch (error) {
      toast.error(getApiError(error, "Could not delete project"));
    }
  };

  const visibleProjects = projects.filter((project) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      project.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  });

  if (loading) return <LoadingState text="Loading projects..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        subtitle="Manage initiatives, priorities, and cross-functional work."
      />

      <SectionCard title="Create project" icon={FolderKanban}>
        <form
          onSubmit={create}
          className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1.2fr_0.7fr_auto]"
        >
          <input
            required
            placeholder="Project name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
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
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </form>
      </SectionCard>

      <FilterBar>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
          />
        </div>
      </FilterBar>

      {visibleProjects.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => (
            <div
              key={project._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md  "
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600  ">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={() => remove(project._id)}
                  className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100   "
                  aria-label="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                <Link
                  to={`/projects/${project._id}`}
                  className="block text-base font-semibold text-slate-900 transition hover:text-blue-600 "
                >
                  {project.name}
                </Link>
                <p className="mt-2 text-sm text-slate-500 ">
                  {project.description || "No description"}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <StatusBadge status={project.status || "active"} />
                <PriorityBadge priority={project.priority || "medium"} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <SectionCard>
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create a project to start tracking work and milestones."
          />
        </SectionCard>
      )}
    </div>
  );
}
