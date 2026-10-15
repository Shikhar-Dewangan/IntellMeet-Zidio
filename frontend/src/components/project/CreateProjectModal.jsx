// frontend/src/components/project/CreateProjectModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Plus, Loader2, Users, Check, Crown, Search, Upload, FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { createProject } from "../../services/project.service.js";
import { getMyTeams } from "../../services/team.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";

const initialForm = {
  name: "",
  description: "",
  status: "active",
  priority: "medium",
  startDate: "",
  dueDate: "",
  repositoryUrl: "",
};

const MAX_FILES = 5;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 ? 2 : 0)} ${units[i]}`;
}

export default function CreateProjectModal({
  open,
  onClose,
  onCreated,
  currentUserId,
  isAdmin = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [teamQuery, setTeamQuery] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setSelectedTeamIds([]);
      setTeamQuery("");
      setSelectedFiles([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoadingTeams(true);
    getMyTeams()
      .then((res) => setTeams(unwrapApiList(res)))
      .catch(() => setTeams([]))
      .finally(() => setLoadingTeams(false));
  }, [open]);

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

const assignableTeams = useMemo(() => teams, [teams]);

  const visibleTeams = useMemo(() => {
    const q = teamQuery.trim().toLowerCase();
    if (!q) return assignableTeams;
    return assignableTeams.filter((t) =>
      t.name?.toLowerCase().includes(q)
    );
  }, [assignableTeams, teamQuery]);

  const selectedTeams = useMemo(
    () =>
      assignableTeams.filter((t) => selectedTeamIds.includes(t._id)),
    [assignableTeams, selectedTeamIds]
  );

  const toggleTeam = (teamId) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const removeTeam = (teamId) => {
    setSelectedTeamIds((prev) => prev.filter((id) => id !== teamId));
  };

  const handleFilesPicked = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;

    if (selectedFiles.length + picked.length > MAX_FILES) {
      toast.error(`Max ${MAX_FILES} files per project`);
      return;
    }
    for (const f of picked) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" exceeds 100 MB`);
        return;
      }
    }
    setSelectedFiles((prev) => [...prev, ...picked]);
  };

  const removeFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Project name is required");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        teamIds: selectedTeamIds,
      };
      if (form.startDate) payload.startDate = form.startDate;
      if (form.dueDate) payload.dueDate = form.dueDate;
      if (form.repositoryUrl.trim())
        payload.repositoryUrl = form.repositoryUrl.trim();
      if (selectedFiles.length > 0) payload.files = selectedFiles;

      const response = await createProject(payload);
      const project = unwrapApiData(response);
      toast.success("Project created");
      onCreated?.(project);
      onClose?.();
    } catch (error) {
      toast.error(getApiError(error, "Could not create project"));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={() => !saving && onClose?.()}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-line bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15">
              <Plus className="h-4 w-4 text-accent-blue" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Create Project</h2>
              <p className="text-xs text-fg-3">Start a new initiative</p>
            </div>
          </div>
          <button
            onClick={() => !saving && onClose?.()}
            disabled={saving}
            className="rounded-lg p-2 text-fg-3 hover:bg-surface transition disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">
              Project Name <span className="text-accent-rose">*</span>
            </label>
            <input
              autoFocus
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website Redesign"
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Brief overview of the project"
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 resize-none"
            />
          </div>

          {/* TEAMS */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-fg-2">
                Assign Teams{" "}
                <span className="text-fg-3 font-normal">(optional)</span>
              </label>
              <span className="text-[10px] text-fg-3">
                {selectedTeamIds.length} selected
              </span>
            </div>

            {selectedTeams.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTeams.map((t) => (
                  <span
                    key={t._id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-accent-blue/20 bg-accent-blue/15 px-2 py-1 text-xs font-semibold text-accent-blue"
                  >
                    <Users className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-30">{t.name}</span>
                    <button
                      type="button"
                      onClick={() => removeTeam(t._id)}
                      className="rounded-full hover:bg-accent-blue/20 p-0.5 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-line bg-surface overflow-hidden">
              <div className="p-2 border-b border-line">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-3" />
                  <input
                    type="text"
                    value={teamQuery}
                    onChange={(e) => setTeamQuery(e.target.value)}
                    placeholder="Search your teams..."
                    className="w-full rounded-lg border border-line bg-card pl-8 pr-3 py-1.5 text-xs text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto">
                {loadingTeams ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-accent-blue" />
                  </div>
                ) : assignableTeams.length === 0 ? (
                  <div className="py-6 px-4 text-center">
                    <p className="text-xs text-fg-3">
                      You don't own any teams yet.
                    </p>
                  </div>
                ) : visibleTeams.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-fg-3">No teams match</p>
                  </div>
                ) : (
                  visibleTeams.map((team) => {
                    const isSelected = selectedTeamIds.includes(team._id);
                    const isOwner =
                      (team.owner?._id || team.owner) === currentUserId;
                    return (
                      <button
                        key={team._id}
                        type="button"
                        onClick={() => toggleTeam(team._id)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-card transition border-b border-line last:border-0 text-left"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition ${
                            isSelected
                              ? "bg-accent-blue border-accent-blue"
                              : "border-fg-3"
                          }`}
                        >
                          {isSelected && (
                            <Check
                              className="h-2.5 w-2.5 text-white"
                              strokeWidth={3}
                            />
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold text-fg truncate">
                              {team.name}
                            </p>
                            {isOwner && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-bold text-amber-600 border border-amber-500/20">
                                <Crown className="h-2 w-2" />
                                OWNER
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-fg-3 truncate">
                            {team.members?.length || 0} member
                            {(team.members?.length || 0) !== 1 ? "s" : ""}
                          </p>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* FILES */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-fg-2">
                Project Files{" "}
                <span className="text-fg-3 font-normal">(optional)</span>
              </label>
              <span className="text-[10px] text-fg-3">
                {selectedFiles.length}/{MAX_FILES}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              onChange={handleFilesPicked}
            />

            <div className="rounded-xl border border-line bg-surface/50 p-3 space-y-2">
              {selectedFiles.length > 0 && (
                <div className="space-y-1.5">
                  {selectedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-2"
                    >
                      <FileText className="h-3.5 w-3.5 text-accent-blue shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-fg truncate">
                          {f.name}
                        </p>
                        <p className="text-[10px] text-fg-3">
                          {formatBytes(f.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="shrink-0 rounded-md p-1 text-fg-3 hover:bg-surface hover:text-accent-rose transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                disabled={selectedFiles.length >= MAX_FILES}
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-card hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2.5 text-xs font-semibold text-fg-2 transition"
              >
                <Upload className="h-3.5 w-3.5" />
                {selectedFiles.length >= MAX_FILES
                  ? "Max files reached"
                  : "Add files"}
              </button>
            </div>
          </div>

          {/* STATUS + PRIORITY */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fg-2 mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
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
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* DATES */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fg-2 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-fg-2 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              />
            </div>
          </div>

          {/* REPO URL */}
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">
              Repository URL
            </label>
            <input
              type="url"
              value={form.repositoryUrl}
              onChange={(e) =>
                setForm({ ...form, repositoryUrl: e.target.value })
              }
              placeholder="https://github.com/..."
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => !saving && onClose?.()}
              disabled={saving}
              className="flex-1 rounded-xl border border-line bg-card hover:bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}