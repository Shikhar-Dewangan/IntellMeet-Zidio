// frontend/src/pages/ProjectDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  ArrowLeft, FolderKanban, Users, Calendar, CheckCircle2, Clock3,
  Pencil, Trash2, Save, X, Loader2, MoreVertical, GitBranch,
  ListTodo, AlertCircle, Crown, UserPlus, UserMinus, ExternalLink,
  ChevronRight, Target, Search, Layers, Shield, FileText, Plus,
} from "lucide-react";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "../../services/project.service.js";
import { getTasks } from "../../services/task.service.js";
import { searchUsers } from "../../services/user.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";
import { LoadingState, EmptyState } from "../../components/ui/Shared.jsx";
import TeamBadges from "../../components/project/TeamBadges.jsx";
import AssignTeamsModal from "../../components/project/AssignTeamsModal.jsx";
import ProjectFilesPanel from "../../components/project/ProjectFilesPanel.jsx";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

/* ============================================================
   HELPERS
   ============================================================ */
const STATUS_CONFIG = {
  planning: {
    label: "Planning",
    cls: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
  },
  active: {
    label: "Active",
    cls: "bg-accent-blue/15 text-accent-blue border-accent-blue/20",
    dot: "bg-accent-blue",
  },
  completed: {
    label: "Completed",
    cls: "bg-accent-emerald/15 text-accent-emerald border-accent-emerald/20",
    dot: "bg-accent-emerald",
  },
  archived: {
    label: "Archived",
    cls: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
  },
};

const PRIORITY_CONFIG = {
  high: { label: "High", color: "text-accent-rose" },
  medium: { label: "Medium", color: "text-accent-amber" },
  low: { label: "Low", color: "text-accent-emerald" },
};

const AVATAR_COLORS = [
  "from-rose-500 to-rose-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-blue-500 to-blue-700",
  "from-fuchsia-500 to-fuchsia-700",
];

function getAvatarColor(id = "") {
  const hash = id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short", day: "numeric", year: "numeric",
  });
}

function daysLeft(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24));
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);
  const currentUserId = currentUser?._id;
  const isAdmin = currentUser?.role === "admin";

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [assignTeamsOpen, setAssignTeamsOpen] = useState(false);

  const loadData = async () => {
    try {
      const [projectRes, taskRes] = await Promise.all([
        getProjectById(projectId),
        getTasks({ project: projectId }).catch(() => ({ data: [] })),
      ]);
      const p = unwrapApiData(projectRes);
      setProject(p);
      setDraft({
        name: p?.name || "",
        description: p?.description || "",
        status: p?.status || "active",
        priority: p?.priority || "medium",
        startDate: p?.startDate
          ? new Date(p.startDate).toISOString().split("T")[0]
          : "",
        dueDate: p?.dueDate
          ? new Date(p.dueDate).toISOString().split("T")[0]
          : "",
        repositoryUrl: p?.repositoryUrl || "",
      });
      setTasks(unwrapApiList(taskRes));
    } catch (error) {
      toast.error(getApiError(error, "Could not load project"));
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  /* ============================================================
     PERMISSIONS
     ============================================================ */
  const isOwner = useMemo(() => {
    if (!project || !currentUserId) return false;
    return (project.owner?._id || project.owner) === currentUserId;
  }, [project, currentUserId]);

  const isTeamOwnerOfProjectTeam = useMemo(() => {
    if (!project || !currentUserId) return false;
    return (project.teams || []).some((t) => {
      const o = t?.owner?._id || t?.owner;
      return o === currentUserId;
    });
  }, [project, currentUserId]);

  const canManage = isOwner || isAdmin || isTeamOwnerOfProjectTeam;
  const canDelete = isOwner || isAdmin;

  /* ============================================================
     DERIVED
     ============================================================ */
  const progress = useMemo(() => {
    if (project?.status === "completed") return 100;
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return Math.round((completed / tasks.length) * 100);
  }, [project, tasks]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const overdue = tasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.dueDate &&
        new Date(t.dueDate) < new Date()
    ).length;
    return { total, completed, inProgress, todo, overdue };
  }, [tasks]);

  /**
   * Enriched members list.
   *
   * Combines:
   *   - project.members (direct)
   *   - all team.members from project.teams (viaTeam)
   *
   * Dedupes by user._id. Direct membership takes precedence.
   *
   * NOTE: If backend already returns enriched members, we use them as-is.
   * Otherwise we build the union client-side.
   */
  const enrichedMembers = useMemo(() => {
    if (!project) return [];

    const ownerId = (project.owner?._id || project.owner)?.toString?.();
    const map = new Map();

    // Check if project.members already contains `viaTeam` info
    // (backend enriched) — if any member has `viaTeam` field or `source`,
    // trust the backend response.
    const backendEnriched = (project.members || []).some(
      (m) => m && (m.source === "team" || m.viaTeam || (Array.isArray(m.teams) && m.teams.length))
    );

    if (backendEnriched) {
      // Backend gave us enriched — normalize into our shape
      for (const m of project.members || []) {
        const u = m.user || m;
        const id = (u?._id || u)?.toString?.();
        if (!id) continue;
        map.set(id, {
          user: u,
          source: m.source || "direct",
          teams: Array.isArray(m.teams) ? m.teams : [],
          isOwner: id === ownerId,
        });
      }
      return Array.from(map.values());
    }

    // ---- Fallback: build union client-side ----

    // Direct project members (raw User objects)
    for (const m of project.members || []) {
      const id = (m?._id || m)?.toString?.();
      if (!id) continue;
      map.set(id, {
        user: m,
        source: "direct",
        teams: [],
        isOwner: id === ownerId,
      });
    }

    // Owner (if not already in members)
    if (ownerId && project.owner && !map.has(ownerId)) {
      map.set(ownerId, {
        user: project.owner,
        source: "direct",
        teams: [],
        isOwner: true,
      });
    }

    // Team-based members
    for (const team of project.teams || []) {
      if (!team || typeof team !== "object") continue;
      const teamId = team._id?.toString?.();
      const teamName = team.name || "Team";

      // Team members
      for (const tm of team.members || []) {
        const id = (tm?._id || tm)?.toString?.();
        if (!id) continue;
        const existing = map.get(id);
        if (existing) {
          if (!existing.teams.some((t) => t._id === teamId)) {
            existing.teams.push({ _id: teamId, name: teamName });
          }
        } else {
          map.set(id, {
            user: tm,
            source: "team",
            teams: [{ _id: teamId, name: teamName }],
            isOwner: id === ownerId,
          });
        }
      }

      // Team owner
      const teamOwner = team.owner;
      const teamOwnerId = (teamOwner?._id || teamOwner)?.toString?.();
      if (teamOwnerId && !map.has(teamOwnerId)) {
        map.set(teamOwnerId, {
          user: teamOwner,
          source: "team",
          teams: [{ _id: teamId, name: teamName }],
          isOwner: teamOwnerId === ownerId,
        });
      } else if (teamOwnerId) {
        const ex = map.get(teamOwnerId);
        if (ex && !ex.teams.some((t) => t._id === teamId)) {
          ex.teams.push({ _id: teamId, name: teamName });
        }
      }
    }

    return Array.from(map.values());
  }, [project]);

  const handleSave = async () => {
    if (!draft.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        status: draft.status,
        priority: draft.priority,
        repositoryUrl: draft.repositoryUrl.trim(),
      };
      if (draft.startDate) payload.startDate = draft.startDate;
      if (draft.dueDate) payload.dueDate = draft.dueDate;

      const response = await updateProject(projectId, payload);
      setProject(unwrapApiData(response));
      setEditing(false);
      toast.success("Project updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not update project"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`))
      return;
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
    return (
      <div className="space-y-5">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="rounded-2xl border border-line bg-card">
          <EmptyState
            icon={FolderKanban}
            title="Project not found"
            description="This project may have been deleted or you don't have access."
          />
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
  const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;
  const due = daysLeft(project.dueDate);
  const teams = project.teams || [];
  const files = project.files || [];

  const tabs = [
    { value: "overview", label: "Overview", icon: FolderKanban },
    { value: "tasks", label: `Tasks (${tasks.length})`, icon: ListTodo },
    {
      value: "files",
      label: `Files (${files.length})`,
      icon: FileText,
    },
    {
      value: "members",
      label: `Members (${enrichedMembers.length})`,
      icon: Users,
    },
    {
      value: "teams",
      label: `Teams (${teams.length})`,
      icon: Layers,
    },
  ];

  return (
    <div className="space-y-4">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-sm text-fg-3 overflow-x-auto">
        <Link to="/projects" className="hover:text-fg transition shrink-0">
          Projects
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-fg font-medium truncate">{project.name}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* LEFT COLUMN */}
        <div className="space-y-4 min-w-0">
          {/* HERO */}
          <div className="relative overflow-hidden rounded-2xl border border-line">
            <div className="absolute inset-0 bg-linear-to-br from-accent-violet/40 via-accent-blue/30 to-accent-rose/30" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-accent-rose/30 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-accent-blue/30 blur-3xl" />

            <div className="relative p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border-2 border-white/20">
                  <FolderKanban className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  {editing ? (
                    <input
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-b-2 border-white/40 text-white focus:border-white focus:outline-none pb-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                        {project.name}
                      </h1>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status.cls} bg-black/30 backdrop-blur`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                        />
                        {status.label}
                      </span>
                    </div>
                  )}

                  {!editing && (
                    <p className="mt-1.5 text-sm text-white/70 leading-relaxed max-w-2xl line-clamp-2">
                      {project.description || "No description yet."}
                    </p>
                  )}

                  {!editing && teams.length > 0 && (
                    <div className="mt-2.5">
                      <TeamBadges teams={teams} max={3} size="sm" />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2.5">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white leading-tight truncate">
                          {project.owner?.fullName || "Unknown"}
                        </p>
                        <p className="text-[10px] text-white/50 leading-tight">
                          Owner
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-white/10" />

                    <HeroStat
                      icon={Users}
                      value={enrichedMembers.length}
                      label="Members"
                    />
                    <HeroStat
                      icon={CheckCircle2}
                      value={taskStats.completed}
                      label="Completed"
                    />
                    <HeroStat
                      icon={ListTodo}
                      value={taskStats.total}
                      label="Tasks"
                    />
                    <HeroStat
                      icon={FileText}
                      value={files.length}
                      label="Files"
                    />

                    {project.dueDate && (
                      <>
                        <div className="hidden sm:block h-8 w-px bg-white/10" />
                        <HeroStat
                          icon={Calendar}
                          value={formatDate(project.dueDate)}
                          label={
                            due === null
                              ? "Due"
                              : due < 0
                              ? `${Math.abs(due)}d overdue`
                              : due === 0
                              ? "Due today"
                              : `${due}d left`
                          }
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur border border-white/20 px-3.5 py-2 text-xs font-semibold text-white transition disabled:opacity-60"
                      >
                        {saving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setDraft({
                            name: project.name || "",
                            description: project.description || "",
                            status: project.status || "active",
                            priority: project.priority || "medium",
                            startDate: project.startDate
                              ? new Date(project.startDate)
                                  .toISOString()
                                  .split("T")[0]
                              : "",
                            dueDate: project.dueDate
                              ? new Date(project.dueDate)
                                  .toISOString()
                                  .split("T")[0]
                              : "",
                            repositoryUrl: project.repositoryUrl || "",
                          });
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-white transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Add Task button — navigates to tasks page */}
                      <Link
                        to={`/tasks?project=${project._id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 px-3.5 py-2 text-xs font-semibold text-white transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Task
                      </Link>
                      {canManage && (
                        <button
                          onClick={() => setAssignTeamsOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 px-3.5 py-2 text-xs font-semibold text-white transition"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          Teams
                        </button>
                      )}
                      {canManage && (
                        <button
                          onClick={() => setEditing(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 px-3.5 py-2 text-xs font-semibold text-white transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-white transition"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {menuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpen(false)}
                              />
                              <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-line bg-card shadow-xl overflow-hidden">
                                <button
                                  onClick={handleDelete}
                                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold text-accent-rose hover:bg-accent-rose/10 transition"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete project
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-line overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
                    active
                      ? "bg-accent-blue text-white shadow-sm"
                      : "text-fg-2 hover:text-fg hover:bg-card"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT */}
          {tab === "overview" && (
            <OverviewTab
              project={project}
              tasks={tasks}
              taskStats={taskStats}
              members={enrichedMembers}
              teams={teams}
              files={files}
              editing={editing}
              draft={draft}
              setDraft={setDraft}
            />
          )}
          {tab === "tasks" && <TasksTab tasks={tasks} projectId={project._id} />}
          {tab === "files" && (
            <ProjectFilesPanel
              project={project}
              canManage={canManage}
              onUpdated={(updated) => setProject(updated)}
            />
          )}
          {tab === "members" && (
            <MembersTab
              project={project}
              enrichedMembers={enrichedMembers}
              currentUserId={currentUserId}
              canManage={canManage}
              onAddMember={() => setAddMemberOpen(true)}
              onUpdated={() => loadData()}
            />
          )}
          {tab === "teams" && (
            <TeamsTab
              teams={teams}
              canManage={canManage}
              onManageTeams={() => setAssignTeamsOpen(true)}
            />
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-4">
          {/* Progress */}
          <SideCard title="Progress" icon={Target}>
            <div className="p-4">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="h-24 w-24 rounded-full border-4 border-surface flex items-center justify-center mb-3">
                    <ListTodo className="h-8 w-8 text-fg-3" />
                  </div>
                  <p className="text-xs font-semibold text-fg-2">
                    No tasks yet
                  </p>
                  <p className="text-[10px] text-fg-3 mt-1">
                    Add tasks to track progress
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Completed", value: taskStats.completed },
                            {
                              name: "In Progress",
                              value: taskStats.inProgress,
                            },
                            { name: "Todo", value: taskStats.todo },
                          ]}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={60}
                          stroke="none"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="var(--accent-600)" />
                          <Cell fill="#64748b" />
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
                      <p className="text-2xl font-bold text-fg">
                        {progress}%
                      </p>
                      <p className="text-[10px] text-fg-3 uppercase tracking-wider">
                        Complete
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <ProgressRow
                      color="#10b981"
                      label="Completed"
                      value={taskStats.completed}
                    />
                    <ProgressRow
                      color="var(--accent-600)"
                      label="In Progress"
                      value={taskStats.inProgress}
                    />
                    <ProgressRow
                      color="#64748b"
                      label="Todo"
                      value={taskStats.todo}
                    />
                    {taskStats.overdue > 0 && (
                      <ProgressRow
                        color="#f43f5e"
                        label="Overdue"
                        value={taskStats.overdue}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </SideCard>

          {/* Project Info */}
          <SideCard title="Project Info" icon={FolderKanban}>
            <div className="p-4 space-y-3.5">
              <InfoRow
                label="Status"
                value={
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold ${status.cls}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </span>
                }
              />
              <InfoRow
                label="Priority"
                value={
                  <span className={`text-xs font-bold ${priority.color}`}>
                    {priority.label}
                  </span>
                }
              />
              <InfoRow
                label="Start Date"
                value={formatDate(project.startDate)}
              />
              <InfoRow
                label="Due Date"
                value={formatDate(project.dueDate)}
              />
              {project.repositoryUrl && (
                <InfoRow
                  label="Repository"
                  value={
                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent-blue hover:underline"
                    >
                      <GitBranch className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-30">View repo</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  }
                />
              )}
              <InfoRow
                label="Created"
                value={formatDate(project.createdAt)}
              />
            </div>
          </SideCard>

          {/* Members Preview */}
          <SideCard
            title={`Members (${enrichedMembers.length})`}
            icon={Users}
            action={
              <button
                onClick={() => setTab("members")}
                className="text-[11px] font-semibold text-accent-blue hover:underline"
              >
                View all
              </button>
            }
          >
            {enrichedMembers.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="mx-auto h-5 w-5 text-fg-3 mb-2" />
                <p className="text-xs text-fg-3">No members yet</p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {enrichedMembers.slice(0, 4).map(({ user, isOwner: isProjOwner, teams: memberTeams }) => {
                  const id = user?._id || "";
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface/50 transition"
                    >
                      <div
                        className={`h-8 w-8 rounded-full bg-linear-to-br{getAvatarColor(id)} flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0`}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(user.fullName || "U")
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-fg truncate">
                          {user.fullName}
                        </p>
                        <p className="text-[10px] text-fg-3 truncate">
                          {isProjOwner
                            ? "Owner"
                            : memberTeams?.length > 0
                            ? `via ${memberTeams[0].name}${
                                memberTeams.length > 1
                                  ? ` +${memberTeams.length - 1}`
                                  : ""
                              }`
                            : "Member"}
                        </p>
                      </div>
                      {isProjOwner && (
                        <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SideCard>
        </div>
      </div>

      {/* MODALS */}
      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        project={project}
        onUpdated={() => loadData()}
      />

      <AssignTeamsModal
        open={assignTeamsOpen}
        onClose={() => setAssignTeamsOpen(false)}
        project={project}
        onUpdated={() => loadData()}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </div>
  );
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

function HeroStat({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur border border-white/10 shrink-0">
        <Icon className="h-3.5 w-3.5 text-white/90" />
      </div>
      <div>
        <p className="text-sm font-bold text-white leading-tight">{value}</p>
        <p className="text-[10px] text-white/50 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function SideCard({ title, icon: Icon, action, children }) {
  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-accent-blue" />}
            <h3 className="text-sm font-bold text-fg">{title}</h3>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-fg-3 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-fg text-right min-w-0 flex-1">
        {value}
      </span>
    </div>
  );
}

function ProgressRow({ color, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] text-fg-2 flex-1">{label}</span>
      <span className="text-[11px] font-bold text-fg">{value}</span>
    </div>
  );
}

/* ============ OVERVIEW TAB ============ */
function OverviewTab({ project, tasks, taskStats, members, teams, files, editing, draft, setDraft }) {
  const recentTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
    )
    .slice(0, 5);

  const upcomingDeadlines = [...tasks]
    .filter(
      (t) =>
        t.status !== "completed" && t.dueDate && new Date(t.dueDate) >= new Date()
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          icon={ListTodo}
          value={taskStats.total}
          label="Total Tasks"
          color="text-accent-blue"
          bg="bg-accent-blue/15"
        />
        <StatTile
          icon={CheckCircle2}
          value={taskStats.completed}
          label="Completed"
          color="text-accent-emerald"
          bg="bg-accent-emerald/15"
        />
        <StatTile
          icon={Clock3}
          value={taskStats.inProgress}
          label="In Progress"
          color="text-accent-blue"
          bg="bg-accent-blue/15"
        />
        <StatTile
          icon={AlertCircle}
          value={taskStats.overdue}
          label="Overdue"
          color="text-accent-rose"
          bg="bg-accent-rose/15"
        />
      </div>

      {/* Description + edit mode */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <FolderKanban className="h-4 w-4 text-accent-blue" />
          <h3 className="text-sm font-bold text-fg">About this project</h3>
        </div>

        {editing ? (
          <div className="space-y-3">
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Project description..."
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 resize-none"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-fg-2 mb-1.5">
                  Status
                </label>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value })
                  }
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-accent-blue focus:outline-none"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-fg-2 mb-1.5">
                  Priority
                </label>
                <select
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft({ ...draft, priority: e.target.value })
                  }
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-accent-blue focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-fg-2 mb-1.5">
                  Repository
                </label>
                <input
                  value={draft.repositoryUrl}
                  onChange={(e) =>
                    setDraft({ ...draft, repositoryUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-fg-2 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) =>
                    setDraft({ ...draft, startDate: e.target.value })
                  }
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-accent-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-fg-2 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) =>
                    setDraft({ ...draft, dueDate: e.target.value })
                  }
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-accent-blue focus:outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap">
            {project.description || "No description provided yet."}
          </p>
        )}
      </div>

      {/* Recent Tasks + Upcoming Deadlines */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-bold text-fg">Recent Tasks</h3>
            </div>
            <Link
              to={`/tasks?project=${project._id}`}
              className="text-[11px] font-semibold text-accent-blue hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="p-8 text-center">
              <ListTodo className="mx-auto h-6 w-6 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No tasks yet</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {recentTasks.map((task) => {
                const isCompleted = task.status === "completed";
                return (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
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
                        <svg
                          viewBox="0 0 12 12"
                          className="h-2.5 w-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            d="M2 6l3 3 5-6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isCompleted
                            ? "text-fg-3 line-through"
                            : "text-fg"
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold shrink-0 ${
                        PRIORITY_CONFIG[task.priority]?.color || "text-fg-3"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-bold text-fg">Upcoming Deadlines</h3>
            </div>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="mx-auto h-6 w-6 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {upcomingDeadlines.map((task) => {
                const d = Math.ceil(
                  (new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface/30 transition"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-accent-amber/15 flex items-center justify-center">
                      <Calendar className="h-3.5 w-3.5 text-accent-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-fg truncate">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-fg-3">
                        Due {formatDate(task.dueDate)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-fg-3 shrink-0">
                      {d === 0
                        ? "Today"
                        : d < 0
                        ? `${Math.abs(d)}d overdue`
                        : `${d}d left`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Files + Teams Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-bold text-fg">Files</h3>
            </div>
            <span className="text-[11px] font-semibold text-fg-3">
              {files.length} file{files.length !== 1 ? "s" : ""}
            </span>
          </div>
          {files.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="mx-auto h-5 w-5 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No files yet</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {files.slice(0, 3).map((f) => (
                <a
                  key={f._id}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface/30 transition"
                >
                  <FileText className="h-3.5 w-3.5 text-accent-blue shrink-0" />
                  <p className="text-xs font-semibold text-fg truncate flex-1">
                    {f.name}
                  </p>
                  <ExternalLink className="h-3 w-3 text-fg-3 shrink-0" />
                </a>
              ))}
              {files.length > 3 && (
                <div className="px-4 py-2 text-[11px] text-fg-3 text-center">
                  +{files.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-bold text-fg">Teams</h3>
            </div>
            <span className="text-[11px] font-semibold text-fg-3">
              {teams.length} team{teams.length !== 1 ? "s" : ""}
            </span>
          </div>
          {teams.length === 0 ? (
            <div className="p-6 text-center">
              <Layers className="mx-auto h-5 w-5 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No teams assigned</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {teams.slice(0, 3).map((t) => (
                <Link
                  key={t._id}
                  to={`/teams/${t._id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface/30 transition"
                >
                  <div className="h-7 w-7 rounded-lg bg-accent-blue/15 flex items-center justify-center text-accent-blue text-[10px] font-bold shrink-0">
                    {getInitials(t.name || "T")}
                  </div>
                  <p className="text-xs font-semibold text-fg truncate flex-1">
                    {t.name}
                  </p>
                  <span className="text-[10px] text-fg-3 shrink-0">
                    {t.members?.length || 0} members
                  </span>
                </Link>
              ))}
              {teams.length > 3 && (
                <div className="px-4 py-2 text-[11px] text-fg-3 text-center">
                  +{teams.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, value, label, color, bg }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 hover:shadow-md transition">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}
      >
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-fg leading-tight">{value}</p>
      <p className="text-xs font-semibold text-fg-2 mt-0.5">{label}</p>
    </div>
  );
}

/* ============ TASKS TAB ============ */
function TasksTab({ tasks, projectId }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-card">
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Tasks assigned to this project will appear here."
          action={
            <Link
              to={`/tasks?project=${projectId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-4 py-2.5 text-sm font-semibold text-white transition"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      <div className="divide-y divide-line">
        {tasks.map((task) => {
          const isCompleted = task.status === "completed";
          const priority =
            PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
          return (
            <Link
              key={task._id}
              to={`/tasks/${task._id}`}
              className="flex items-center gap-3 p-4 hover:bg-surface/30 transition"
            >
              <div
                className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${
                  isCompleted
                    ? "bg-accent-emerald border-accent-emerald"
                    : "border-fg-3"
                }`}
              >
                {isCompleted && (
                  <svg
                    viewBox="0 0 12 12"
                    className="h-2.5 w-2.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      d="M2 6l3 3 5-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    isCompleted ? "text-fg-3 line-through" : "text-fg"
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-fg-3 truncate mt-0.5">
                    {task.description}
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-bold ${priority.color} shrink-0`}
              >
                {priority.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ============ MEMBERS TAB ============ */
function MembersTab({
  project,
  enrichedMembers,
  currentUserId,
  canManage,
  onAddMember,
  onUpdated,
}) {
  const [removingId, setRemovingId] = useState(null);
  const ownerId = (project.owner?._id || project.owner)?.toString?.();

  const handleRemove = async (member) => {
    const id = member.user?._id || member.user;
    if (id === ownerId) {
      toast.error("Cannot remove the project owner");
      return;
    }
    if (member.source === "team") {
      toast.error(
        "This user is a member via a team. Remove them from the team to revoke access."
      );
      return;
    }
    if (!window.confirm(`Remove ${member.user.fullName} from this project?`))
      return;

    setRemovingId(id);
    try {
      const newMembers = (project.members || [])
        .map((m) => m._id || m)
        .filter((mid) => mid.toString() !== id.toString());
      const response = await updateProject(project._id, {
        members: newMembers,
      });
      onUpdated(unwrapApiData(response));
      toast.success("Member removed");
    } catch (error) {
      toast.error(getApiError(error, "Could not remove member"));
    } finally {
      setRemovingId(null);
    }
  };

  if (enrichedMembers.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-card">
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Add teammates or assign a team to collaborate on this project."
          action={
            canManage && (
              <button
                onClick={onAddMember}
                className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-4 py-2.5 text-sm font-semibold text-white transition"
              >
                <UserPlus className="h-4 w-4" />
                Add Member
              </button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={onAddMember}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-3.5 py-2 text-xs font-semibold text-white transition"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Member
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="divide-y divide-line">
          {enrichedMembers.map((member) => {
            const u = member.user || {};
            const id = u._id || "";
            const isMe = id === currentUserId;
            const isProjOwner = id === ownerId;
            const isRemoving = removingId === id;
            const viaTeams = member.teams || [];
            const isTeamMember = member.source === "team";

            return (
              <div
                key={id}
                className="flex items-center gap-3 p-4 hover:bg-surface/30 transition"
              >
                <div
                  className={`h-11 w-11 shrink-0 rounded-full bg-linear-to-br ${getAvatarColor(id)} flex items-center justify-center text-white text-sm font-bold overflow-hidden`}
                >
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(u.fullName || "U")
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-fg truncate">
                      {u.fullName}
                      {isMe && (
                        <span className="ml-1.5 text-[10px] font-semibold text-fg-3">
                          (You)
                        </span>
                      )}
                    </p>
                    {isProjOwner && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
                        <Crown className="h-2.5 w-2.5" />
                        OWNER
                      </span>
                    )}
                    {isTeamMember && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-blue border border-accent-blue/20">
                        <Users className="h-2.5 w-2.5" />
                        VIA TEAM
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-fg-3 truncate mt-0.5">
                    {u.email}
                  </p>
                  {viaTeams.length > 0 && (
                    <p className="text-[10px] text-fg-3 truncate mt-0.5">
                      via {viaTeams.map((t) => t.name).join(", ")}
                    </p>
                  )}
                </div>

                {canManage && !isProjOwner && !isMe && !isTeamMember && (
                  <button
                    onClick={() => handleRemove(member)}
                    disabled={isRemoving}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-accent-rose/30 bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20 disabled:opacity-50 transition"
                    title="Remove member"
                  >
                    {isRemoving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserMinus className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============ TEAMS TAB ============ */
function TeamsTab({ teams, canManage, onManageTeams }) {
  if (teams.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-card">
        <EmptyState
          icon={Layers}
          title="No teams assigned"
          description="Assign teams to collaborate on this project."
          action={
            canManage && (
              <button
                onClick={onManageTeams}
                className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-4 py-2.5 text-sm font-semibold text-white transition"
              >
                <Layers className="h-4 w-4" />
                Assign Teams
              </button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={onManageTeams}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-3.5 py-2 text-xs font-semibold text-white transition"
          >
            <Layers className="h-3.5 w-3.5" />
            Manage Teams
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="divide-y divide-line">
          {teams.map((t) => {
            const teamOwner = t.owner || {};
            const teamId = t._id;
            return (
              <Link
                key={teamId}
                to={`/teams/${teamId}`}
                className="flex items-center gap-3 p-4 hover:bg-surface/30 transition"
              >
                <div className="h-11 w-11 shrink-0 rounded-xl bg-linear-to-br from-accent-blue to-accent-blue/60 flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(t.name || "T")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">
                    {t.name}
                  </p>
                  <p className="text-xs text-fg-3 truncate">
                    {t.description || "No description"} ·{" "}
                    {t.members?.length || 0} members
                  </p>
                  {teamOwner.fullName && (
                    <p className="text-[10px] text-fg-3 truncate mt-0.5">
                      Owner: {teamOwner.fullName}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-fg-3 shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============ ADD MEMBER MODAL ============ */
function AddMemberModal({ open, onClose, project, onUpdated }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await searchUsers(query.trim());
        setResults(unwrapApiList(response));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, open]);

  if (!open) return null;

  const existingIds = new Set(
    (project?.members || []).map((m) => (m._id || m)?.toString?.())
  );

  const handleAdd = async (userId) => {
    setAddingId(userId);
    try {
      const newMembers = [
        ...(project.members || []).map((m) => m._id || m),
        userId,
      ];
      const response = await updateProject(project._id, {
        members: newMembers,
      });
      onUpdated(unwrapApiData(response));
      toast.success("Member added");
    } catch (error) {
      toast.error(getApiError(error, "Could not add member"));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-card shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15">
              <UserPlus className="h-4 w-4 text-accent-blue" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Add Members</h2>
              <p className="text-xs text-fg-3">Search by name or email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-fg-3 hover:bg-surface transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 border-b border-line">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-xl border border-line bg-surface pl-9 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {searching && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-accent-blue" />
            </div>
          )}

          {!searching && query.trim().length < 2 && (
            <div className="py-12 text-center">
              <Search className="mx-auto h-5 w-5 text-fg-3 mb-2" />
              <p className="text-sm text-fg-2">
                Type 2+ characters to search
              </p>
            </div>
          )}

          {!searching &&
            query.trim().length >= 2 &&
            results.length === 0 && (
              <div className="py-12 text-center">
                <Users className="mx-auto h-5 w-5 text-fg-3 mb-2" />
                <p className="text-sm text-fg-2">No users found</p>
              </div>
            )}

          {!searching &&
            results.map((user) => {
              const isMember = existingIds.has(user._id);
              const isAdding = addingId === user._id;
              return (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition border-b border-line last:border-0"
                >
                  <div
                    className={`h-10 w-10 shrink-0 rounded-full bg-linear-to-br ${getAvatarColor(user._id)} flex items-center justify-center text-white text-sm font-bold overflow-hidden`}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(user.fullName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-fg-3 truncate">
                      {user.email}
                    </p>
                  </div>
                  {isMember ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/20 px-3 py-1.5 text-xs font-semibold">
                      Member
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(user._id)}
                      disabled={isAdding}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition"
                    >
                      {isAdding ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserPlus className="h-3 w-3" />
                      )}
                      Add
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        <div className="border-t border-line px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-fg-3">
            {project?.members?.length || 0} direct member
            {(project?.members?.length || 0) !== 1 ? "s" : ""}
          </p>
          <button
            onClick={onClose}
            className="rounded-xl border border-line bg-card hover:bg-surface px-4 py-2 text-sm font-semibold text-fg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}