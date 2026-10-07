import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarDays,
  Pencil,
  PlayCircle,
  Trash2,
  Video,
  Clock,
  Users,
  Save,
  X,
  Sparkles,
  ExternalLink,
  Copy,
  Info,
  Share2,
  MoreVertical,
  UserPlus,
  LogOut,
  Globe,
  Mail,
  Check,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  deleteMeeting,
  endMeeting,
  getMeetingById,
  joinMeeting,
  leaveMeeting,
  startMeeting,
  updateMeeting,
  acceptMeetingInvitation,
  rejectMeetingInvitation,
} from "../../services/meeting.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";
import { LoadingState } from "../../components/ui/Shared.jsx";
import InviteParticipantsDialog from "../../components/meeting/InviteParticipantsDialog.jsx";

/* ============================================================
   STATUS BADGE
   ============================================================ */
const STATUS_CONFIG = {
  live: {
    label: "Live",
    className: "bg-accent-rose/15 text-accent-rose border-accent-rose/20",
    dot: "bg-accent-rose animate-pulse",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-accent-blue/15 text-accent-blue border-accent-blue/20",
  },
  upcoming: {
    label: "Upcoming",
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
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
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
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getUserId(u) {
  if (!u) return null;
  if (typeof u === "string") return u;
  return u._id || u.id || null;
}

function getUserDisplay(u) {
  if (!u) return { name: "Unknown", email: null, initial: "U", avatar: null };
  if (typeof u === "string")
    return { name: u, email: null, initial: u[0]?.toUpperCase() || "U", avatar: null };
  const name = u.fullName || u.name || u.email || "Unknown";
  return {
    name,
    email: u.email || null,
    initial: name[0]?.toUpperCase() || "U",
    avatar: u.avatar || null,
  };
}

/* ============================================================
   MAIN
   ============================================================ */
export default function MeetingDetails() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const currentUserId = useSelector((s) => getUserId(s.auth.user));

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [participantsTab, setParticipantsTab] = useState("participants");
  const [invitationAction, setInvitationAction] = useState(null); // "accept" | "reject" | null
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

  useEffect(() => {
    if (!moreOpen) return;
    const handler = () => setMoreOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [moreOpen]);

  /* ============ DERIVED ============ */
  const status = meeting?.status || "scheduled";
  const isScheduled = status === "scheduled" || status === "upcoming";
  const isLive = status === "live";
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";

  const hostId = getUserId(meeting?.host);
  const isHost = hostId && currentUserId && hostId === currentUserId;

  const participants = meeting?.participants || [];
  const invitedUsers = meeting?.invitedUsers || [];

  const isParticipant = participants.some(
    (p) => getUserId(p) === currentUserId,
  );

  // Current user's invitation record
  const myInvitation = invitedUsers.find(
    (inv) => getUserId(inv.user) === currentUserId,
  );
  const isPendingInvite = myInvitation?.status === "pending";
  const isRejectedInvite = myInvitation?.status === "rejected";

  const participantIds = useMemo(
    () => participants.map((p) => getUserId(p)).filter(Boolean),
    [participants],
  );
  const invitedIds = useMemo(
    () => invitedUsers.map((inv) => getUserId(inv.user)).filter(Boolean),
    [invitedUsers],
  );

  /* ============ ACTIONS ============ */
  const action = async (operation, message) => {
    try {
      const response = await operation(meetingId);
      const next = unwrapApiData(response);
      if (next) setMeeting(next);
      else await loadMeeting();
      toast.success(message);
    } catch (error) {
      toast.error(getApiError(error, "Meeting action failed"));
    }
  };

  const handleAcceptInvite = async () => {
    setInvitationAction("accept");
    try {
      const response = await acceptMeetingInvitation(meetingId);
      const next = unwrapApiData(response);
      if (next) setMeeting(next);
      else await loadMeeting();
      toast.success("Invitation accepted");
    } catch (error) {
      toast.error(getApiError(error, "Could not accept invitation"));
    } finally {
      setInvitationAction(null);
    }
  };

  const handleRejectInvite = async () => {
    if (
      !window.confirm(
        "Reject this invitation? You will not be added to the meeting.",
      )
    )
      return;
    setInvitationAction("reject");
    try {
      const response = await rejectMeetingInvitation(meetingId);
      const next = unwrapApiData(response);
      if (next) setMeeting(next);
      else await loadMeeting();
      toast.success("Invitation rejected");
    } catch (error) {
      toast.error(getApiError(error, "Could not reject invitation"));
    } finally {
      setInvitationAction(null);
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

  const cancelEdit = () => setEditing(false);

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
    if (
      !window.confirm(
        "Delete this meeting? This action cannot be undone.",
      )
    )
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

  const copyCode = () => {
    if (!meeting?.meetingCode) return;
    navigator.clipboard?.writeText(meeting.meetingCode);
    toast.success("Meeting code copied");
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/meetings/${meetingId}/room`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: meeting?.title || "IntelliMeet meeting",
          url: link,
        });
        return;
      } catch (e) {
        return;
      }
    }
    copyLink();
  };

  /* ============ LOADING ============ */
  if (loading) return <LoadingState text="Loading meeting..." />;

  /* ============ NOT FOUND ============ */
  if (!meeting) {
    return (
      <div className="space-y-5 max-w-6xl mx-auto">
        <Link
          to="/meetings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Meetings
        </Link>
        <div className="rounded-2xl border border-line bg-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
            <Video className="w-6 h-6 text-fg-3" />
          </div>
          <h3 className="text-base font-semibold text-fg">Meeting not found</h3>
          <p className="mt-1 text-sm text-fg-2">
            The meeting you are looking for is no longer available.
          </p>
          <Link
            to="/meetings"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-blue hover:bg-accent-blue/90 px-4 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-accent-blue/25"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Meetings
          </Link>
        </div>
      </div>
    );
  }

  const host = getUserDisplay(meeting.host);

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

      {/* ============ HERO ============ */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-linear-to-br from-card via-card to-page p-5 sm:p-6">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent-purple/15 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent-blue/10 blur-[80px] pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row gap-5 lg:items-start">
          <div className="flex-1 min-w-0 flex gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white shrink-0 shadow-lg shadow-accent-purple/25">
              <Video className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <StatusPill status={status} />
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-fg leading-tight">
                {meeting.title || "Untitled Meeting"}
              </h1>

              {meeting.description && (
                <p className="mt-1.5 text-sm text-fg-2 leading-relaxed max-w-2xl line-clamp-2">
                  {meeting.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm text-fg-2">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDateTime(meeting.scheduledAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Private Meeting
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm text-fg-2">
                <span className="inline-flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-linear-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                    {host.initial}
                  </span>
                  <span className="text-fg-3">Host:</span>
                  <span className="font-medium text-fg">{host.name}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
            {/* HOST actions */}
            {isHost && (
              <>
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line bg-card hover:bg-surface text-fg text-xs font-semibold transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line bg-card hover:bg-surface text-fg text-xs font-semibold transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoreOpen((v) => !v);
                    }}
                    className="p-2 rounded-xl border border-line bg-card hover:bg-surface text-fg transition"
                    aria-label="More actions"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {moreOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-2 z-30 w-52 rounded-xl border border-line bg-card shadow-xl overflow-hidden"
                    >
                      {isScheduled && (
                        <button
                          type="button"
                          onClick={() => {
                            setMoreOpen(false);
                            action(startMeeting, "Meeting started");
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-fg hover:bg-surface transition"
                        >
                          <PlayCircle className="w-4 h-4 text-accent-emerald" />
                          Start Meeting
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          copyLink();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-fg hover:bg-surface transition"
                      >
                        <Copy className="w-4 h-4 text-accent-blue" />
                        Copy Link
                      </button>

                      {meeting.meetingCode && (
                        <button
                          type="button"
                          onClick={() => {
                            setMoreOpen(false);
                            copyCode();
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-fg hover:bg-surface transition"
                        >
                          <Info className="w-4 h-4 text-accent-violet" />
                          Copy Code
                        </button>
                      )}

                      {!isLive && (
                        <>
                          <div className="border-t border-line my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setMoreOpen(false);
                              remove();
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent-rose hover:bg-accent-rose/10 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Meeting
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* HOST: End when live */}
            {isHost && isLive && (
              <button
                type="button"
                onClick={() => action(endMeeting, "Meeting ended")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-rose/15 hover:bg-accent-rose/25 text-accent-rose border border-accent-rose/20 text-xs font-semibold transition"
              >
                End Meeting
              </button>
            )}

            {/* JOIN: host when scheduled/live, OR participant when live */}
            {(isLive || (isHost && isScheduled)) && (
              <button
                type="button"
                onClick={() => action(joinMeeting, "Joined meeting")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold transition shadow-lg shadow-accent-blue/25"
              >
                <Video className="w-3.5 h-3.5" />
                Join Meeting
              </button>
            )}

            {/* PARTICIPANT: Leave */}
            {!isHost && isLive && isParticipant && (
              <button
                type="button"
                onClick={() => action(leaveMeeting, "Left meeting")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-card hover:bg-surface text-fg text-xs font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave
              </button>
            )}
          </div>
        </div>

        {/* ============ PENDING INVITATION BANNER ============ */}
        {isPendingInvite && !isHost && (
          <div className="mt-5 rounded-xl border border-accent-amber/30 bg-accent-amber/10 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Mail className="w-4 h-4 text-accent-amber shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">
                    You have been invited
                  </p>
                  <p className="mt-0.5 text-xs text-fg-2 leading-relaxed">
                    {host.name} invited you to this meeting. Accept to join as
                    a participant, or reject to decline.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAcceptInvite}
                  disabled={invitationAction !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-emerald hover:bg-accent-emerald/90 disabled:opacity-60 text-white text-xs font-semibold transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {invitationAction === "accept" ? "Accepting..." : "Accept"}
                </button>
                <button
                  type="button"
                  onClick={handleRejectInvite}
                  disabled={invitationAction !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-accent-rose/30 bg-accent-rose/10 hover:bg-accent-rose/20 disabled:opacity-60 text-accent-rose text-xs font-semibold transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {invitationAction === "reject" ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ REJECTED NOTICE ============ */}
        {isRejectedInvite && !isHost && (
          <div className="mt-5 rounded-xl border border-line bg-surface p-4">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-fg-3 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-fg">
                  Invitation rejected
                </p>
                <p className="mt-0.5 text-xs text-fg-2 leading-relaxed">
                  You have declined this meeting invitation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ MAIN GRID ============ */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Overview / Edit */}
          <div className="rounded-2xl border border-line bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-blue/15 flex items-center justify-center">
                  <Info className="w-4 h-4 text-accent-blue" />
                </div>
                <h2 className="text-base font-semibold text-fg">
                  {editing ? "Edit Meeting" : "Overview"}
                </h2>
              </div>
              {!editing && isHost && !isCompleted && !isCancelled && (
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
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
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
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-line text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition scheme-light dark:scheme-dark"
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
                      Status
                    </p>
                    <p className="mt-2 text-sm font-medium text-fg capitalize">
                      {status}
                    </p>
                  </div>
                  {meeting.meetingCode && (
                    <div className="rounded-xl bg-surface border border-line p-4 sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                        Meeting Code
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="text-sm font-mono text-fg">
                          {meeting.meetingCode}
                        </code>
                        <button
                          onClick={copyCode}
                          className="p-1.5 rounded-md hover:bg-card text-fg-3 hover:text-fg transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* People tabs */}
          <div className="rounded-2xl border border-line bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-emerald/15 flex items-center justify-center">
                  <Users className="w-4 h-4 text-accent-emerald" />
                </div>
                <h2 className="text-base font-semibold text-fg">
                  People ({participants.length})
                </h2>
              </div>

              {isHost && !isCompleted && !isCancelled && (
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 p-2 border-b border-line">
              <button
                onClick={() => setParticipantsTab("participants")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${participantsTab === "participants"
                  ? "bg-surface text-fg"
                  : "text-fg-2 hover:text-fg"
                  }`}
              >
                Participants ({participants.length})
              </button>
              <button
                onClick={() => setParticipantsTab("invited")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${participantsTab === "invited"
                  ? "bg-surface text-fg"
                  : "text-fg-2 hover:text-fg"
                  }`}
              >
                Invited ({invitedUsers.length})
              </button>
            </div>

            {participantsTab === "participants" && (
              <ul className="divide-y divide-line max-h-80 overflow-y-auto">
                {participants.length === 0 ? (
                  <li className="px-5 py-8 text-center text-sm text-fg-3">
                    No participants yet
                  </li>
                ) : (
                  participants.map((p, i) => {
                    const info = getUserDisplay(p);
                    const isCurrentUser = getUserId(p) === currentUserId;
                    const isMeetingHost = getUserId(p) === hostId;
                    return (
                      <li key={i} className="flex items-center gap-3 px-5 py-3">
                        {info.avatar ? (
                          <img
                            src={info.avatar}
                            alt={info.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {info.initial}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-fg truncate">
                            {info.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] font-semibold uppercase text-accent-blue">
                                You
                              </span>
                            )}
                          </p>
                          {info.email && (
                            <p className="text-xs text-fg-3 truncate">
                              {info.email}
                            </p>
                          )}
                        </div>
                        {isMeetingHost && (
                          <span className="text-[10px] font-semibold uppercase text-accent-violet px-2 py-0.5 rounded-md bg-accent-violet/15 border border-accent-violet/20 shrink-0">
                            Host
                          </span>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            )}

            {participantsTab === "invited" && (
              <ul className="divide-y divide-line max-h-80 overflow-y-auto">
                {invitedUsers.length === 0 ? (
                  <li className="px-5 py-8 text-center text-sm text-fg-3">
                    No invited users yet
                  </li>
                ) : (
                  invitedUsers.map((inv, i) => {
                    const info = getUserDisplay(inv.user);
                    const statusLabel = inv.status || "pending";
                    const statusClass =
                      statusLabel === "accepted"
                        ? "bg-accent-emerald/15 text-accent-emerald border-accent-emerald/20"
                        : statusLabel === "rejected"
                          ? "bg-accent-rose/15 text-accent-rose border-accent-rose/20"
                          : "bg-accent-amber/15 text-accent-amber border-accent-amber/20";
                    return (
                      <li key={i} className="flex items-center gap-3 px-5 py-3">
                        {info.avatar ? (
                          <img
                            src={info.avatar}
                            alt={info.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-accent-amber to-accent-rose flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {info.initial}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-fg truncate">
                            {info.name}
                          </p>
                          {info.email && (
                            <p className="text-xs text-fg-3 truncate">
                              {info.email}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border shrink-0 ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
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

          <div className="rounded-2xl border border-line bg-linear-to-br from-accent-purple/10 via-card to-card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white shrink-0">
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

      {/* ============ INVITE DIALOG ============ */}
      <InviteParticipantsDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        meetingId={meetingId}
        existingParticipantIds={participantIds}
        existingInvitedIds={invitedIds}
        onSuccess={loadMeeting}
      />
    </div>
  );
}