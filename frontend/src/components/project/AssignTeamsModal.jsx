// frontend/src/components/project/AssignTeamsModal.jsx
import { useEffect, useMemo, useState } from "react";
import { X, Users, Loader2, Check, Crown, Search } from "lucide-react";
import toast from "react-hot-toast";
import { updateProject } from "../../services/project.service.js";
import { getMyTeams } from "../../services/team.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";

export default function AssignTeamsModal({
  open,
  onClose,
  project,
  onUpdated,
  currentUserId,
  isAdmin = false,
}) {
  const [teams, setTeams] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  // Reset & fetch on open
  useEffect(() => {
    if (!open) return;

    setQuery("");

    // Pre-fill current project teams
    const current = (project?.teams || []).map((t) => t._id || t);
    setSelectedIds(current);

    setLoading(true);
    getMyTeams()
      .then((res) => setTeams(unwrapApiList(res)))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, [open, project]);

  // ESC close
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

  /**
   * All teams the user is a member of OR owner of.
   * Backend validates authorization on save.
   * Frontend no longer hides TPO teams.
   */
  const assignableTeams = useMemo(() => teams, [teams]);

  const visibleTeams = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignableTeams;
    return assignableTeams.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }, [assignableTeams, query]);

  const toggleTeam = (teamId) => {
    setSelectedIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await updateProject(project._id, {
        teamIds: selectedIds,
      });
      const updated = unwrapApiData(response);
      toast.success("Teams updated");
      onUpdated?.(updated);
      onClose?.();
    } catch (error) {
      toast.error(
        getApiError(
          error,
          "Could not update teams. You may not be authorized to assign some teams."
        )
      );
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
                <Users className="h-5 w-5 text-accent-blue" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-fg">
                  Assign Teams
                </h2>
                <p className="text-xs text-fg-3">
                  Select teams that will work on this project
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

          {/* Search */}
          <div className="p-4 border-b border-line shrink-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams..."
                className="w-full rounded-xl border border-line bg-surface pl-9 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-accent-blue" />
              </div>
            ) : assignableTeams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
                  <Users className="h-5 w-5 text-fg-3" />
                </div>
                <p className="text-sm font-medium text-fg-2">
                  No teams available
                </p>
                <p className="mt-1 text-xs text-fg-3">
                  You need to be a member or owner of a team to assign it.
                </p>
              </div>
            ) : visibleTeams.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-fg-2">No teams match your search</p>
              </div>
            ) : (
              visibleTeams.map((team) => {
                const isSelected = selectedIds.includes(team._id);
                const isCurrentOwner =
                  (team.owner?._id || team.owner) === currentUserId;

                return (
                  <button
                    key={team._id}
                    type="button"
                    onClick={() => toggleTeam(team._id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition border-b border-line last:border-0 text-left"
                  >
                    {/* Checkbox */}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                        isSelected
                          ? "bg-accent-blue border-accent-blue"
                          : "border-fg-3"
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </span>

                    {/* Icon */}
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
                      <Users className="h-4 w-4 text-accent-blue" />
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-fg truncate">
                          {team.name}
                        </p>
                        {isCurrentOwner && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
                            <Crown className="h-2.5 w-2.5" />
                            OWNER
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-fg-3 truncate">
                        {team.members?.length || 0} member
                        {(team.members?.length || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-line px-5 py-3 flex items-center justify-between shrink-0 bg-surface/30">
            <p className="text-xs text-fg-3">
              {selectedIds.length} team
              {selectedIds.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
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
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}