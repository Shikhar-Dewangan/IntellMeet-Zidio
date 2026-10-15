// frontend/src/pages/TeamDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  ArrowLeft, Users, Crown, Trash2, UserPlus, FolderKanban, Calendar,
  CheckCircle2, Pencil, Save, X, Loader2, MoreVertical, UserMinus,
  Mail, ArrowRight, Activity, Home, Shield, Settings, ListTodo, Video,
  ChevronRight,
} from "lucide-react";
import {
  getTeamById, updateTeam, deleteTeam, removeTeamMember,
  revokeTeamProjectOwner,
} from "../../services/team.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";
import { EmptyState, LoadingState } from "../../components/ui/Shared.jsx";
import AddMemberDialog from "../../components/team/AddMemberDialog.jsx";
import ContextNote from "../../components/team/ContextNote.jsx";
import ProjectOwnerList from "../../components/team/ProjectOwnerList.jsx";
import GrantProjectOwnerDialog from "../../components/team/GrantProjectOwnerDialog.jsx";

/* ============================================================
   HELPERS
   ============================================================ */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function relativeTime(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  return formatDate(iso);
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

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

function ProjectStatusBadge({ status }) {
  const map = {
    planning: "bg-blue-500/15 text-blue-500 border-blue-500/20",
    active: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
    completed: "bg-violet-500/15 text-violet-500 border-violet-500/20",
    archived: "bg-slate-500/15 text-slate-500 border-slate-500/20",
  };
  const labels = {
    planning: "Planning", active: "In Progress",
    completed: "Completed", archived: "Archived",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${map[status] || map.active}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function TeamDetails() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);
  const currentUserId = currentUser?._id;

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokingPOId, setRevokingPOId] = useState(null);

  const loadTeam = async () => {
    try {
      const response = await getTeamById(teamId);
      const data = unwrapApiData(response);
      setTeam(data);
      setDraft({
        name: data?.name || "",
        description: data?.description || "",
      });
    } catch (error) {
      toast.error(getApiError(error, "Could not load team"));
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const isOwner = useMemo(() => {
    if (!team || !currentUserId) return false;
    return (team.owner?._id || team.owner) === currentUserId;
  }, [team, currentUserId]);

  const isAdmin = currentUser?.role === "admin";
  const canManage = isOwner || isAdmin;

  const members = team?.members || [];
  const owner = team?.owner;
  const projectOwners = team?.projectOwners || [];
  const stats = team?.stats || {
    projects: 0,
    tasks: 0,
    members: 0,
    projectOwners: 0,
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    setSaving(true);
    try {
      const response = await updateTeam(teamId, {
        name: draft.name.trim(),
        description: draft.description.trim(),
      });
      setTeam(unwrapApiData(response));
      setEditing(false);
      toast.success("Team updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not update team"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${team.name}"?\n\n` +
        `Team delete karne se members remove ho jayenge. ` +
        `Assigned projects ki teams list se ye team hat jayegi, ` +
        `lekin projects delete nahi honge.\n\n` +
        `This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await deleteTeam(teamId);
      toast.success("Team deleted");
      navigate("/teams", { replace: true });
    } catch (error) {
      toast.error(getApiError(error, "Could not delete team"));
    }
  };

  const handleRemoveMember = async (member) => {
    const confirmed = window.confirm(
      `Remove ${member.fullName} from the team?\n\n` +
        `Member ko remove karne se uska team-scoped access revoke ho jayega.`
    );
    if (!confirmed) return;

    setRemovingId(member._id);
    try {
      const response = await removeTeamMember(teamId, member._id);
      const updated = unwrapApiData(response);
      // Re-fetch to include projectOwners refresh
      await loadTeam();
      toast.success("Member removed");
      setMenuOpenId(null);
    } catch (error) {
      toast.error(getApiError(error, "Could not remove member"));
    } finally {
      setRemovingId(null);
    }
  };

  const handleRevokePO = async (userId) => {
    const confirmed = window.confirm(
      `Revoke Project Owner authorization?\n\n` +
        `Permission revoke karne ke baad user ke paas is team ke liye ` +
        `special project-management rights nahi rahenge.`
    );
    if (!confirmed) return;

    setRevokingPOId(userId);
    try {
      await revokeTeamProjectOwner(teamId, userId);
      toast.success("Authorization revoked");
      await loadTeam();
    } catch (error) {
      toast.error(getApiError(error, "Could not revoke authorization"));
    } finally {
      setRevokingPOId(null);
    }
  };

  if (loading) return <LoadingState text="Loading team..." />;

  if (!team) {
    return (
      <div className="space-y-5">
        <Link
          to="/teams"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teams
        </Link>
        <div className="rounded-2xl border border-line bg-card">
          <EmptyState
            icon={Users}
            title="Team not found"
            description="This team may have been removed or you don't have access."
          />
        </div>
      </div>
    );
  }

  const tabs = [
    { value: "overview", label: "Overview", icon: Home },
    { value: "members", label: "Members", icon: Users },
    { value: "projectOwners", label: "Project Owners", icon: Shield },
    { value: "projects", label: "Projects", icon: FolderKanban },
    { value: "tasks", label: "Tasks", icon: ListTodo },
    { value: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-4">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-sm text-fg-3 overflow-x-auto">
        <Link to="/teams" className="hover:text-fg transition shrink-0">Teams</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-fg font-medium truncate">{team.name}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* LEFT COLUMN */}
        <div className="space-y-4 min-w-0">
          {/* HERO */}
          <div className="relative overflow-hidden rounded-2xl border border-line">
            <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-accent-blue/30 to-slate-900" />
            <div className="absolute inset-0">
              <div className="absolute top-4 right-4 w-32 h-20 rounded bg-black/40 border border-white/5" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/40" />
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-accent-blue/20 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-violet-500/20 blur-3xl" />
            </div>

            <div className="relative p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-accent-blue to-blue-700 shadow-2xl shadow-accent-blue/40 border-2 border-white/10">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                      {team.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-white/70 leading-relaxed max-w-2xl line-clamp-2">
                    {team.description || "No description yet."}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2.5">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white leading-tight truncate">
                          {owner?.fullName || "Unknown"}
                        </p>
                        <p className="text-[10px] text-white/50 leading-tight">Team Owner</p>
                      </div>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-white/10" />

                    <HeroStat icon={Users} value={stats.members} label="Members" />
                    <HeroStat icon={FolderKanban} value={stats.projects} label="Projects" />
                    <HeroStat icon={Shield} value={stats.projectOwners || 0} label="Project Owners" />
                    <HeroStat icon={CheckCircle2} value={stats.tasks} label="Tasks" />
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2 shrink-0 self-start">
                    <button
                      onClick={() => { setTab("settings"); setEditing(true); }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 px-3.5 py-2 text-xs font-semibold text-white transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Team
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-rose-500/30 backdrop-blur border border-white/10 text-white transition"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition border ${
                    active
                      ? "bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/25"
                      : "bg-card text-fg-2 border-line hover:bg-surface hover:text-fg"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT */}
          {tab === "overview" && (
            <OverviewTab team={team} members={members} stats={stats} />
          )}
          {tab === "members" && (
            <MembersTab
              team={team} members={members} owner={owner}
              currentUserId={currentUserId} canManage={canManage}
              onAdd={() => setAddOpen(true)} onRemove={handleRemoveMember}
              removingId={removingId}
              menuOpenId={menuOpenId} setMenuOpenId={setMenuOpenId}
            />
          )}
          {tab === "projectOwners" && (
            <ProjectOwnerList
              projectOwners={projectOwners}
              members={members}
              owner={owner}
              canManage={canManage}
              onGrant={() => setGrantOpen(true)}
              onRevoke={handleRevokePO}
              revokingId={revokingPOId}
            />
          )}
          {tab === "projects" && <ProjectsTab team={team} stats={stats} />}
          {tab === "tasks" && <TasksTab team={team} stats={stats} />}
          {tab === "settings" && (
            <SettingsTab
              team={team} editing={editing} setEditing={setEditing}
              draft={draft} setDraft={setDraft} onSave={handleSave}
              saving={saving} canManage={canManage} onDelete={handleDelete}
            />
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-4">
          <SideCard
            title="Team Information"
            action={
              canManage && (
                <button
                  onClick={() => { setTab("settings"); setEditing(true); }}
                  className="text-xs font-semibold text-accent-blue hover:underline"
                >
                  Edit
                </button>
              )
            }
          >
            <div className="p-4 space-y-3.5">
              <InfoRow label="Name" value={team.name} />
              <InfoRow label="Description" value={team.description || "—"} multiline />
              <InfoRow
                label="Owner"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`h-5 w-5 rounded-full bg-linear-to-br ${getAvatarColor(owner?._id || "")} flex items-center justify-center text-white text-[9px] font-bold overflow-hidden shrink-0`}
                    >
                      {owner?.avatar ? (
                        <img src={owner.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        getInitials(owner?.fullName || "U")
                      )}
                    </span>
                    {owner?.fullName || "Unknown"}
                  </span>
                }
              />
              <InfoRow label="Created At" value={formatDate(team.createdAt)} />
            </div>
          </SideCard>

          <SideCard title="Quick Actions">
            <div className="p-3 space-y-2">
              {canManage && (
                <QuickAction
                  icon={UserPlus}
                  label="Add Members"
                  onClick={() => { setTab("members"); setAddOpen(true); }}
                />
              )}
              {canManage && (
                <QuickAction
                  icon={Shield}
                  label="Manage Project Owners"
                  onClick={() => setTab("projectOwners")}
                />
              )}
              <QuickAction
                icon={FolderKanban}
                label="Create Project"
                onClick={() => navigate("/projects")}
              />
              <QuickAction
                icon={CheckCircle2}
                label="Create Task"
                onClick={() => navigate("/tasks")}
              />
              {canManage && (
                <QuickAction
                  icon={Pencil}
                  label="Edit Team"
                  onClick={() => { setTab("settings"); setEditing(true); }}
                />
              )}
              {canManage && (
                <QuickAction
                  icon={Trash2}
                  label="Delete Team"
                  onClick={handleDelete}
                  danger
                />
              )}
            </div>
          </SideCard>

          <SideCard
            title={`Team Members (${members.length})`}
            action={
              <button
                onClick={() => setTab("members")}
                className="text-xs font-semibold text-accent-blue hover:underline"
              >
                View all
              </button>
            }
          >
            <div className="p-2">
              {members.slice(0, 5).map((m) => {
                const isMemOwner = (owner?._id || owner) === m._id;
                return (
                  <div
                    key={m._id}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-surface transition"
                  >
                    <div
                      className={`relative h-9 w-9 rounded-full bg-linear-to-br ${getAvatarColor(m._id)} flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0`}
                    >
                      {m.avatar ? (
                        <img src={m.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        getInitials(m.fullName)
                      )}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-fg truncate">
                        {m.fullName}
                      </p>
                      <p className="text-[10px] text-fg-3 truncate">
                        {isMemOwner ? "Team Owner" : "Member"}
                      </p>
                    </div>
                    {isMemOwner && (
                      <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </SideCard>
        </div>
      </div>

      <AddMemberDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        team={team}
        onUpdated={() => loadTeam()}
      />

      <GrantProjectOwnerDialog
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        team={team}
        onGranted={() => loadTeam()}
      />
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTS
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

function SideCard({ title, action, children }) {
  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden h-fit">
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function InfoRow({ label, value, multiline }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-fg-3 shrink-0 w-24">{label}</span>
      <span
        className={`text-xs font-medium text-fg text-right flex-1 ${
          multiline ? "" : "truncate"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
        danger
          ? "border-accent-rose/30 bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20"
          : "border-line bg-surface/50 text-fg-2 hover:bg-surface hover:text-fg hover:border-accent-blue/30"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

/* ============ OVERVIEW TAB ============ */
function OverviewTab({ team, members, stats }) {
  const recentProjects = team.recentProjects || [];
  const recentTasks = team.recentTasks || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={FolderKanban} value={stats.projects} label="Projects" sub="Team-scoped" color="text-amber-500" bg="bg-amber-500/15" />
        <StatTile icon={CheckCircle2} value={stats.tasks} label="Tasks" sub="Team-scoped" color="text-accent-emerald" bg="bg-accent-emerald/15" />
        <StatTile icon={Users} value={stats.members} label="Members" sub="Active" color="text-accent-blue" bg="bg-accent-blue/15" />
        <StatTile icon={Shield} value={stats.projectOwners || 0} label="Project Owners" sub="Scoped" color="text-violet-500" bg="bg-violet-500/15" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-semibold text-fg">Recent Projects</h3>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-accent-blue hover:underline">View all</Link>
          </div>
          {recentProjects.length === 0 ? (
            <div className="p-8 text-center">
              <FolderKanban className="mx-auto h-6 w-6 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No projects yet</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {recentProjects.map((p) => (
                <Link key={p._id} to={`/projects/${p._id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 shrink-0">
                    <FolderKanban className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-fg truncate">{p.name}</p>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <span className="text-[10px] text-fg-3 shrink-0 hidden sm:inline">{relativeTime(p.updatedAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-semibold text-fg">Recent Tasks</h3>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-accent-blue hover:underline">View all</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-fg-3 mb-2" />
              <p className="text-xs text-fg-3">No tasks yet</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {recentTasks.map((t) => {
                const priorityColor = t.priority === "high" ? "text-rose-500" : t.priority === "medium" ? "text-amber-500" : "text-emerald-500";
                return (
                  <div key={t._id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition">
                    <div className={`h-4 w-4 rounded border-2 shrink-0 ${t.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-fg-3"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-fg truncate">{t.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${priorityColor.replace("text-", "bg-")}`} />
                        <span className="text-[10px] text-fg-3 capitalize">{t.priority} Priority</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-fg-3 shrink-0 hidden sm:inline">{relativeTime(t.updatedAt)}</span>
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

function StatTile({ icon: Icon, value, label, sub, color, bg }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 hover:shadow-md transition">
      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-fg leading-tight">{value}</p>
      <p className="text-xs font-semibold text-fg-2 mt-0.5">{label}</p>
      <p className="text-[10px] text-fg-3 mt-0.5">{sub}</p>
    </div>
  );
}

/* ============ MEMBERS TAB ============ */
function MembersTab({
  team, members, owner, currentUserId, canManage, onAdd, onRemove,
  removingId, menuOpenId, setMenuOpenId,
}) {
  return (
    <div className="space-y-4">
      <ContextNote>
        Added members ko is team ka access milega. Unhe Team Owner
        permissions automatically nahi milengi.
      </ContextNote>

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h3 className="text-sm font-semibold text-fg">Team Members ({members.length})</h3>
          {canManage && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 px-3 py-1.5 text-xs font-semibold text-white transition"
            >
              <UserPlus className="h-3 w-3" />
              Add
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <EmptyState icon={Users} title="No members yet" description="Add teammates to start collaborating." />
        ) : (
          <div className="divide-y divide-line">
            {members.map((m) => {
              const isMemOwner = (owner?._id || owner) === m._id;
              const isRemoving = removingId === m._id;
              const isMe = m._id === currentUserId;
              const isProjectOwner = (team.projectOwners || []).some(
                (p) => (p.user?._id || p.user) === m._id
              );

              return (
                <div key={m._id} className="flex items-center gap-3 p-4 hover:bg-surface/50 transition">
                  <div className={`relative h-11 w-11 shrink-0 rounded-full bg-linear-to-br ${getAvatarColor(m._id)} flex items-center justify-center text-white text-sm font-bold overflow-hidden`}>
                    {m.avatar ? <img src={m.avatar} alt="" className="h-full w-full object-cover" /> : getInitials(m.fullName)}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-fg truncate">
                        {m.fullName}
                        {isMe && <span className="ml-1.5 text-[10px] font-semibold text-fg-3">(You)</span>}
                      </p>
                      {isMemOwner && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
                          <Crown className="h-2.5 w-2.5" />
                          OWNER
                        </span>
                      )}
                      {isProjectOwner && !isMemOwner && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-blue border border-accent-blue/20">
                          <Shield className="h-2.5 w-2.5" />
                          PROJECT OWNER
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-fg-3 truncate flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      {m.email}
                    </p>
                  </div>

                  {canManage && !isMemOwner && !isMe && (
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === m._id ? null : m._id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card hover:bg-surface transition"
                      >
                        <MoreVertical className="h-4 w-4 text-fg-3" />
                      </button>
                      {menuOpenId === m._id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div className="absolute right-0 top-11 z-20 w-40 rounded-xl border border-line bg-card shadow-xl overflow-hidden">
                            <button
                              onClick={() => onRemove(m)}
                              disabled={isRemoving}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold text-accent-rose hover:bg-accent-rose/10 transition"
                            >
                              {isRemoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                              Remove from team
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ PROJECTS TAB ============ */
function ProjectsTab({ team, stats }) {
  const projects = team.recentProjects || [];
  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <h3 className="text-sm font-semibold text-fg">Team Projects ({stats.projects})</h3>
        <Link to="/projects" className="text-xs font-semibold text-accent-blue hover:underline">Go to Projects</Link>
      </div>
      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Projects assigned to this team will appear here." />
      ) : (
        <div className="divide-y divide-line">
          {projects.map((p) => (
            <Link key={p._id} to={`/projects/${p._id}`} className="flex items-center gap-3 p-4 hover:bg-surface/50 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 shrink-0">
                <FolderKanban className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg truncate">{p.name}</p>
                <div className="mt-1"><ProjectStatusBadge status={p.status} /></div>
              </div>
              <ArrowRight className="h-4 w-4 text-fg-3 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ TASKS TAB ============ */
function TasksTab({ team, stats }) {
  const tasks = team.recentTasks || [];
  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <h3 className="text-sm font-semibold text-fg">Team Tasks ({stats.tasks})</h3>
        <Link to="/tasks" className="text-xs font-semibold text-accent-blue hover:underline">Go to Tasks</Link>
      </div>
      {tasks.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks yet" description="Tasks belonging to this team will appear here." />
      ) : (
        <div className="divide-y divide-line">
          {tasks.map((t) => (
            <div key={t._id} className="flex items-center gap-3 p-4 hover:bg-surface/50 transition">
              <div className={`h-4 w-4 rounded border-2 shrink-0 ${t.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-fg-3"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg truncate">{t.title}</p>
                <p className="text-xs text-fg-3 capitalize">{t.priority} Priority · {t.project?.name || "No project"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ SETTINGS TAB ============ */
function SettingsTab({
  team, editing, setEditing, draft, setDraft, onSave, saving, canManage, onDelete,
}) {
  if (!canManage) {
    return (
      <div className="rounded-2xl border border-line bg-card">
        <EmptyState icon={Shield} title="Owner access required" description="Only the team owner can access team settings." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-sm font-semibold text-fg">Team Settings</h3>
      </div>
      <div className="p-5 space-y-5">
        {editing ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-fg-2 mb-1.5">
                Team Name <span className="text-accent-blue">*</span>
              </label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                maxLength={100}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-fg-2 mb-1.5">Description</label>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                maxLength={1000}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 resize-none transition"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setDraft({ name: team.name || "", description: team.description || "" });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-surface px-4 py-2 text-sm font-semibold text-fg transition"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold text-fg-2 uppercase tracking-wider mb-2">Team Details</p>
              <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-3">
                <InfoRow label="Name" value={team.name} />
                <InfoRow label="Description" value={team.description || "—"} multiline />
              </div>
              <button
                onClick={() => setEditing(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-surface px-4 py-2 text-sm font-semibold text-fg transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit details
              </button>
            </div>

            <div className="pt-5 border-t border-line">
              <p className="text-xs font-semibold text-accent-rose uppercase tracking-wider mb-2">Danger Zone</p>
              <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/5 p-4">
                <p className="text-sm font-semibold text-fg mb-1">Delete this team</p>
                <p className="text-xs text-fg-3 mb-3">
                  Team delete karne se members remove ho jayenge. Assigned
                  projects ki teams list se ye team hat jayegi, lekin
                  projects delete nahi honge.
                </p>
                <button
                  onClick={onDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent-rose hover:bg-accent-rose/90 px-3 py-2 text-xs font-semibold text-white transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Team
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}