// frontend/src/components/meeting/MeetingControls.jsx
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, MonitorX,
  MessageSquare, Users, PhoneOff, Hand, Captions, Radio,
  MoreHorizontal, LayoutGrid, LayoutPanelTop,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function MeetingControls({
  micOn = true,
  camOn = true,
  screenSharing = false,
  handRaised = false,
  recording = false,
  captionsOn = false,
  sidePanel = null,
  layoutMode = "grid",
  isHost = false,
  onToggleMic,
  onToggleCam,
  onToggleScreen,
  onToggleHand,
  onToggleRecord,
  onToggleCaptions,
  onToggleChat,
  onToggleParticipants,
  onToggleLayout,
  onOpenHostControls,
  onLeave,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMore = (fn) => () => {
    setMoreOpen(false);
    fn?.();
  };

  return (
    <div className="relative shrink-0 border-t border-line bg-card">
      {/* ============ MORE MENU (popup) ============ */}
      {moreOpen && (
        <div
          ref={moreRef}
          className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 z-40 w-64 overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
        >
          <div className="py-1">
            <MenuItem
              icon={handRaised ? Hand : Hand}
              label={handRaised ? "Lower hand" : "Raise hand"}
              onClick={handleMore(onToggleHand)}
              active={handRaised}
            />
            <MenuItem
              icon={screenSharing ? MonitorX : MonitorUp}
              label={screenSharing ? "Stop sharing" : "Share screen"}
              onClick={handleMore(onToggleScreen)}
              active={screenSharing}
            />
            {isHost && onToggleRecord && (
              <MenuItem
                icon={Radio}
                label={recording ? "Stop recording" : "Start recording"}
                onClick={handleMore(onToggleRecord)}
                active={recording}
                danger={recording}
              />
            )}
            {onToggleLayout && (
              <MenuItem
                icon={layoutMode === "grid" ? LayoutPanelTop : LayoutGrid}
                label={
                  layoutMode === "grid"
                    ? "Switch to speaker view"
                    : "Switch to grid view"
                }
                onClick={handleMore(onToggleLayout)}
              />
            )}
            {isHost && onOpenHostControls && (
              <MenuItem
                icon={Users}
                label="Host controls"
                onClick={handleMore(onOpenHostControls)}
              />
            )}
          </div>
        </div>
      )}

      {/* ============ MAIN CONTROL BAR ============ */}
      <div className="flex items-center justify-between gap-2 px-2 py-3 sm:px-4">
        {/* LEFT spacer (hidden on mobile) */}
        <div className="hidden sm:block sm:min-w-32" />

        {/* CENTER: Main controls */}
        <div className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2.5">
          {/* Mic */}
          <ControlButton
            icon={micOn ? Mic : MicOff}
            label={micOn ? "Mute" : "Unmute"}
            active={micOn}
            danger={!micOn}
            onClick={onToggleMic}
            showLabel
          />

          {/* Camera */}
          <ControlButton
            icon={camOn ? Video : VideoOff}
            label={camOn ? "Stop Video" : "Start Video"}
            active={camOn}
            danger={!camOn}
            onClick={onToggleCam}
            showLabel
          />

          {/* Screen share */}
          <ControlButton
            icon={screenSharing ? MonitorX : MonitorUp}
            label={screenSharing ? "Stop Share" : "Share Screen"}
            active={screenSharing}
            onClick={onToggleScreen}
            showLabel
            className="hidden sm:flex"
          />

          {/* Record (host only) */}
          {isHost && onToggleRecord && (
            <ControlButton
              icon={Radio}
              label={recording ? "Stop REC" : "Record"}
              active={recording}
              danger={recording}
              onClick={onToggleRecord}
              showLabel
              className="hidden sm:flex"
            />
          )}

          {/* Captions */}
          <ControlButton
            icon={Captions}
            label={captionsOn ? "Captions On" : "Captions"}
            active={captionsOn}
            onClick={onToggleCaptions}
            showLabel
          />

          {/* Participants */}
          <ControlButton
            icon={Users}
            label="Participants"
            active={sidePanel === "participants"}
            onClick={onToggleParticipants}
            showLabel
            className="hidden sm:flex"
          />

          {/* Chat */}
          <ControlButton
            icon={MessageSquare}
            label="Chat"
            active={sidePanel === "chat"}
            onClick={onToggleChat}
            showLabel
            className="hidden sm:flex"
          />

          {/* More */}
          <ControlButton
            icon={MoreHorizontal}
            label="More"
            active={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
            showLabel
          />

          {/* Leave */}
          <button
            type="button"
            onClick={onLeave}
            className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-rose px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-accent-rose/90 sm:px-5 sm:text-sm"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        {/* RIGHT spacer (hidden on mobile) */}
        <div className="hidden sm:block sm:min-w-32" />
      </div>
    </div>
  );
}

function ControlButton({
  icon: Icon,
  label,
  active = false,
  danger = false,
  onClick,
  showLabel = false,
  className = "",
}) {
  let style;
  if (danger) {
    style = "bg-accent-rose/15 text-accent-rose hover:bg-accent-rose/25";
  } else if (active) {
    style = "bg-accent-blue text-white hover:bg-accent-blue/90 shadow-sm shadow-accent-blue/25";
  } else {
    style = "bg-surface text-fg-2 border border-line hover:bg-card";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition sm:flex-row sm:gap-1.5 sm:px-3 sm:py-2.5 ${style} ${className}`}
    >
      <Icon className="h-4 w-4 sm:h-4 sm:w-4" />
      {showLabel && (
        <span className="hidden text-[10px] font-semibold sm:inline sm:text-xs">
          {label}
        </span>
      )}
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick, active = false, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition ${
        danger
          ? "text-accent-rose hover:bg-accent-rose/10"
          : active
          ? "bg-accent-blue/10 text-accent-blue"
          : "text-fg-2 hover:bg-surface"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}