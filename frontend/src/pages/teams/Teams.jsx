import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  FolderKanban,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Trash2,
  Crown,
} from "lucide-react";
import { deleteTeam, getMyTeams } from "../../services/team.service.js";
import { getApiError, unwrapApiList } from "../../utils/apiData.js";
import {
  EmptyState,
  LoadingState,
  SectionCard,
  AvatarGroup,
} from "../../components/ui/Shared.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import TeamCard from "../../components/team/TeamCard.jsx";
import CreateTeamDialog from "../../components/team/CreateTeamDialog.jsx";

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function Teams() {
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);
  const currentUserId = currentUser?._id;

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  /* ============ FETCH ============ */
  const loadTeams = async () => {
    try {
      const response = await getMyTeams();
      setTeams(unwrapApiList(response));
    } catch (error) {
      toast.error(getApiError(error, "Could not load teams"));
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  /* ============ STATS ============ */
  const stats = useMemo(() => {
    const totalTeams = teams.length;
    const totalMembers = new Set(
      teams.flatMap((t) => (t.members || []).map((m) => m._id || m))
    ).size;
    const totalProjects = teams.reduce(
      (sum, t) => sum + (t.stats?.projects || 0),
      0
    );
    const totalMeetings = teams.reduce(
      (sum, t) => sum + (t.stats?.meetings || 0),
      0
    );
    const owned = teams.filter((t) => {
      const ownerId = t.owner?._id || t.owner;
      return ownerId === currentUserId;
    }).length;
    const memberOf = totalTeams - owned;
    return {
      totalTeams,
      totalMembers,
      totalProjects,
      totalMeetings,
      owned,
      memberOf,
    };
  }, [teams, currentUserId]);

  /* ============ FILTER + SORT ============ */
  const visibleTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    let list = teams.filter((t) => {
      if (!query) return true;
      return (
        t.name?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    });

    if (filter === "owned") {
      list = list.filter((t) => {
        const ownerId = t.owner?._id || t.owner;
        return ownerId === currentUserId;
      });
    } else if (filter === "member") {
      list = list.filter((t) => {
        const ownerId = t.owner?._id || t.owner;
        return ownerId !== currentUserId;
      });
    }

    list.sort((a, b) => {
      if (sortBy === "recent")
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      if (sortBy === "oldest")
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "members")
        return (b.members?.length || 0) - (a.members?.length || 0);
      return 0;
    });

    return list;
  }, [teams, search, filter, sortBy, currentUserId]);

  /* ============ DELETE ============ */
  const handleDelete = async (team) => {
    if (
      !window.confirm(
        `Delete "${team.name}"? All members will be removed. This cannot be undone.`
      )
    )
      return;

    setDeletingId(team._id);
    try {
      await deleteTeam(team._id);
      setTeams((items) => items.filter((i) => i._id !== team._id));
      toast.success("Team deleted");
    } catch (error) {
      toast.error(getApiError(error, "Could not delete team"));
    } finally {
      setDeletingId(null);
    }
  };

  /* ============ LOADING ============ */
  if (loading) return <LoadingState text="Loading teams..." />;

  return (
    <div className="space-y-5">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg">Teams</h1>
          <p className="mt-1 text-sm text-fg-2">
            Manage your people, projects, and collaboration groups.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-4 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-accent-blue/20 shrink-0"
        >
          <Plus className="h-4 w-4" />
          New team
        </button>
      </div>

      {/* ============ STAT CARDS ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Teams"
          value={stats.totalTeams}
          icon={Users}
          iconBg="bg-accent-blue/15"
          iconColor="text-accent-blue"
          change="Across all your work"
          changeType="flat"
        />
        <StatCard
          label="Total Members"
          value={stats.totalMembers}
          icon={Users}
          iconBg="bg-accent-blue/15"
          iconColor="text-accent-blue"
          change="Collaborating with you"
          changeType="flat"
        />
        <StatCard
          label="Team Projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          iconBg="bg-accent-amber/15"
          iconColor="text-accent-amber"
          change="In active development"
          changeType="flat"
        />
        <StatCard
          label="Team Meetings"
          value={stats.totalMeetings}
          icon={Calendar}
          iconBg="bg-violet-500/15"
          iconColor="text-violet-500"
          change="This month"
          changeType="flat"
        />
      </div>

      {/* ============ FILTERS ============ */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 border-b border-line pb-0">
        {/* Tabs (underline style) */}
        <div className="flex items-center gap-1 overflow-x-auto -mb-px">
          <UnderlineTab
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All Teams"
            count={stats.totalTeams}
          />
          <UnderlineTab
            active={filter === "owned"}
            onClick={() => setFilter("owned")}
            label="Owned by me"
            count={stats.owned}
          />
          <UnderlineTab
            active={filter === "member"}
            onClick={() => setFilter("member")}
            label="Member of"
            count={stats.memberOf}
          />
          <UnderlineTab
            active={filter === "archived"}
            onClick={() => setFilter("archived")}
            label="Archived"
            count={0}
          />
        </div>

        {/* Search + Sort + View */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xl:ml-auto w-full xl:w-auto pb-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams by name or description..."
              className="w-full rounded-xl border border-line bg-card pl-9 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition"
            />
          </div>

          <div className="relative shrink-0">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-xl border border-line bg-card pl-9 pr-8 py-2.5 text-sm text-fg focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition cursor-pointer"
            >
              <option value="recent">Recently active</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name (A-Z)</option>
              <option value="members">Most members</option>
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-line bg-card p-1 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-accent-blue/15 text-accent-blue"
                  : "text-fg-3 hover:text-fg hover:bg-surface"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                viewMode === "list"
                  ? "bg-accent-blue/15 text-accent-blue"
                  : "text-fg-3 hover:text-fg hover:bg-surface"
              }`}
              title="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      {filter === "archived" ? (
        <SectionCard>
          <EmptyState
            icon={Users}
            title="No archived teams"
            description="Archived teams will appear here."
          />
        </SectionCard>
      ) : visibleTeams.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Users}
            title={
              search || filter !== "all"
                ? "No teams match your filters"
                : "No teams yet"
            }
            description={
              search || filter !== "all"
                ? "Try adjusting your search or filter."
                : "Create a team and invite collaborators to get started."
            }
            action={
              !search && filter === "all" ? (
                <button
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-4 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-accent-blue/25"
                >
                  <Plus className="h-4 w-4" />
                  Create Team
                </button>
              ) : null
            }
          />
        </SectionCard>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTeams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              currentUserId={currentUserId}
              onDelete={() => handleDelete(team)}
            />
          ))}
        </div>
      ) : (
        <SectionCard>
          <div className="divide-y divide-line">
            {visibleTeams.map((team) => (
              <TeamRow
                key={team._id}
                team={team}
                currentUserId={currentUserId}
                onDelete={() => handleDelete(team)}
                deleting={deletingId === team._id}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* ============ CREATE CTA SECTION ============ */}
      {visibleTeams.length > 0 && (
        <section className="relative overflow-hidden rounded-2xl border border-line bg-linear-to-br from-card via-card to-page">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-accent-blue/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none" />

          <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/15">
                  <Users className="h-4 w-4 text-accent-blue" />
                </div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent-blue">
                  Collaboration
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-fg">
                Create a new team
              </h2>
              <p className="mt-2 text-sm text-fg-2 leading-relaxed max-w-lg">
                Bring your team together. Create a team and start collaborating
                on projects, meetings, and tasks.
              </p>

              <button
                onClick={() => setCreateOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-5 py-3 text-sm font-semibold text-white transition shadow-lg shadow-accent-blue/25"
              >
                <Plus className="h-4 w-4" />
                Create team
              </button>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <FeatureItem
                  icon={Users}
                  label="Organize people"
                  sub="Add team members"
                />
                <FeatureItem
                  icon={FolderKanban}
                  label="Work together"
                  sub="Share projects & meetings"
                />
                <FeatureItem
                  icon={Sparkles}
                  label="Stay productive"
                  sub="Manage tasks in one place"
                />
              </div>
            </div>

            {/* Illustration */}
            <div className="hidden lg:block relative w-64 h-48 shrink-0">
              <div className="absolute inset-0">
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-accent-blue shadow-2xl shadow-accent-blue/40" />
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-accent-blue/80" />
                <div className="absolute bottom-4 left-12 w-12 h-12 rounded-full bg-accent-blue/60" />
                <div className="absolute bottom-4 right-12 w-12 h-12 rounded-full bg-accent-blue/60" />

                <div className="absolute top-0 left-4 w-10 h-10 rounded-lg bg-card border border-line shadow-lg flex items-center justify-center -rotate-6">
                  <Calendar className="w-4 h-4 text-accent-blue" />
                </div>
                <div className="absolute top-4 right-0 w-11 h-11 rounded-lg bg-card border border-line shadow-lg flex items-center justify-center rotate-12">
                  <FolderKanban className="w-5 h-5 text-accent-amber" />
                </div>
                <div className="absolute bottom-0 right-4 w-10 h-10 rounded-lg bg-card border border-line shadow-lg flex items-center justify-center -rotate-6">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ CREATE DIALOG ============ */}
      <CreateTeamDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(team) => {
          loadTeams();
          if (team?._id) navigate(`/teams/${team._id}`);
        }}
      />
    </div>
  );
}

/* ============================================================
   UNDERLINE TAB
   ============================================================ */
function UnderlineTab({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${
        active
          ? "text-accent-blue"
          : "text-fg-2 hover:text-fg"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
            active
              ? "bg-accent-blue text-white"
              : "bg-surface text-fg-3 border border-line"
          }`}
        >
          {count}
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent-blue" />
      )}
    </button>
  );
}

/* ============================================================
   FEATURE ITEM
   ============================================================ */
function FeatureItem({ icon: Icon, label, sub }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/15 shrink-0">
        <Icon className="h-4 w-4 text-accent-blue" />
      </span>
      <div>
        <p className="text-xs font-semibold text-fg">{label}</p>
        <p className="text-[10px] text-fg-3">{sub}</p>
      </div>
    </div>
  );
}

/* ============================================================
   LIST VIEW ROW
   ============================================================ */
function TeamRow({ team, currentUserId, onDelete, deleting }) {
  const memberCount = team.members?.length || 0;
  const stats = team.stats || { projects: 0, meetings: 0, tasks: 0 };
  const ownerId = team.owner?._id || team.owner;
  const isOwner = ownerId === currentUserId;

  return (
    <div className="flex items-center gap-4 p-4 sm:p-5 hover:bg-surface/50 transition">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15">
        <Users className="h-5 w-5 text-accent-blue" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a
            href={`/teams/${team._id}`}
            className="text-sm font-semibold text-fg hover:text-accent-blue transition truncate"
          >
            {team.name}
          </a>
          {isOwner && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20 shrink-0">
              <Crown className="h-2.5 w-2.5" />
              OWNER
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-fg-3 truncate">
          {team.description || "No description"} · {memberCount} member
          {memberCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="hidden md:flex items-center gap-4 text-xs text-fg-3">
        <span className="inline-flex items-center gap-1">
          <FolderKanban className="h-3.5 w-3.5" />
          {stats.projects || 0}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {stats.meetings || 0}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <AvatarGroup
          participants={team.members || []}
          extra={Math.max(0, memberCount - 4)}
          size="sm"
        />
      </div>

      <a
        href={`/teams/${team._id}`}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 px-3 py-2 text-xs font-semibold text-white transition"
      >
        View
        <ArrowRight className="h-3 w-3" />
      </a>

      {isOwner && (
        <button
          onClick={onDelete}
          disabled={deleting}
          className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-accent-rose/30 bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20 disabled:opacity-50 transition"
          title="Delete team"
        >
          {deleting ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-rose border-t-transparent" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}