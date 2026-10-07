import { useEffect } from "react";
import toast from "react-hot-toast";
import { Copy, X, Link2, MessageCircle, Mail, Send, Hash } from "lucide-react";

export default function InviteUserDialog({ open, onClose, meetingId, meetingTitle = "Meeting", meetingCode = null }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const meetingLink = `${window.location.origin}/meetings/${meetingId}/room`;

  const copy = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Could not copy");
    }
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`Join my IntelliMeet meeting "${meetingTitle}"\n${meetingLink}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Meeting invitation: ${meetingTitle}`);
    const body = encodeURIComponent(`You're invited to join my IntelliMeet meeting.\n\nJoin: ${meetingLink}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: meetingTitle, text: `Join my meeting: ${meetingTitle}`, url: meetingLink });
        return;
      } catch {}
    } else {
      copy(meetingLink, "Meeting link copied");
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15">
                <Link2 className="h-4 w-4 text-accent-blue" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-fg">Invite to meeting</h2>
                <p className="text-xs text-fg-3">Share the link with anyone</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-fg-3 transition hover:bg-surface hover:text-fg" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-fg-3">Meeting link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={meetingLink}
                  onFocus={(e) => e.target.select()}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 font-mono text-xs text-fg-2"
                />
                <button
                  type="button"
                  onClick={() => copy(meetingLink, "Meeting link copied")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-blue px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-accent-blue/90"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
            </div>

            {meetingCode && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-fg-3">Meeting code</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={meetingCode}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 font-mono text-sm font-semibold text-fg"
                  />
                  <button
                    type="button"
                    onClick={() => copy(meetingCode, "Meeting code copied")}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2.5 text-xs font-semibold text-fg transition hover:bg-surface"
                  >
                    <Hash className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-3">Quick share</p>
              <div className="grid grid-cols-3 gap-2">
                <ShareButton icon={MessageCircle} label="WhatsApp" color="text-accent-emerald" onClick={shareWhatsApp} />
                <ShareButton icon={Mail} label="Email" color="text-accent-blue" onClick={shareEmail} />
                <ShareButton icon={Send} label="Share" color="text-accent-violet" onClick={shareNative} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ShareButton({ icon: Icon, label, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-3 text-xs font-medium text-fg-2 transition hover:bg-card"
    >
      <Icon className={`h-4 w-4 ${color}`} />
      {label}
    </button>
  );
}