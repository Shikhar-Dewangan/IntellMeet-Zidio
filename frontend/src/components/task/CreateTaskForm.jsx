// frontend/src/components/task/CreateTaskForm.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Loader2, Plus, Check, FileText, Upload, X, Users,
} from "lucide-react";

import {
  createTask,
  getEligibleTeams,
  getEligibleProjects,
  getEligibleMembers,
} from "../../services/task.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

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

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function CreateTaskForm({
  onLiveDataChange,
  onCreated,
  onCancel,
}) {
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  const [teamId, setTeamId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState([]);

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  /* ============ LOAD TEAMS ON MOUNT ============ */
  useEffect(() => {
    setLoadingTeams(true);
    getEligibleTeams()
      .then((res) => setTeams(unwrapApiList(res)))
      .catch(() => setTeams([]))
      .finally(() => setLoadingTeams(false));
  }, []);

  /* ============ TEAM CHANGE → LOAD PROJECTS + MEMBERS ============ */
  useEffect(() => {
    if (!teamId) {
      setProjects([]);
      setMembers([]);
      return;
    }

    setLoadingProjects(true);
    setLoadingMembers(true);

    getEligibleProjects(teamId)
      .then((res) => setProjects(unwrapApiList(res)))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));

    getEligibleMembers(teamId)
      .then((res) => setMembers(unwrapApiList(res)))
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));

    // Clear stale selections
    setProjectId("");
    setAssigneeId("");
  }, [teamId]);

  /* ============ LIVE DATA for sidebar ============ */
  useEffect(() => {
    const teamObj = teams.find((t) => t._id === teamId) || null;
    const projectObj = projects.find((p) => p._id === projectId) || null;
    const assigneeObj = members.find((m) => m._id === assigneeId) || null;

    onLiveDataChange?.({
      team: teamObj,
      project: projectObj,
      assignee: assigneeObj,
      priority,
      status,
      startDate,
      dueDate,
      title,
      description,
      members,
    });
  }, [
    teamId,
    projectId,
    assigneeId,
    priority,
    status,
    startDate,
    dueDate,
    title,
    description,
    teams,
    projects,
    members,
    onLiveDataChange,
  ]);

  const handleFilesPicked = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;

    if (files.length + picked.length > MAX_FILES) {
      toast.error(`Max ${MAX_FILES} files per task`);
      return;
    }
    for (const f of picked) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" exceeds 25 MB`);
        return;
      }
    }
    setFiles((prev) => [...prev, ...picked]);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Task title is required");
    if (!teamId) return toast.error("Team is required");
    if (!projectId) return toast.error("Project is required");
    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      return toast.error("Start date cannot be after due date");
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        team: teamId,
        project: projectId,
        assignee: assigneeId || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
      };
      if (files.length > 0) payload.files = files;

      const res = await createTask(payload);
      const task = unwrapApiData(res);
      toast.success("Task created");
      onCreated?.(task);
    } catch (err) {
      toast.error(getApiError(err, "Could not create task"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-line">
        <h2 className="text-sm font-semibold text-fg">Task Details</h2>
        <p className="text-xs text-fg-3 mt-0.5">
          Fill in the basic information about the task
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* TITLE */}
        <div>
          <label className="block text-xs font-semibold text-fg-2 mb-1.5">
            Task Title <span className="text-accent-rose">*</span>
          </label>
          <input
            autoFocus
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build Login API"
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-xs font-semibold text-fg-2 mb-1.5">
            Description
          </label>
          <textarea
            rows={5}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task in detail..."
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 resize-none"
          />
        </div>

        {/* TEAM + PROJECT */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">
              Team <span className="text-accent-rose">*</span>
            </label>
            <select
              required
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={loadingTeams}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 disabled:opacity-60"
            >
              <option value="">
                {loadingTeams ? "Loading teams..." : "Select team"}
              </option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-fg-3">
              Only teams you can manage are shown.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">
              Project <span className="text-accent-rose">*</span>
            </label>
            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!teamId || loadingProjects}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 disabled:opacity-60"
            >
              <option value="">
                {!teamId
                  ? "Select team first"
                  : loadingProjects
                  ? "Loading projects..."
                  : projects.length === 0
                  ? "No projects available"
                  : "Select project"}
              </option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-fg-3">
              Only projects linked to the selected team.
            </p>
          </div>
        </div>

        {/* ASSIGNEE + PRIORITY */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={!teamId || loadingMembers}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 disabled:opacity-60"
            >
              <option value="">
                {!teamId
                  ? "Select team first"
                  : loadingMembers
                  ? "Loading members..."
                  : members.length === 0
                  ? "No members available"
                  : "Unassigned"}
              </option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.fullName}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-fg-3">
              Only current members of the selected team.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* DATES */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            />
          </div>
        </div>

        {/* STATUS */}
        <div>
          <label className="block text-xs font-semibold text-fg-2 mb-1.5">
            Initial Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* ATTACHMENTS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-fg-2">
              Attachments{" "}
              <span className="text-fg-3 font-normal">(optional)</span>
            </label>
            <span className="text-[10px] text-fg-3">
              {files.length}/{MAX_FILES}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleFilesPicked}
          />

          <div className="rounded-xl border border-line bg-surface/50 p-3 space-y-2">
            {files.length > 0 && (
              <div className="space-y-1.5">
                {files.map((f, i) => (
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
              disabled={files.length >= MAX_FILES}
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-card hover:bg-surface disabled:opacity-50 px-3 py-2.5 text-xs font-semibold text-fg-2 transition"
            >
              <Upload className="h-3.5 w-3.5" />
              {files.length >= MAX_FILES ? "Max files reached" : "Add files"}
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex gap-2 px-5 py-4 border-t border-line bg-surface/30">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-xl border border-line bg-card hover:bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {saving ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  );
}