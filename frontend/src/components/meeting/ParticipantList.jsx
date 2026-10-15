import { Mic, MicOff, Video, VideoOff, Crown, Volume2 } from "lucide-react";

export default function ParticipantList({ participants = [], speakingUserId = null, currentUserId = null }) {
  const getInitial = (p) => (p?.fullName || "U")[0]?.toUpperCase() || "U";

  if (participants.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-fg">No participants yet</p>
        <p className="mt-1 text-xs text-fg-3">Participants will appear when they join.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {participants.map((p) => {
        const isMe = p.userId === currentUserId;
        const isSpeaking = speakingUserId === p.userId;

        return (
          <li
            key={p.userId}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
              isSpeaking ? "border-accent-emerald/40 bg-accent-emerald/5" : "border-line bg-surface/50"
            }`}
          >
            <div className="relative shrink-0">
              {p.avatar ? (
                <img src={p.avatar} alt={p.fullName} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-accent-blue to-accent-purple text-xs font-bold text-white">
                  {getInitial(p)}
                </div>
              )}
              {isSpeaking && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent-emerald ring-2 ring-card">
                  <Volume2 className="h-2 w-2 text-white" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-fg">{p.fullName}</p>
                {isMe && <span className="shrink-0 text-[10px] font-semibold uppercase text-accent-blue">You</span>}
              </div>
              {p.isHost && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-accent-violet">
                  <Crown className="h-2.5 w-2.5" /> Host
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <span className={`flex h-6 w-6 items-center justify-center rounded-md ${p.isMuted ? "bg-accent-rose/15 text-accent-rose" : "bg-surface text-fg-3"}`}>
                {p.isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              </span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-md ${p.isVideoOff ? "bg-accent-rose/15 text-accent-rose" : "bg-surface text-fg-3"}`}>
                {p.isVideoOff ? <VideoOff className="h-3 w-3" /> : <Video className="h-3 w-3" />}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}