// frontend/src/pages/Tasks.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Plus, Search, Shield } from "lucide-react";

import {
  getTasks,
  getTaskStats,
  getEligibleTeams,
} from "../../services/task.service.js";
import {
  getApiError,
  unwrapApiList,
  unwrapApiData,
} from "../../utils/apiData.js";
import { LoadingState, EmptyState } from "../../components/ui/Shared.jsx";
import TaskStatsCards from "../../components/task/TaskStatsCards.jsx";
import TaskFilters from "../../components/task/TaskFilters.jsx";
import TaskTable from "../../components/task/TaskTable.jsx";
import TaskOwnersPanel from "../../components/task/TaskOwnersPanel.jsx";
import TaskDashboard from "../../components/task/TaskDashboard.jsx";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "all", label: "All Tasks" },
  { value: "my", label: "My Tasks" },
  { value: "team", label: "Team Tasks" },
  { value: "owners", label: "Task Owners" },
];

export default function Tasks() {
  const currentUser = useSelector((s) => s.auth.user);
  const currentUserId = currentUser?._id;
  const isAdmin = currentUser?.role === "admin";

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [showFilters, setShowFilters] = useState(false);

  const [teamFilter, setTeamFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  /* ============ LOAD ============ */
  const loadAll = async () => {
    setLoading(true);
    try {
      const [tasksRes, statsRes, teamsRes] = await Promise.all([
        getTasks().catch(() => ({ data: [] })),
        getTaskStats().catch(() => ({ data: {} })),
        getEligibleTeams().catch(() => ({ data: [] })),
      ]);
      setTasks(unwrapApiList(tasksRes));
      setStats(unwrapApiData(statsRes) || {});
      setTeams(unwrapApiList(teamsRes));
    } catch (error) {
      toast.error(getApiError(error, "Could not load tasks"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* ============ FILTERS ============ */
  const projects = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      if (t.project) map.set(t.project._id, t.project);
    });
    return Array.from(map.values());
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    let list = [...tasks];

    if (activeTab === "my") {
      list = list.filter(
        (t) => (t.assignee?._id || t.assignee) === currentUserId
      );
    } else if (activeTab === "team") {
      list = list.filter((t) => t.team);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    if (teamFilter !== "all") {
      list = list.filter((t) => (t.team?._id || t.team) === teamFilter);
    }
    if (projectFilter !== "all") {
      list = list.filter(
        (t) => (t.project?._id || t.project) === projectFilter
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    return list;
  }, [
    tasks,
    activeTab,
    search,
    teamFilter,
    projectFilter,
    statusFilter,
    priorityFilter,
    currentUserId,
  ]);

  const handleClearFilters = () => {
    setTeamFilter("all");
    setProjectFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const hasActiveFilters =
    teamFilter !== "all" ||
    projectFilter !== "all" ||
    statusFilter !== "all" ||
    priorityFilter !== "all";

  if (loading) return <LoadingState text="Loading tasks..." />;

  return (
    <div className="space-y-5">
      {/* HEADER — Create Task button ALWAYS visible */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg">Tasks</h1>
          <p className="mt-1 text-sm text-fg-2">
            Manage and track tasks efficiently across your teams.
          </p>
        </div>

        <Link
          to="/tasks/new"
          className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-700 px-4 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-accent-blue/25 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </Link>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-line overflow-x-auto">
        {TABS.map((t) => {
          const active = activeTab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
                active
                  ? "bg-accent-blue text-white shadow-sm"
                  : "text-fg-2 hover:text-fg hover:bg-card"
              }`}
            >
              {t.value === "owners" && <Shield className="h-3.5 w-3.5" />}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB: TASK OWNERS */}
      {activeTab === "owners" && (
        <TaskOwnersPanel
          teams={teams}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}

      {/* TAB: OVERVIEW (Dashboard) */}
      {activeTab === "overview" && (
        <>
          <TaskStatsCards stats={stats} />
          <TaskDashboard
            stats={stats}
            tasks={tasks}
            currentUserId={currentUserId}
          />
        </>
      )}

      {/* TAB: ALL / MY / TEAM (List view) */}
      {(activeTab === "all" ||
        activeTab === "my" ||
        activeTab === "team") && (
        <>
          <TaskStatsCards stats={stats} />

          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M4 6h16M7 12h10M10 18h4" />
                </svg>
              </button>
            </div>
          </div>

          {showFilters && (
            <TaskFilters
              teamFilter={teamFilter}
              setTeamFilter={setTeamFilter}
              teams={teams}
              projectFilter={projectFilter}
              setProjectFilter={setProjectFilter}
              projects={projects}
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

          {visibleTasks.length === 0 ? (
            <div className="rounded-2xl border border-line bg-card">
              <EmptyState
                icon={Plus}
                title={
                  search || hasActiveFilters
                    ? "No tasks match your filters"
                    : "No tasks yet"
                }
                description={
                  search || hasActiveFilters
                    ? "Try adjusting your search or filters."
                    : "Create your first task to get started."
                }
                action={
                  !search && !hasActiveFilters && (
                    <Link
                      to="/tasks/new"
                      className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-700 px-4 py-2.5 text-sm font-semibold text-white transition"
                    >
                      <Plus className="h-4 w-4" />
                      Create Task
                    </Link>
                  )
                }
              />
            </div>
          ) : (
            <TaskTable tasks={visibleTasks} />
          )}
        </>
      )}
    </div>
  );
}