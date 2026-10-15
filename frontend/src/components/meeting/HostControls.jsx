import { useEffect, useRef, useState } from "react";
import { MoreVertical, MicOff, VideoOff, PhoneOff, Copy, Link2, Shield } from "lucide-react";

export default function HostControls({
  onMuteAll, onCameraOffAll, onEndMeeting, onCopyLink, onCopyCode,
  meetingCode, isLive = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handle = (fn) => () => {
    setOpen(false);
    fn?.();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-fg transition hover:bg-card sm:h-11 sm:w-11"
        title="Host controls"
        aria-label="Host controls"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 z-50 w-60 overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-violet/15">
              <Shield className="h-4 w-4 text-accent-violet" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">Host Controls</p>
              <p className="text-[11px] text-fg-3">Manage the live meeting</p>
            </div>
          </div>

          <div className="py-1">
            <MenuAction icon={MicOff} iconClass="text-accent-amber" onClick={handle(onMuteAll)}>
              Mute all participants
            </MenuAction>
            <MenuAction icon={VideoOff} iconClass="text-accent-amber" onClick={handle(onCameraOffAll)}>
              Turn off all cameras
            </MenuAction>
            <MenuAction icon={Link2} iconClass="text-accent-blue" onClick={handle(onCopyLink)}>
              Copy meeting link
            </MenuAction>
            {meetingCode && onCopyCode && (
              <MenuAction icon={Copy} iconClass="text-accent-emerald" onClick={handle(onCopyCode)}>
                Copy meeting code
              </MenuAction>
            )}
          </div>

          {isLive && (
            <>
              <div className="border-t border-line" />
              <div className="p-1">
                <button
                  type="button"
                  onClick={handle(onEndMeeting)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-accent-rose transition hover:bg-accent-rose/10"
                >
                  <PhoneOff className="h-4 w-4" />
                  End meeting for all
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuAction({ icon: Icon, iconClass, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-surface">
      <Icon className={`h-4 w-4 ${iconClass}`} />
      {children}
    </button>
  );
}