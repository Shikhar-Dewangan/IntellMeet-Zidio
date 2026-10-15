import {
  Mic, MicOff, Video, VideoOff, MonitorUp, MonitorX,
  MessageSquare, Users, PhoneOff, Hand, Captions, Radio, MoreHorizontal,
} from "lucide-react";

export default function MeetingControls({
  micOn = true, camOn = true, screenSharing = false, handRaised = false,
  recording = false, captionsOn = false, sidePanel = null,
  recordingSeconds = 0, isHost = false,
  onToggleMic, onToggleCam, onToggleScreen, onToggleHand, onToggleRecord,
  onToggleCaptions, onToggleChat, onToggleParticipants,
  onOpenHostControls, onLeave,
}) {
  const formatRec = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-line bg-card px-3 py-3 sm:px-4">
      <div className="hidden items-center gap-2 md:flex md:min-w-30">
        {recording && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-accent-rose/15 px-2.5 py-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-rose animate-pulse" />
            <span className="text-[11px] font-semibold text-accent-rose">REC {formatRec(recordingSeconds)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2">
        <ControlButton active={micOn} onClick={onToggleMic} danger={!micOn} label={micOn ? "Mute" : "Unmute"}>
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </ControlButton>

        <ControlButton active={camOn} onClick={onToggleCam} danger={!camOn} label={camOn ? "Turn off camera" : "Turn on camera"}>
          {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </ControlButton>

        <ControlButton active={screenSharing} onClick={onToggleScreen} label={screenSharing ? "Stop sharing" : "Share screen"} className="hidden sm:flex">
          {screenSharing ? <MonitorX className="h-4 w-4" /> : <MonitorUp className="h-4 w-4" />}
        </ControlButton>

        <ControlButton active={handRaised} onClick={onToggleHand} label={handRaised ? "Lower hand" : "Raise hand"} className="hidden sm:flex">
          <Hand className="h-4 w-4" />
        </ControlButton>

        <ControlButton active={captionsOn} onClick={onToggleCaptions} label={captionsOn ? "Turn off captions" : "Turn on captions"}>
          <Captions className="h-4 w-4" />
        </ControlButton>

        {isHost && onToggleRecord && (
          <ControlButton active={recording} onClick={onToggleRecord} danger={recording} label={recording ? "Stop recording" : "Start recording"} className="hidden sm:flex">
            <Radio className="h-4 w-4" />
          </ControlButton>
        )}

        <ControlButton active={sidePanel === "chat"} onClick={onToggleChat} label="Chat" className="hidden sm:flex">
          <MessageSquare className="h-4 w-4" />
        </ControlButton>

        <ControlButton active={sidePanel === "participants"} onClick={onToggleParticipants} label="Participants">
          <Users className="h-4 w-4" />
        </ControlButton>

        {isHost && onOpenHostControls && (
          <ControlButton onClick={onOpenHostControls} label="Host controls" className="hidden sm:flex">
            <MoreHorizontal className="h-4 w-4" />
          </ControlButton>
        )}
      </div>

      <div className="flex items-center justify-end md:min-w-30">
        <button
          type="button"
          onClick={onLeave}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent-rose px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-accent-rose/90 sm:gap-2 sm:px-4 sm:text-sm"
          aria-label="Leave meeting"
        >
          <PhoneOff className="h-4 w-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </div>
  );
}

function ControlButton({ children, active = false, danger = false, onClick, label = "", className = "" }) {
  const base = "flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl transition";
  let style;
  if (danger) style = "bg-accent-rose/15 text-accent-rose hover:bg-accent-rose/25";
  else if (active) style = "bg-accent-blue text-white shadow-sm shadow-accent-blue/25 hover:bg-accent-blue/90";
  else style = "bg-surface text-fg hover:bg-card border border-line";

  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} aria-pressed={active} className={`${base} ${style} ${className}`}>
      {children}
    </button>
  );
}