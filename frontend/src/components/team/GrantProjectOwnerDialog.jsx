// frontend/src/components/team/GrantProjectOwnerDialog.jsx
import { useEffect, useMemo, useState } from "react";
import { X, Shield, Loader2, Check, Crown, Users } from "lucide-react";
import toast from "react-hot-toast";
import { grantTeamProjectOwner } from "../../services/team.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";
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

export default function GrantProjectOwnerDialog({
  open,
  onClose,
  team,
  onGranted,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedId(null);
    }
  }, [open]);

  // ESC + body lock
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && !saving && onClose?.();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose, saving]);

  const eligibleMembers = useMemo(() => {
    if (!team) return [];
    const ownerId = team.owner?._id || team.owner;
    const grantedIds = new Set(
      (team.projectOwners || []).map((p) => p.user?._id || p.user)
    );
    return (team.members || []).filter((m) => {
      const id = m._id || m;
      return id !== ownerId && !grantedIds.has(id);
    });
  }, [team]);

  const handleGrant = async () => {
    if (!selectedId) return toast.error("Select a member to grant");
    setSaving(true);
    try {
      const response = await grantTeamProjectOwner(team._id, selectedId);
      const record = unwrapApiData(response);
      toast.success("Project Owner authorization granted");
      onGranted?.(record);
      onClose?.();
    } catch (error) {
      toast.error(getApiError(error, "Could not grant authorization"));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={() => !saving && onClose?.()}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-2xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/15">
                <Shield className="h-5 w-5 text-accent-blue" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-fg">
                  Grant Project Owner
                </h2>
                <p className="text-xs text-fg-3">
                  Give a team member project-management rights
                </p>
              </div>
            </div>
            <button
              onClick={() => !saving && onClose?.()}
              disabled={saving}
              className="rounded-lg p-2 text-fg-3 transition hover:bg-surface hover:text-fg disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Context note (mandatory) */}
          <div className="p-4 border-b border-line">
            <ContextNote>
              Is permission se user sirf isi team ke scope mein
              project-management rights paayega.
            </ContextNote>
          </div>

          {/* Member list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {eligibleMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
                  <Users className="h-5 w-5 text-fg-3" />
                </div>
                <p className="text-sm font-medium text-fg-2">
                  No eligible members
                </p>
                <p className="mt-1 text-xs text-fg-3">
                  All members already have this authorization, or the team
                  has no other members.
                </p>
              </div>
            ) : (
              eligibleMembers.map((m) => {
                const id = m._id || m;
                const isSelected = selectedId === id;
                const avatarColor = getAvatarColor(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedId(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition border-b border-line last:border-0 text-left ${
                      isSelected ? "bg-accent-blue/10" : "hover:bg-surface/50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        isSelected
                          ? "bg-accent-blue border-accent-blue"
                          : "border-fg-3"
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </span>

                    <div
                      className={`h-10 w-10 shrink-0 rounded-full bg-linear-to-br ${avatarColor} flex items-center justify-center text-white text-sm font-bold overflow-hidden`}
                    >
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(m.fullName || "U")
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-fg truncate">
                        {m.fullName || "Member"}
                      </p>
                      <p className="text-xs text-fg-3 truncate">
                        {m.email || ""}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-line px-5 py-3 flex items-center justify-end gap-2 shrink-0 bg-surface/30">
            <button
              type="button"
              onClick={() => !saving && onClose?.()}
              disabled={saving}
              className="rounded-xl border border-line bg-card hover:bg-surface px-4 py-2 text-sm font-semibold text-fg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGrant}
              disabled={saving || !selectedId}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Granting...
                </>
              ) : (
                <>
                  <Crown className="h-3.5 w-3.5" />
                  Grant
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}