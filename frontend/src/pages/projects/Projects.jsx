// frontend/src/pages/Projects.jsx
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Plus, Search } from "lucide-react";
import {
  deleteProject,
  getProjects,
} from "../../services/project.service.js";
import { getMyTeams } from "../../services/team.service.js";
import {
  getApiError,
  unwrapApiList,
} from "../../utils/apiData.js";
import { LoadingState, EmptyState } from "../../components/ui/Shared.jsx";
import ProjectCard from "../../components/project/ProjectCard.jsx";
import ProjectSidebar from "../../components/project/ProjectSidebar.jsx";
import CreateProjectModal from "../../components/project/CreateProjectModal.jsx";
import ProjectTabs from "../../components/project/ProjectTabs.jsx";
import ProjectFilters from "../../components/project/ProjectFilters.jsx";

export default function Projects() {
  const currentUser = useSelector((s) => s.auth.user);
  const currentUserId = currentUser?._id;
  const isAdmin = currentUser?.role === "admin";

  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("project_favorites") || "[]"
      );
    } catch {
      return [];
    }
  });

  const loadData = async () => {
    try {
      const [projectRes, teamRes] = await Promise.all([
        getProjects(),
        getMyTeams().catch(() => ({ data: [] })),
      ]);
      setProjects(unwrapApiList(projectRes));
      setTeams(unwrapApiList(teamRes));
    } catch (error) {
      toast.error(getApiError(error, "Could not load projects"));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id];
      localStorage.setItem("project_favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Delete this project? This cannot be undone.")
    )
      return;
    try {
      await deleteProject(id);
      setProjects((items) => items.filter((p) => p._id !== id));
      toast.success("Project deleted");
      setMenuOpenId(null);
    } catch (error) {
      toast.error(getApiError(error, "Could not delete project"));
    }
  };

  const handleClearFilters = () => {
    setTeamFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const hasActiveFilters =
    teamFilter !== "all" ||
    statusFilter !== "all" ||
    priorityFilter !== "all";

  /* ============ FILTERS ============ */
  const visibleProjects = useMemo(() => {
    let list = [...projects];

    // Tabs
    if (activeTab === "mine") {
      list = list.filter(
        (p) => (p.owner?._id || p.owner) === currentUserId
      );
    } else if (activeTab === "recent") {
      list = list
        .sort(
          (a, b) =>
            new Date(b.updatedAt || 0).getTime() -
            new Date(a.updatedAt || 0).getTime()
        )
        .slice(0, 6);
    } else if (activeTab === "archived") {
      list = list.filter((p) => p.status === "archived");
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Filters
    if (teamFilter !== "all") {
      list = list.filter((p) =>
        (p.teams || []).some(
          (t) => (t._id || t).toString() === teamFilter
        )
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      list = list.filter((p) => p.priority === priorityFilter);
    }

    return list;
  }, [
    projects,
    activeTab,
    search,
    teamFilter,
    statusFilter,
    priorityFilter,
    currentUserId,
  ]);

  const tabs = useMemo(
    () => [
      { value: "all", label: "All Projects", count: projects.length },
      {
        value: "mine",
        label: "My Projects",
        count: projects.filter(
          (p) => (p.owner?._id || p.owner) === currentUserId
        ).length,
      },
      {
        value: "recent",
        label: "Recent",
        count: Math.min(6, projects.length),
      },
      {
        value: "archived",
        label: "Archived",
        count: projects.filter((p) => p.status === "archived").length,
      },
    ],
    [projects, currentUserId]
  );

  if (loading) return <LoadingState text="Loading projects..." />;

  return (
    <div className="space-y-5">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg">
            Projects
          </h1>
          <p className="mt-1 text-sm text-fg-2">
            Plan, manage and track your team projects.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-4 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-accent-blue/25 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </button>
      </div>

      {/* ============ TABS ============ */}
      <ProjectTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* ============ SEARCH + FILTER TOGGLE ============ */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-xl border border-line bg-card pl-9 pr-11 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg transition ${
              showFilters || hasActiveFilters
                ? "bg-accent-blue/15 text-accent-blue"
                : "text-fg-3 hover:bg-surface"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3.5 w-3.5"
            >
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </button>
        </div>
      </div>

      {/* ============ FILTERS ROW ============ */}
      {showFilters && (
        <ProjectFilters
          teamFilter={teamFilter}
          setTeamFilter={setTeamFilter}
          teams={teams}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onClear={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* ============ MAIN GRID ============ */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Left: Projects */}
        <div className="min-w-0">
          {visibleProjects.length === 0 ? (
            <div className="rounded-2xl border border-line bg-card">
              <EmptyState
                icon={Plus}
                title="No projects found"
                description={
                  search || hasActiveFilters
                    ? "Try adjusting your search or filters."
                    : "Create your first project to get started."
                }
                action={
                  !search &&
                  !hasActiveFilters && (
                    <button
                      onClick={() => setCreateOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-4 py-2.5 text-sm font-semibold text-white transition"
                    >
                      <Plus className="h-4 w-4" />
                      Create Project
                    </button>
                  )
                }
              />
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onDelete={handleDelete}
                  onToggleFavorite={toggleFavorite}
                  favorite={favorites.includes(project._id)}
                  menuOpen={menuOpenId === project._id}
                  setMenuOpen={setMenuOpenId}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-card overflow-hidden divide-y divide-line">
              {visibleProjects.map((project) => (
                <div
                  key={project._id}
                  className="flex items-center gap-4 p-4 hover:bg-surface/50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-fg truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-fg-3 truncate">
                      {project.description || "No description"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-fg-2 shrink-0 capitalize">
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <ProjectSidebar projects={projects} teams={teams} />
      </div>

      {/* ============ CREATE MODAL ============ */}
      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(project) =>
          setProjects((items) => [project, ...items])
        }
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </div>
  );
}