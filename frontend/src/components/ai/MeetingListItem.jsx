// frontend/src/components/ai/MeetingListItem.jsx
import { Video, Clock, Sparkles, CheckCircle2 } from "lucide-react";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes) {
  if (!minutes || minutes < 1) return "";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function MeetingListItem({
  meeting,
  selected = false,
  onClick,
  aiStatus = null,
}) {
  const startedAt = meeting.startedAt || meeting.scheduledAt;
  const endedAt = meeting.endedAt;

  const durationMin =
    startedAt && endedAt
      ? Math.round((new Date(endedAt) - new Date(startedAt)) / 60000)
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition ${
        selected
          ? "border-accent-blue/40 bg-accent-blue/5"
          : "border-line bg-card hover:border-accent-blue/30 hover:bg-surface/50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-blue/15 bg-accent-blue/10 text-accent-blue">
          <Video className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-fg">
              {meeting.title || "Untitled meeting"}
            </p>

            {/* AI Badge */}
            {aiStatus === "generated" && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-accent-blue/20 bg-accent-blue/10 px-1.5 py-0.5 text-[9px] font-bold text-accent-blue">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </span>
            )}
            {aiStatus === "ready" && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-accent-blue/20 bg-accent-blue/10 px-1.5 py-0.5 text-[9px] font-bold text-accent-blue">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Ready
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-fg-3">
            <span>{formatDate(startedAt)}</span>
            {startedAt && endedAt && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {formatTime(startedAt)} - {formatTime(endedAt)}
                </span>
              </>
            )}
            {durationMin && (
              <>
                <span>·</span>
                <span>{formatDuration(durationMin)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}