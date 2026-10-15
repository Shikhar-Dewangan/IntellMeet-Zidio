// frontend/src/components/meeting/MeetingHeader.jsx
import {
  Video, Copy, MessageSquare, Captions, Settings, Link2, Radio,
  Users, Shield, X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function MeetingHeader({
  meeting,
  participantCount = 0,
  isHost = false,
  recording = false,
  recordingSeconds = 0,
  captionsOn = false,
  sidePanel = null,
  meetingDuration = "00:00",
  onToggleChat,
  onToggleCaptions,
  onToggleParticipants,
  onOpenHostControls,
  onOpenInvite,
  onLeave,
  onToggleMobileDrawer,
}) {
  const [copied, setCopied] = useState(false);

  const meetingCode = meeting?.meetingCode || "";
  const displayCode =
    meetingCode.length > 0
      ? `${meetingCode.slice(0, 4)} ${meetingCode.slice(4, 8)}`.trim()
      : "—";

  const handleCopyCode = async () => {
    if (!meetingCode) return;
    try {
      await navigator.clipboard.writeText(meetingCode);
      setCopied(true);
      toast.success("Meeting code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const formatRec = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-card px-2 py-2 sm:px-4 sm:py-2.5">
      {/* ================= LEFT: Logo + Title + Code ================= */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Mobile: hamburger */}
        <button
          onClick={onToggleMobileDrawer}
          className="rounded-lg p-2 text-fg-2 transition hover:bg-surface lg:hidden"
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-accent-blue to-accent-violet shadow-lg shadow-accent-blue/25">
          <Video className="h-4 w-4 text-white" />
        </div>

        {/* Title + Code */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-fg sm:text-base">
              {meeting?.title || "Meeting"}
            </p>
            <button
              onClick={handleCopyCode}
              className="hidden sm:inline-flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-mono text-fg-3 transition hover:bg-card"
              title="Copy meeting code"
            >
              {copied ? "Copied!" : displayCode}
              <Copy className="h-2.5 w-2.5" />
            </button>
          </div>
          <p className="flex items-center gap-1.5 text-[10px] text-fg-3 sm:text-[11px]">
            {meetingCode && (
              <>
                <span className="sm:hidden font-mono">{displayCode}</span>
                <span className="sm:hidden">·</span>
              </>
            )}
            <span className="hidden sm:inline">Meeting Code: {displayCode}</span>
            <span className="hidden sm:inline">·</span>
            <span>{meetingDuration}</span>
          </p>
        </div>
      </div>

      {/* ================= CENTER: REC + Participants ================= */}
      <div className="flex items-center gap-2">
        {/* Recording */}
        {recording && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-accent-rose/15 px-2 py-1.5 border border-accent-rose/20">
            <span className="h-2 w-2 rounded-full bg-accent-rose animate-pulse" />
            <span className="text-[11px] font-semibold text-accent-rose whitespace-nowrap">
              <span className="hidden sm:inline">Recording </span>
              {formatRec(recordingSeconds)}
            </span>
          </div>
        )}

        {/* Participant count */}
        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5">
          <Users className="h-3.5 w-3.5 text-fg-3" />
          <span className="text-[11px] font-semibold text-fg-2">
            {participantCount}
            <span className="text-fg-3"> / 300</span>
          </span>
        </div>
      </div>

      {/* ================= RIGHT: Actions ================= */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Chat */}
        <HeaderIcon
          icon={MessageSquare}
          label="Chat"
          active={sidePanel === "chat"}
          onClick={onToggleChat}
        />

        {/* Captions */}
        <HeaderIcon
          icon={Captions}
          label="Captions"
          active={captionsOn}
          onClick={onToggleCaptions}
        />

        {/* Participants (mobile only — desktop has count) */}
        <HeaderIcon
          icon={Users}
          label="Participants"
          active={sidePanel === "participants"}
          onClick={onToggleParticipants}
          className="sm:hidden"
        />

        {/* Invite */}
        {onOpenInvite && (
          <HeaderIcon
            icon={Link2}
            label="Invite"
            onClick={onOpenInvite}
            className="hidden sm:inline-flex"
          />
        )}

        {/* Host controls */}
        {isHost && onOpenHostControls && (
          <HeaderIcon
            icon={Settings}
            label="Settings"
            onClick={onOpenHostControls}
          />
        )}

        {/* Leave */}
        <button
          onClick={onLeave}
          className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-accent-rose px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-rose/90 sm:px-4"
        >
          <X className="h-3.5 w-3.5 sm:hidden" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </header>
  );
}

function HeaderIcon({ icon: Icon, label, active = false, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${className} ${
        active
          ? "bg-accent-blue text-white"
          : "text-fg-2 hover:bg-surface"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}