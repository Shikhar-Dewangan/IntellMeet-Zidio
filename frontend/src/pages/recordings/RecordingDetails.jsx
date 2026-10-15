import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Bot, ListTodo, Trash2, Video, Mic, Sparkles, Clock3,
  CalendarDays, User as UserIcon, CheckCircle2, Loader2, Copy,
  Pencil, Save, X, ListChecks, Download, Maximize2, PlayCircle,
} from "lucide-react";
import {
  processRecording, getRecordingById, updateRecording, deleteRecording,
} from "../../services/recording.service.js";
import { createTask } from "../../services/task.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";
import {
  EmptyState, LoadingState, SectionCard, Tabs,
} from "../../components/ui/Shared.jsx";

/* ============================================================
   HELPERS
   ============================================================ */
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m < 60) return `${m}:${String(s).padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function RecordingDetails() {
  const { recordingId } = useParams();
  const navigate = useNavigate();

  // ============ ALL HOOKS AT TOP (Rule of Hooks) ============
  const [recording, setRecording] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("summary");
  const [processing, setProcessing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [creatingTaskId, setCreatingTaskId] = useState(null);
  const [createdTasks, setCreatedTasks] = useState(new Set());
  const [copied, setCopied] = useState(false);

  // Derived values (no hooks, safe)
  const hasSummary = recording?.summary?.trim();
  const hasTranscript = recording?.transcription?.trim();
  const hasKeyPoints = recording?.keyPoints?.length > 0;
  const ownerName = recording?.recordedBy?.fullName || "Unknown";
  const duration = formatDuration(recording?.duration);

  // ✅ useMemo BEFORE any early return
  const tabs = useMemo(
    () => [
      { value: "summary", label: `Summary${hasSummary ? "" : " ⚠"}` },
      { value: "transcript", label: `Transcript${hasTranscript ? "" : " ⚠"}` },
      {
        value: "actions",
        label: `Action Items${actionItems.length ? ` (${actionItems.length})` : ""}`,
      },
    ],
    [hasSummary, hasTranscript, actionItems.length],
  );

  // ============ FETCH ============
  useEffect(() => {
    let active = true;
    const loadRecording = async () => {
      try {
        const response = await getRecordingById(recordingId);
        const data = unwrapApiData(response);
        if (!active) return;
        setRecording(data);
        setActionItems(data?.actionItems || []);
        setDraft({
          title: data?.title || "",
          description: data?.description || "",
        });
      } catch (error) {
        if (active) toast.error(getApiError(error, "Could not load recording"));
      } finally {
        if (active) setLoading(false);
      }
    };
    loadRecording();
    return () => { active = false; };
  }, [recordingId]);

  /* ============ ACTIONS ============ */
  const process = async () => {
    setProcessing(true);
    try {
      const result = unwrapApiData(await processRecording(recordingId));
      setRecording(result?.recording || result);
      setActionItems(result?.actionItems || []);
      toast.success("AI processing complete");
    } catch (error) {
      toast.error(getApiError(error, "Could not process recording"));
    } finally {
      setProcessing(false);
    }
  };

  const createActionTask = async (item) => {
    setCreatingTaskId(item._id || item.title);
    try {
      await createTask({
        title: item.title,
        description: item.description,
        project: item.project,
        meeting: item.meeting,
        actionItem: item._id,
        priority: "medium",
      });
      setCreatedTasks((s) => new Set(s).add(item._id || item.title));
      toast.success("Task created");
    } catch (error) {
      toast.error(getApiError(error, "Could not create task"));
    } finally {
      setCreatingTaskId(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await updateRecording(recordingId, {
        title: draft.title,
        description: draft.description,
      });
      setRecording(unwrapApiData(response));
      setEditing(false);
      toast.success("Recording updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not update recording"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this recording? This cannot be undone.")) return;
    try {
      await deleteRecording(recordingId);
      toast.success("Recording deleted");
      navigate("/recordings", { replace: true });
    } catch (error) {
      toast.error(getApiError(error, "Could not delete recording"));
    }
  };

  const copyTranscript = () => {
    if (!recording?.transcription) return;
    navigator.clipboard?.writeText(recording.transcription);
    setCopied(true);
    toast.success("Transcript copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadRecording = () => {
    if (!recording?.recordingUrl) return;
    const a = document.createElement("a");
    a.href = recording.recordingUrl;
    a.download = `${recording.title || "recording"}.webm`;
    a.target = "_blank";
    a.click();
  };

  /* ============ LOADING ============ */
  if (loading) return <LoadingState text="Loading recording..." />;

  /* ============ NOT FOUND ============ */
  if (!recording) {
    return (
      <div className="max-w-6xl mx-auto space-y-5">
        <Link
          to="/recordings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Recordings
        </Link>
        <SectionCard>
          <EmptyState
            icon={Video}
            title="Recording not found"
            description="This recording may have been removed or is unavailable."
            action={
              <Link
                to="/recordings"
                className="inline-flex items-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-700 px-4 py-2.5 text-sm font-semibold text-white transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Recordings
              </Link>
            }
          />
        </SectionCard>
      </div>
    );
  }

  /* ============ RENDER ============ */
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* ============ BACK ============ */}
      <Link
        to="/recordings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Recordings
      </Link>

      {/* ============ HEADER ============ */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full text-2xl font-bold bg-transparent border-b-2 border-accent-500 text-fg focus:outline-none pb-1"
                placeholder="Recording title"
              />
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={2}
                placeholder="Add description..."
                className="w-full text-sm text-fg-2 bg-transparent border-b border-line focus:border-accent-500 focus:outline-none resize-none pb-1"
              />
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraft({
                      title: recording.title || "",
                      description: recording.description || "",
                    });
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card hover:bg-surface px-3 py-1.5 text-xs font-semibold text-fg transition"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-fg wrap-break-word">
                {recording.title || "Untitled Recording"}
              </h1>
              {recording.description && (
                <p className="mt-1 text-sm text-fg-2 leading-relaxed">
                  {recording.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-3">
                <span className="inline-flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5" />
                  {recording.meeting?.title || "Meeting"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {duration}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(recording.recordedAt || recording.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" />
                  {ownerName}
                </span>
              </div>
            </>
          )}
        </div>

        {!editing && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-surface px-3.5 py-2.5 text-xs font-semibold text-fg transition"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>

            <button
              onClick={process}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-4 py-2.5 text-xs font-semibold text-white transition shadow-lg shadow-accent-600/25"
            >
              {processing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Bot className="h-3.5 w-3.5" />
                  Generate AI
                </>
              )}
            </button>

            <button
              onClick={remove}
              className="inline-flex items-center gap-1.5 rounded-xl border border-accent-rose/30 bg-accent-rose/10 hover:bg-accent-rose/20 px-3.5 py-2.5 text-xs font-semibold text-accent-rose transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* ============ PLAYER ============ */}
      <SectionCard>
        {recording.recordingUrl ? (
          <div className="relative bg-black rounded-xl overflow-hidden group">
            <video
              controls
              preload="metadata"
              playsInline
              className="aspect-video w-full bg-black"
              src={recording.recordingUrl}
            >
              Your browser does not support video playback.
            </video>

            {/* Download overlay button (top-right) */}
            <button
              onClick={downloadRecording}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur px-3 py-2 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition"
              title="Download recording"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>
        ) : (
          <div className="flex min-h-70 items-center justify-center bg-linear-to-br from-surface to-page p-8 text-center rounded-xl">
            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/15">
                <Video className="h-7 w-7 text-accent-600 dark:text-accent-400" />
              </div>
              <p className="text-sm font-medium text-fg">Recording preview unavailable</p>
              <p className="text-xs text-fg-3 max-w-xs mx-auto">
                The media file is not yet available in this environment.
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ============ TABS ============ */}
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ============ CONTENT ============ */}
      <SectionCard>
        {/* SUMMARY */}
        {tab === "summary" &&
          (hasSummary || hasKeyPoints ? (
            <div className="p-5 space-y-5">
              {hasSummary && (
                <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent-600 dark:text-accent-400">
                      AI Summary
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-fg-2 whitespace-pre-wrap">
                    {recording.summary}
                  </p>
                </div>
              )}

              {hasKeyPoints && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-3 mb-3">
                    Key Points
                  </p>
                  <ul className="space-y-2">
                    {recording.keyPoints.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-fg-2 leading-relaxed"
                      >
                        <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-accent-600" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No summary yet"
              description="Click 'Generate AI' to create a summary from the transcript."
              action={
                <button
                  onClick={process}
                  disabled={processing}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                  Generate AI Summary
                </button>
              }
            />
          ))}

        {/* TRANSCRIPT */}
        {tab === "transcript" &&
          (hasTranscript ? (
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-fg-3">
                  Full Transcript
                </p>
                <button
                  onClick={copyTranscript}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card hover:bg-surface px-2.5 py-1.5 text-xs font-medium text-fg-2 transition"
                >
                  {copied ? <CheckCircle2 className="h-3 w-3 text-accent-emerald" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="rounded-xl border border-line bg-surface/50 p-4 text-sm leading-relaxed text-fg-2 whitespace-pre-wrap max-h-150 overflow-y-auto">
                {recording.transcription}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Mic}
              title="No transcript yet"
              description="Transcript will appear here when available."
            />
          ))}

        {/* ACTION ITEMS */}
        {tab === "actions" &&
          (actionItems.length > 0 ? (
            <div className="divide-y divide-line">
              {actionItems.map((item) => {
                const key = item._id || item.title;
                const isCreated = createdTasks.has(key);
                const isCreating = creatingTaskId === key;
                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-surface/50 transition"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/15">
                      <ListChecks className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg wrap-break-word">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-fg-3 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      {item.assigneeName && (
                        <p className="mt-1 text-[11px] text-fg-3 flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          Assigned to {item.assigneeName}
                        </p>
                      )}
                    </div>
                    {isCreated ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-emerald/15 text-accent-emerald px-3 py-2 text-xs font-semibold border border-accent-emerald/20 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Task created
                      </span>
                    ) : (
                      <button
                        onClick={() => createActionTask(item)}
                        disabled={isCreating}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-3 py-2 text-xs font-semibold text-white transition shrink-0"
                      >
                        {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListTodo className="h-3.5 w-3.5" />}
                        Create Task
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={ListTodo}
              title="No action items"
              description="Process the recording to extract action items."
              action={
                <button
                  onClick={process}
                  disabled={processing}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                  Generate AI
                </button>
              }
            />
          ))}
      </SectionCard>
    </div>
  );
}