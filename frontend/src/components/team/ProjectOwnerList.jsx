// frontend/src/components/team/ProjectOwnerList.jsx
import { Crown, Loader2, Shield, UserMinus } from "lucide-react";
import ContextNote from "./ContextNote.jsx";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectOwnerList({
  projectOwners = [],
  members = [],
  owner,
  canManage,
  onGrant,
  onRevoke,
  revokingId,
}) {
  // Members who are eligible to be granted: current members
  // who are NOT the team owner and NOT already project owners
  const grantedIds = new Set(
    projectOwners.map((p) => p.user?._id || p.user)
  );
  const ownerId = owner?._id || owner;

  const eligibleCount = members.filter((m) => {
    const id = m._id || m;
    return id !== ownerId && !grantedIds.has(id);
  }).length;

  return (
    <div className="space-y-4">
      {/* Context note (mandatory) */}
      <ContextNote>
        Ye log is team ke scope mein projects manage kar sakte hain. Inhe
        Team Owner ki full permissions nahi milti.
      </ContextNote>

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent-blue" />
            <h3 className="text-sm font-semibold text-fg">
              Project Owners ({projectOwners.length})
            </h3>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={onGrant}
              disabled={eligibleCount === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-white transition"
              title={
                eligibleCount === 0
                  ? "No eligible members to grant"
                  : "Grant Project Owner authorization"
              }
            >
              Grant
            </button>
          )}
        </div>

        {projectOwners.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
              <Shield className="h-5 w-5 text-fg-3" />
            </div>
            <p className="text-sm font-medium text-fg-2">
              No Project Owners
            </p>
            <p className="mt-1 text-xs text-fg-3 max-w-xs mx-auto">
              {canManage
                ? "Grant team members permission to manage projects for this team."
                : "Only the team owner can grant this authorization."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {projectOwners.map((record) => {
              const u = record.user || {};
              const grantedByUser = record.grantedBy || {};
              const isRevoking =
                revokingId === (u._id || record.user);
              const avatarColor = getAvatarColor(u._id || "");

              return (
                <div
                  key={record._id}
                  className="flex items-center gap-3 p-4 hover:bg-surface/50 transition"
                >
                  <div
                    className={`relative h-11 w-11 shrink-0 rounded-full bg-linear-to-br ${avatarColor} flex items-center justify-center text-white text-sm font-bold overflow-hidden`}
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
                        {u.fullName || "Unknown"}
                      </p>
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-blue border border-accent-blue/20">
                        <Shield className="h-2.5 w-2.5" />
                        PROJECT OWNER
                      </span>
                    </div>
                    <p className="text-xs text-fg-3 truncate mt-0.5">
                      {u.email || ""}
                    </p>
                    <p className="text-[10px] text-fg-3 mt-0.5">
                      Granted by {grantedByUser.fullName || "—"} ·{" "}
                      {formatDate(record.grantedAt)}
                    </p>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onRevoke(u._id || record.user)}
                      disabled={isRevoking}
                      className="shrink-0 inline-flex h-8 items-center gap-1.5 rounded-lg border border-accent-rose/30 bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20 disabled:opacity-50 transition px-2.5 text-xs font-semibold"
                      title="Revoke authorization"
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