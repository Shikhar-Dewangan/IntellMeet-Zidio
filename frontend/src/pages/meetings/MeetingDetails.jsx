import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Pencil,
  PlayCircle,
  Trash2,
  Video,
  Clock,
  Users,
  Save,
  X,
  Hash,
  Sparkles,
  FileText,
  ExternalLink,
  Copy,
  Info,
} from "lucide-react";

import {
  deleteMeeting,
  endMeeting,
  getMeetingById,
  joinMeeting,
  startMeeting,
  updateMeeting,
} from "../../services/meeting.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";
import {LoadingState, EmptyState} from "../../components/ui/Shared.jsx";

/* ============================================================
   STATUS BADGE (inline)
   ============================================================ */
const STATUS_CONFIG = {
  live: {
    label: "Live",
    className: "bg-accent-rose/15 text-accent-rose border-accent-rose/20",
    dot: "bg-accent-rose animate-pulse",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-accent-blue/15 text-accent-blue border-accent-blue/20",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-accent-blue/15 text-accent-blue border-accent-blue/20",
  },
  completed: {
    label: "Completed",
    className:
      "bg-accent-emerald/15 text-accent-emerald border-accent-emerald/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-surface text-fg-3 border-line",
  },
};

function StatusPill({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${config.className}`}
    >
      {config.dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      {config.label}
    </span>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */
function formatDateTime(iso) {
  if (!iso) return "Not scheduled";
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(minutes) {
  if (!minutes) return "Not set";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/* ============================================================
   MAIN
   ============================================================ */
export default function MeetingDetails() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    scheduledAt: "",
  });

  const loadMeeting = async () => {
    try {
      const response = await getMeetingById(meetingId);
      setMeeting(unwrapApiData(response));
    } catch (error) {
      toast.error(getApiError(error, "Could not load meeting"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  /* ============ ACTIONS ============ */
  const action = async (operation, message) => {
    try {
      const response = await operation(meetingId);
      const next = unwrapApiData(response);
      if (next) setMeeting(next);
      toast.success(message);
    } catch (error) {
      toast.error(getApiError(error, "Meeting action failed"));
    }
  };

  const startEdit = () => {
    setEditForm({
      title: meeting?.title || "",
      description: meeting?.description || "",
      scheduledAt: meeting?.scheduledAt
        ? new Date(meeting.scheduledAt).toISOString().slice(0, 16)
        : "",
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm({ title: "", description: "", scheduledAt: "" });
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await updateMeeting(meetingId, editForm);
      setMeeting(unwrapApiData(response));
      setEditing(false);
      toast.success("Meeting updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not update meeting"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this meeting? This action cannot be undone."))
      return;
    try {
      await deleteMeeting(meetingId);
      toast.success("Meeting deleted");
      navigate("/meetings", { replace: true });
    } catch (error) {
      toast.error(getApiError(error, "Could not delete meeting"));
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/meetings/${meetingId}/room`;
    navigator.clipboard?.writeText(link);
    toast.success("Meeting link copied");
  };

  /* ============ LOADING ============ */
  if (loading) return <LoadingState text="Loading meeting..." />;

  /* ============ NOT FOUND ============ */
  if (!meeting) {
    return (
      <div className="space-y-5">
        <Link
          to="/meetings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Meetings
        </Link>
        <div className="rounded-2xl border border-line bg-card">
          <EmptyState
            icon={Video}
            title="Meeting not found"
            description="The meeting you are looking for is no longer available."
            action={
              <Link
                to="/meetings"
                className="inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-4 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-accent-blue/25"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Meetings
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const status = meeting.status || "upcoming";
  const isScheduled = status === "scheduled" || status === "upcoming";
  const isLive = status === "live";
  const isCompleted = status === "completed";

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* ============ BACK ============ */}
      <Link
        to="/meetings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Meetings
      </Link>

      {/* ============ HEADER ============ */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-card via-card to-page p-6 sm:p-8">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent-purple/15 blur-[80px] pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <StatusPill status={status} />
            {meeting.project && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface text-fg-2 border border-line">
                {typeof meeting.project === "string"
                  ? meeting.project
                  : meeting.project?.name}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-fg leading-tight">
            {meeting.title || "Untitled Meeting"}
          </h1>

          {meeting.description && (
            <p className="mt-2 text-sm sm:text-base text-fg-2 leading-relaxed max-w-2xl">
              {meeting.description}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-2">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {formatDateTime(meeting.scheduledAt)}
            </span>
            {meeting.duration && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDuration(meeting.duration)}
              </span>
            )}
            {meeting.participants?.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {meeting.participants.length} participants
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============ MAIN GRID ============ */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* ============ LEFT: Overview ============ */}
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/15 flex items-center justify-center">
                <Info className="w-4 h-4 text-accent-blue" />
              </div>
              <h2 className="text-base font-semibold text-fg">Overview</h2>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-fg-2 hover:bg-surface transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>

          <div className="p-5 space-y-5">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-fg mb-1.5">
                    Title
                  </label>
                  <input
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-line text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-line text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg mb-1.5">
                    Scheduled At
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.scheduledAt}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        scheduledAt: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-line text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-60 text-white text-sm font-semibold transition shadow-lg shadow-accent-blue/25"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-card hover:bg-surface text-fg text-sm font-semibold transition"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Info tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-surface border border-line p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                      Scheduled
                    </p>
                    <p className="mt-2 text-sm font-medium text-fg">
                      {formatDateTime(meeting.scheduledAt)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface border border-line p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                      Duration
                    </p>
                    <p className="mt-2 text-sm font-medium text-fg">
                      {formatDuration(meeting.duration)}
                    </p>
                  </div>
                  {meeting.code && (
                    <div className="rounded-xl bg-surface border border-line p-4 sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                        Meeting Code
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="text-sm font-mono text-fg">
                          {meeting.code}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(meeting.code);
                            toast.success("Code copied");
                          }}
                          className="p-1.5 rounded-md hover:bg-card text-fg-3 hover:text-fg transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {isScheduled && (
                    <button
                      type="button"
                      onClick={() => action(startMeeting, "Meeting started")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-semibold transition shadow-lg shadow-accent-blue/25"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Start Meeting
                    </button>
                  )}

                  {isLive && (
                    <>
                      <button
                        type="button"
                        onClick={() => action(joinMeeting, "Joined meeting")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-semibold transition shadow-lg shadow-accent-blue/25"
                      >
                        <Video className="w-4 h-4" />
                        Join Room
                      </button>
                      <button
                        type="button"
                        onClick={() => action(endMeeting, "Meeting ended")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-rose/15 hover:bg-accent-rose/25 text-accent-rose border border-accent-rose/20 text-sm font-semibold transition"
                      >
                        End Meeting
                      </button>
                    </>
                  )}

                  {!isLive && !isCompleted && (
                    <button
                      type="button"
                      onClick={remove}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-rose/15 hover:bg-accent-rose/25 text-accent-rose border border-accent-rose/20 text-sm font-semibold transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ============ RIGHT: Quick Actions + Participants ============ */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="rounded-2xl border border-line bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-line">
              <div className="w-8 h-8 rounded-lg bg-accent-purple/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent-purple" />
              </div>
              <h2 className="text-base font-semibold text-fg">
                Quick Actions
              </h2>
            </div>

            <div className="p-4 space-y-2">
              <Link
                to={`/meetings/${meetingId}/room`}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-surface border border-line text-sm font-medium text-fg hover:bg-card transition group"
              >
                <span className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-accent-blue" />
                  Open Room
                </span>
                <ExternalLink className="w-4 h-4 text-fg-3 group-hover:text-fg transition" />
              </Link>

              <button
                type="button"
                onClick={copyLink}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-surface border border-line text-sm font-medium text-fg hover:bg-card transition group"
              >
                <span className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-accent-emerald" />
                  Copy Link
                </span>
                <ExternalLink className="w-4 h-4 text-fg-3 group-hover:text-fg transition" />
              </button>

              <Link
                to="/meetings"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-surface border border-line text-sm font-medium text-fg hover:bg-card transition group"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 text-accent-amber" />
                  All Meetings
                </span>
                <ExternalLink className="w-4 h-4 text-fg-3 group-hover:text-fg transition" />
              </Link>
            </div>
          </div>

          {/* Participants */}
          {meeting.participants?.length > 0 && (
            <div className="rounded-2xl border border-line bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-line">
                <div className="w-8 h-8 rounded-lg bg-accent-emerald/15 flex items-center justify-center">
                  <Users className="w-4 h-4 text-accent-emerald" />
                </div>
                <h2 className="text-base font-semibold text-fg">
                  Participants ({meeting.participants.length})
                </h2>
              </div>

              <ul className="divide-y divide-line max-h-72 overflow-y-auto">
                {meeting.participants.map((p, i) => {
                  const name =
                    typeof p === "string"
                      ? p
                      : p?.name || p?.fullName || "Unknown";
                  const email = typeof p === "object" ? p?.email : null;
                  return (
                    <li key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {name[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fg truncate">
                          {name}
                        </p>
                        {email && (
                          <p className="text-xs text-fg-3 truncate">{email}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* AI Note */}
          <div className="rounded-2xl border border-line bg-gradient-to-br from-accent-purple/10 via-card to-card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">
                  AI-powered insights
                </p>
                <p className="mt-1 text-xs text-fg-2 leading-relaxed">
                  Transcripts, summaries, and action items will be generated
                  automatically after the meeting ends.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}