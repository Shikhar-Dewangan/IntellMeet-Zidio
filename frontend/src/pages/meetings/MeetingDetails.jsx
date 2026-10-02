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
import {
  EmptyState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "../../components/ui/Shared.jsx";

export default function MeetingDetails() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

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
  }, [meetingId]);

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

  const save = async () => {
    try {
      const response = await updateMeeting(meetingId, {
        title: meeting.title,
        description: meeting.description,
        scheduledAt: meeting.scheduledAt,
      });
      setMeeting(unwrapApiData(response));
      setEditing(false);
      toast.success("Meeting updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not update meeting"));
    }
  };

  const remove = async () => {
    try {
      await deleteMeeting(meetingId);
      toast.success("Meeting deleted");
      navigate("/meetings", { replace: true });
    } catch (error) {
      toast.error(getApiError(error, "Could not delete meeting"));
    }
  };

  if (loading) return <LoadingState text="Loading meeting..." />;

  if (!meeting) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Meeting"
          subtitle="This meeting could not be found."
        />
        <SectionCard>
          <EmptyState
            icon={Video}
            title="Meeting not found"
            description="The meeting you are looking for is no longer available."
            action={
              <Link
                to="/meetings"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to meetings
              </Link>
            }
          />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        to="/meetings"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:underline "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to meetings
      </Link>

      <PageHeader
        title={meeting.title || "Meeting"}
        subtitle={meeting.description || "Meeting details and schedule."}
        action={<StatusBadge status={meeting.status || "upcoming"} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Overview" icon={CalendarDays}>
          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4 ">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Date
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700 ">
                  {meeting.scheduledAt
                    ? new Date(meeting.scheduledAt).toLocaleString()
                    : "Not scheduled"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 ">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Duration
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700 ">
                  {meeting.duration || "Not set"}
                </p>
              </div>
            </div>

            {editing ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 ">
                  Title
                  <input
                    value={meeting.title || ""}
                    onChange={(event) =>
                      setMeeting({ ...meeting, title: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700 ">
                  Description
                  <textarea
                    value={meeting.description || ""}
                    onChange={(event) =>
                      setMeeting({
                        ...meeting,
                        description: event.target.value,
                      })
                    }
                    className="mt-1.5 min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
                  />
                </label>

                <button
                  type="button"
                  onClick={save}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save changes
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50    "
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>

                {meeting.status === "scheduled" && (
                  <button
                    type="button"
                    onClick={() => action(startMeeting, "Meeting started")}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Start
                  </button>
                )}

                {meeting.status === "live" && (
                  <>
                    <button
                      type="button"
                      onClick={() => action(joinMeeting, "Joined meeting")}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Video className="h-4 w-4" />
                      Join room
                    </button>
                    <button
                      type="button"
                      onClick={() => action(endMeeting, "Meeting ended")}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100   "
                    >
                      End meeting
                    </button>
                  </>
                )}

                {meeting.status !== "live" &&
                  meeting.status !== "completed" && (
                    <button
                      type="button"
                      onClick={remove}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100   "
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Quick actions" icon={CheckCircle2}>
          <div className="space-y-3 p-5">
            <Link
              to={`/meetings/${meetingId}/room`}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100    "
            >
              <span>Open room</span>
              <Video className="h-4 w-4 text-blue-600 " />
            </Link>
            <Link
              to="/meetings"
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100    "
            >
              <span>All meetings</span>
              <ArrowLeft className="h-4 w-4 text-blue-600 " />
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
