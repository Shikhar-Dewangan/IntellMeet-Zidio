// frontend/src/components/meeting/ParticipantStrip.jsx
import { Plus } from "lucide-react";

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const COLORS = [
  "from-accent-rose to-accent-rose/60",
  "from-accent-violet to-accent-violet/60",
  "from-accent-blue to-accent-blue/60",
  "from-accent-emerald to-accent-emerald/60",
  "from-amber-500 to-amber-500/60",
];

function getColor(id = "") {
  const hash = id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

export default function ParticipantStrip({
  participants = [],
  currentUserId,
  onOpenParticipants,
  max = 8,
}) {
  if (participants.length === 0) return null;

  const visible = participants.slice(0, max);
  const extra = Math.max(0, participants.length - max);

  return (
    <div className="border-b border-line bg-surface/50 px-3 py-2.5">
      <div className="flex items-center gap-2 overflow-x-auto">
        {visible.map((p) => {
          const isMe = p.userId === currentUserId;
          const initial = getInitials(p.fullName || "U");
          return (
            <div
              key={p.userId}
              className="flex shrink-0 flex-col items-center gap-1"
              title={p.fullName}
            >
              <div className="relative">
                {p.avatar ? (
                  <img
                    src={p.avatar}
                    alt={p.fullName}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-card"
                  />
                ) : (
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br ${getColor(
                      p.userId
                    )} text-[10px] font-bold text-white ring-2 ring-card`}
                  >
                    {initial}
                  </div>
                )}
                {isMe && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent-emerald ring-2 ring-card" />
                )}
              </div>
              <span className="max-w-14 truncate text-[9px] font-medium text-fg-3">
                {isMe ? "You" : p.fullName?.split(" ")[0] || "User"}
              </span>
            </div>
          );
        })}

        {extra > 0 && (
          <button
            onClick={onOpenParticipants}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-line text-[10px] font-bold text-fg-2">
              +{extra}
            </div>
            <span className="text-[9px] font-medium text-fg-3">more</span>
          </button>
        )}
      </div>
    </div>
  );
}