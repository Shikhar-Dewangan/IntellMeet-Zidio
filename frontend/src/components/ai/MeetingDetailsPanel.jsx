// frontend/src/components/ai/MeetingDetailsPanel.jsx
import {
  User as UserIcon, Hash, Monitor, Users, Video, Sparkles, CheckCircle2,
  AlertTriangle, Clock,
} from "lucide-react";

function formatDuration(minutes) {
  if (!minutes || minutes < 1) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function MeetingDetailsPanel({ meeting, insight }) {
  if (!meeting) return null;

  const host = meeting.host;
  const participantCount = (meeting.participants || []).length;
  const meetingCode = meeting.meetingCode || "—";

  const durationMin =
    meeting.startedAt && meeting.endedAt
      ? Math.round(
          (new Date(meeting.endedAt) - new Date(meeting.startedAt)) /
            60000
        )
      : null;

  const insightStatus = insight?.status;
  let aiLabel = "Not generated";
  let aiColor = "text-fg-3";
  let aiIcon = AlertTriangle;

  if (insightStatus === "completed") {
    aiLabel = "Ready";
    aiColor = "text-accent-blue";
    aiIcon = CheckCircle2;
  } else if (insightStatus === "processing") {
    aiLabel = "Processing...";
    aiColor = "text-accent-blue";
    aiIcon = Sparkles;
  } else if (insightStatus === "failed") {
    aiLabel = "Failed";
    aiColor = "text-accent-blue";
    aiIcon = AlertTriangle;
  } else if (insightStatus === "unavailable") {
    aiLabel = "No transcript";
    aiColor = "text-accent-blue";
    aiIcon = AlertTriangle;
  }

  const AIIcon = aiIcon;

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="text-sm font-bold text-fg">Meeting Details</h3>

      <div className="mt-4 space-y-4">
        <DetailRow
          icon={UserIcon}
          label="Host"
          value={host?.fullName || "—"}
        />
        <DetailRow
          icon={Hash}
          label="Meeting Code"
          value={meetingCode}
          mono
        />
        <DetailRow icon={Monitor} label="Platform" value="IntelliMeet" />
        <DetailRow
          icon={Users}
          label="Participants"
          value={`${participantCount} ${
            participantCount === 1 ? "person" : "people"
          }`}
        />
        <DetailRow
          icon={Clock}
          label="Duration"
          value={durationMin ? formatDuration(durationMin) : "—"}
        />
        <DetailRow
          icon={Video}
          label="Recording"
          value={
            meeting.status === "completed" && durationMin ? (
              <span className="inline-flex items-center gap-1.5 text-accent-blue">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Available ({formatDuration(durationMin)})
              </span>
            ) : (
              "—"
            )
          }
        />
        <DetailRow
          icon={AIIcon}
          label="AI Insights"
          value={
            <span className={`inline-flex items-center gap-1.5 ${aiColor}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {aiLabel}
            </span>
          }
        />
      </div>
    </div>
  );
}

// `mono` prop is kept so the call sites stay untouched,
// but the target design uses the normal font for the meeting code.
// eslint-disable-next-line no-unused-vars
function DetailRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-fg-2">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-tight text-fg-3">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold leading-tight text-fg">
          {value}
        </p>
      </div>
    </div>
  );
}
