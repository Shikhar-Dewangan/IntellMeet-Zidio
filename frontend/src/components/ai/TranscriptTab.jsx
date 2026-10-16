// frontend/src/components/ai/TranscriptTab.jsx
import { FileText, Loader2, User as UserIcon } from "lucide-react";

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitial(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function TranscriptTab({ transcript = [], loading = false }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
        <p className="mt-3 text-xs text-fg-3">Loading transcript...</p>
      </div>
    );
  }

  if (!Array.isArray(transcript) || transcript.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
          <FileText className="h-6 w-6 text-fg-3" />
        </div>
        <p className="text-sm font-semibold text-fg">
          No transcript available
        </p>
        <p className="mt-1 max-w-sm text-xs text-fg-3">
          Transcript will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
      {transcript.map((segment, i) => {
        const speaker = segment.speaker?.fullName || "Unknown";
        const avatar = segment.speaker?.avatar;
        return (
          <div
            key={segment._id || i}
            className="rounded-xl border border-line bg-surface/50 p-3"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center text-accent-50 text-[10px] font-bold overflow-hidden">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={speaker}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitial(speaker)
                )}
              </div>
              <p className="text-xs font-semibold text-fg-2 truncate">
                {speaker}
              </p>
              {segment.startedAt && (
                <p className="ml-auto shrink-0 text-[10px] text-fg-3">
                  {formatTime(segment.startedAt)}
                </p>
              )}
            </div>
            <p className="text-sm leading-relaxed text-fg-2">
              {segment.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}