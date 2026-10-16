// frontend/src/components/task/TaskOwnersPanel.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Shield, Loader2, UserPlus, UserMinus, Crown, Search, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  listTaskOwners,
  grantTaskOwner,
  revokeTaskOwner,
} from "../../services/task.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "from-accent-400 to-accent-700",
  "from-accent-500 to-accent-900",
  "from-accent-200 to-accent-600",
  "from-accent-400 to-accent-900",
  "from-accent-500 to-accent-700",
];

function getAvatarColor(id = "") {
  const hash = id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function TaskOwnersPanel({
  teams = [],
  currentUserId,
  isAdmin = false,
}) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [grantQuery, setGrantQuery] = useState("");
  const [showGrantPicker, setShowGrantPicker] = useState(false);

  // Auto-select first team
  useEffect(() => {
    if (!selectedTeamId && teams.length > 0) {
      setSelectedTeamId(teams[0]._id);
    }
  }, [teams, selectedTeamId]);

  // Load task owners when team changes
  useEffect(() => {
    if (!selectedTeamId) return;
    setLoading(true);
    listTaskOwners(selectedTeamId)
      .then((res) => setOwners(unwrapApiList(res)))
      .catch((err) => {
        toast.error(getApiError(err, "Could not load task owners"));
        setOwners([]);
      })
      .finally(() => setLoading(false));
  }, [selectedTeamId]);

  const selectedTeam = useMemo(
    () => teams.find((t) => t._id === selectedTeamId),
    [teams, selectedTeamId]
  );

  const isTeamOwner = useMemo(() => {
    if (!selectedTeam || !currentUserId) return false;
    return (selectedTeam.owner?._id || selectedTeam.owner) === currentUserId;
  }, [selectedTeam, currentUserId]);

  const canManage = isTeamOwner || isAdmin;

  // Eligible members: current team members who are not already task owners
  const eligibleMembers = useMemo(() => {
    if (!selectedTeam) return [];
    const grantedIds = new Set(
      owners.map((o) => o.user?._id || o.user)
    );
    const ownerId = selectedTeam.owner?._id || selectedTeam.owner;

    return (selectedTeam.members || []).filter((m) => {
      const id = m._id || m;
      return id !== ownerId && !grantedIds.has(id);
    });
  }, [selectedTeam, owners]);

  const visibleEligible = useMemo(() => {
    const q = grantQuery.trim().toLowerCase();
    if (!q) return eligibleMembers;
    return eligibleMembers.filter(
      (m) =>
        m.fullName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [eligibleMembers, grantQuery]);

  const handleGrant = async (userId) => {
    setGranting(true);
    try {
      const res = await grantTaskOwner(selectedTeamId, userId);
      const record = unwrapApiData(res);
      setOwners((prev) => [record, ...prev]);
      toast.success("Task Owner authorization granted");
      setShowGrantPicker(false);
      setGrantQuery("");
    } catch (err) {
      toast.error(getApiError(err, "Could not grant authorization"));
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (userId, fullName) => {
    if (
      !window.confirm(
        `Revoke Task Owner authorization from ${fullName}?\n\n` +
          `They will no longer be able to manage tasks for this team.`
      )
    )
      return;

    setRevokingId(userId);
    try {
      await revokeTaskOwner(selectedTeamId, userId);
      setOwners((prev) =>
        prev.filter((o) => (o.user?._id || o.user) !== userId)
      );
      toast.success("Authorization revoked");
    } catch (err) {
      toast.error(getApiError(err, "Could not revoke authorization"));
    } finally {
      setRevokingId(null);
    }
  };

  if (teams.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-card p-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
          <Shield className="h-5 w-5 text-fg-3" />
        </div>
        <p className="text-sm font-medium text-fg-2">
          No teams available
        </p>
        <p className="mt-1 text-xs text-fg-3">
          You need to own or manage a team to grant Task Owner authorization.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Team Selector */}
      <div className="rounded-2xl border border-line bg-card p-4">
        <label className="block text-xs font-semibold text-fg-2 mb-2">
          Select Team
        </label>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
        >
          {teams.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grant section — visible only to team owner/admin */}
      {canManage && (
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-accent-blue" />
              <h3 className="text-sm font-semibold text-fg">
                Grant Task Owner
              </h3>
            </div>
            <button
              onClick={() => setShowGrantPicker(!showGrantPicker)}
              className="text-xs font-semibold text-accent-blue hover:underline"
            >
              {showGrantPicker ? "Hide" : "Add"}
            </button>
          </div>

          {showGrantPicker && (
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
                <input
                  value={grantQuery}
                  onChange={(e) => setGrantQuery(e.target.value)}
                  placeholder="Search team members..."
                  className="w-full rounded-xl border border-line bg-surface pl-9 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none"
                />
              </div>

              {eligibleMembers.length === 0 ? (
                <p className="text-xs text-fg-3 text-center py-3">
                  All eligible members already have Task Owner access.
                </p>
              ) : visibleEligible.length === 0 ? (
                <p className="text-xs text-fg-3 text-center py-3">
                  No members match your search.
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {visibleEligible.map((m) => {
                    const id = m._id || m;
                    const busy = granting;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-3 rounded-lg border border-line bg-surface/50 p-2 hover:bg-surface transition"
                      >
                        <div
                          className={`h-9 w-9 rounded-full bg-linear-to-br ${getAvatarColor(id)} flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0`}
                        >
                          {m.avatar ? (
                            <img src={m.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            getInitials(m.fullName)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-fg truncate">
                            {m.fullName}
                          </p>
                          <p className="text-[10px] text-fg-3 truncate">
                            {m.email}
                          </p>
                        </div>
                        <button
                          onClick={() => handleGrant(id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-lg bg-accent-blue hover:bg-accent-700 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition shrink-0"
                        >
                          {busy ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserPlus className="h-3 w-3" />
                          )}
                          Grant
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Current task owners list */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent-blue" />
            <h3 className="text-sm font-semibold text-fg">
              Task Owners ({owners.length})
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-accent-blue" />
          </div>
        ) : owners.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
              <Shield className="h-5 w-5 text-fg-3" />
            </div>
            <p className="text-sm font-medium text-fg-2">No Task Owners</p>
            <p className="mt-1 text-xs text-fg-3 max-w-xs mx-auto">
              {canManage
                ? "Grant team members permission to manage tasks for this team."
                : "Only the team owner can grant this authorization."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {owners.map((owner) => {
              const u = owner.user || {};
              const grantedBy = owner.grantedBy || {};
              const id = u._id;
              const isRevoking = revokingId === id;

              return (
                <div
                  key={owner._id}
                  className="flex items-center gap-3 p-4 hover:bg-surface/30 transition"
                >
                  <div
                    className={`h-11 w-11 shrink-0 rounded-full bg-linear-to-br ${getAvatarColor(id || "")} flex items-center justify-center text-white text-sm font-bold overflow-hidden`}
                  >
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      getInitials(u.fullName || "U")
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-fg truncate">
                        {u.fullName}
                      </p>
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-blue border border-accent-blue/20">
                        <Shield className="h-2.5 w-2.5" />
                        TASK OWNER
                      </span>
                    </div>
                    <p className="text-xs text-fg-3 truncate mt-0.5">
                      {u.email}
                    </p>
                    {grantedBy.fullName && (
                      <p className="text-[10px] text-fg-3 mt-0.5">
                        Granted by {grantedBy.fullName} ·{" "}
                        {owner.grantedAt
                          ? new Date(owner.grantedAt).toLocaleDateString()
                          : "—"}
                      </p>
                    )}
                  </div>

                  {canManage && (
                    <button
                      onClick={() => handleRevoke(id, u.fullName)}
                      disabled={isRevoking}
                      className="shrink-0 inline-flex h-8 items-center gap-1.5 rounded-lg border border-accent-rose/30 bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20 disabled:opacity-50 transition px-2.5 text-xs font-semibold"
                    >
                      {isRevoking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="h-3.5 w-3.5" />
                      )}
                      Revoke
                    </button>
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