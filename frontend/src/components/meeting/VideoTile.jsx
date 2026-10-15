// frontend/src/components/meeting/VideoTile.jsx
import { useEffect, useRef } from "react";
import { MicOff, VideoOff, Crown, Volume2, Pin } from "lucide-react";

export default function VideoTile({
  stream = null,
  participant = {},
  className = "",
  compact = false,
  pinned = false,
}) {
  const videoRef = useRef(null);

  const {
    fullName = "Participant",
    avatar = null,
    isHost = false,
    isLocal = false,
    isMuted = false,
    isVideoOff = false,
    isSpeaking = false,
    isPinned = false,
  } = participant;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && video.srcObject !== stream) {
      video.srcObject = stream;
      const p = video.play();
      if (p?.catch) p.catch(() => {});
    }

    if (!stream && video.srcObject) {
      video.srcObject = null;
    }
  }, [stream]);

  const initial = (fullName[0] || "U").toUpperCase();
  const hasVideo = stream && !isVideoOff && stream.getVideoTracks?.().length;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-linear-to-br from-surface to-page transition ${
        isSpeaking
          ? "border-accent-emerald ring-2 ring-accent-emerald/40"
          : "border-line"
      } ${className}`}
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          hasVideo ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* CAMERA OFF / NO STREAM PLACEHOLDER */}
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          {avatar ? (
            <img
              src={avatar}
              alt={fullName}
              className={`rounded-full object-cover ring-2 ring-line ${
                compact ? "h-10 w-10" : "h-16 w-16 sm:h-20 sm:w-20"
              }`}
            />
          ) : (
            <div
              className={`flex items-center justify-center rounded-full bg-linear-to-br from-accent-blue to-accent-violet font-bold text-white shadow-lg ${
                compact
                  ? "h-10 w-10 text-base"
                  : "h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl"
              }`}
            >
              {initial}
            </div>
          )}
        </div>
      )}

      {/* TOP-RIGHT: Video off icon */}
      {isVideoOff && (
        <div className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 backdrop-blur-sm">
          <VideoOff className="h-3 w-3 text-white" />
        </div>
      )}

      {/* TOP-RIGHT: Speaking icon */}
      {!isVideoOff && isSpeaking && !compact && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-accent-emerald shadow-lg">
          <Volume2 className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      {/* TOP-LEFT: Host badge */}
      {isHost && !compact && (
        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-accent-violet/90 px-2 py-1 backdrop-blur-sm">
          <Crown className="h-3 w-3 text-white" />
          <span className="text-[9px] font-semibold uppercase tracking-wide text-white">
            Host
          </span>
        </div>
      )}

      {/* BOTTOM: Name + mic status pill */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 backdrop-blur-sm">
          {isMuted ? (
            <MicOff className="h-3 w-3 shrink-0 text-accent-rose" />
          ) : (
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                isSpeaking
                  ? "bg-accent-emerald animate-pulse"
                  : "bg-accent-emerald/60"
              }`}
            />
          )}
          <span className="truncate text-[11px] font-medium text-white">
            {fullName}
            {isLocal && <span className="ml-1 text-white/60">(You)</span>}
          </span>
        </div>
      </div>
    </div>
  );
}