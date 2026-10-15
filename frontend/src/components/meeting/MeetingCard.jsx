import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Video,
  MoreVertical,
  Copy,
  Play,
  Square,
  Trash2,
  Eye,
} from "lucide-react";

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

const AVATAR_COLORS = [
  "bg-accent-blue",
  "bg-accent-purple",
  "bg-accent-emerald",
  "bg-accent-rose",
  "bg-accent-amber",
];

function AvatarStack({ participants = [], extra = 0, size = "md" }) {
  const sizes = {
    sm: "w-6 h-6 text-[9px]",
    md: "w-7 h-7 text-[10px]",
    lg: "w-9 h-9 text-xs",
  };
  const cls = sizes[size];
  const shown = participants.slice(0, 4);
  const AVATAR_COLORS = [
    "bg-accent-blue",
    "bg-accent-purple",
    "bg-accent-emerald",
    "bg-accent-rose",
    "bg-accent-amber",
  ];

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((p, i) => {
        const name =
          typeof p === "string"
            ? p
            : p?.fullName || p?.name || p?.email || "U";
        const initial = name[0]?.toUpperCase() || "U";
        const avatar = typeof p === "object" ? p?.avatar : null;
        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

        return (
          <div
            key={i}
            className={`${cls} ${!avatar ? color : "bg-surface"} border-2 border-card rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0`}
            title={name}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
        );
      })}
      {extra > 0 && (
        <div
          className={`${cls} bg-surface border-2 border-card rounded-full flex items-center justify-center text-fg-2 font-bold`}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso) {
  if (!iso) return "No date set";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatDateBox(iso) {
  if (!iso) return { month: "—", day: "—" };
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString([], { month: "short" }).toUpperCase(),
    day: d.getDate(),
  };
}

function getUserId(u) {
  if (!u) return null;
  if (typeof u === "string") return u;
  return u._id || u.id || null;
}

export default function MeetingCard({
  meeting = {},
  currentUserId,
  onJoin,
  onCopyLink,
  onStart,
  onEnd,
  onDelete,
}) {
  const {
    _id,
    title = "Untitled meeting",
    scheduledAt,
    status = "scheduled",
    participants = [],
    project,
    platform = "IntelliMeet",
    host,
  } = meeting;

  const hostId = getUserId(host);
  const isHost = hostId && currentUserId && hostId === currentUserId;

  const participantCount = participants.length;
  const extra = Math.max(participantCount - 4, 0);
  const dateBox = formatDateBox(scheduledAt);

  const isLive = status === "live";
  const isCompleted = status === "completed";
  const isScheduled = status === "scheduled" || status === "upcoming";
  const isCancelled = status === "cancelled";

  return (
    <div className="rounded-2xl border border-line bg-card p-4 hover:shadow-md transition sm:p-5">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-surface border border-line shrink-0">
          <span className="text-[10px] font-semibold uppercase text-fg-3">
            {dateBox.month}
          </span>
          <span className="text-lg font-bold text-fg leading-none">
            {dateBox.day}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <StatusPill status={status} />
            {isHost && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase text-accent-violet bg-accent-violet/15 border border-accent-violet/20">
                Host
              </span>
            )}
            {project && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface text-fg-2 border border-line">
                {typeof project === "string" ? project : project?.name}
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-fg truncate">
            {title}
          </h3>

          <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs text-fg-2">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(scheduledAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Video className="w-3 h-3" />
              {platform}
            </span>
            <span className="inline-flex items-center gap-1 sm:hidden">
              <Calendar className="w-3 h-3" />
              {formatDate(scheduledAt)}
            </span>
          </div>
        </div>

        {participantCount > 0 && (
          <div className="hidden md:block shrink-0">
            <AvatarStack
              participants={participants}
              extra={extra}
              size="md"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
          {isLive && (
            <button
              onClick={() => onJoin?.(meeting)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold transition shadow-lg shadow-accent-blue/25"
            >
              <Video className="w-3.5 h-3.5" />
              Join
            </button>
          )}

          {isHost && isScheduled && onStart && (
            <button
              onClick={() => onStart(meeting)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent-emerald hover:bg-accent-emerald/90 text-white text-xs font-semibold transition"
            >
              <Play className="w-3.5 h-3.5" />
              Start
            </button>
          )}

          {isHost && isLive && onEnd && (
            <button
              onClick={() => onEnd(meeting)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent-rose/15 hover:bg-accent-rose/25 text-accent-rose border border-accent-rose/20 text-xs font-semibold transition"
            >
              <Square className="w-3.5 h-3.5" />
              End
            </button>
          )}

          {isCompleted && (
            <Link
              to={`/meetings/${_id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface hover:bg-card border border-line text-fg text-xs font-semibold transition"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </Link>
          )}

          {(isScheduled || isLive) && onCopyLink && (
            <button
              onClick={() => onCopyLink(meeting)}
              className="p-2 rounded-lg hover:bg-surface text-fg-2 transition"
              title="Copy meeting link"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {isHost &&
            !isLive &&
            (isScheduled || isCompleted || isCancelled) &&
            onDelete && (
              <button
                onClick={() => onDelete(meeting)}
                className="p-2 rounded-lg bg-accent-rose/15 hover:bg-accent-rose/25 text-accent-rose border border-accent-rose/20 transition"
                title="Delete meeting"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

          <Link
            to={`/meetings/${_id}`}
            className="p-2 rounded-lg hover:bg-surface text-fg-2 transition"
            title="Details"
          >
            <MoreVertical className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}