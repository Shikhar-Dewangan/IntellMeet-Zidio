import { useEffect, useRef } from "react";
import { MicOff, VideoOff, Crown, Volume2 } from "lucide-react";

export default function VideoTile({ stream = null, participant = {}, className = "" }) {
  const videoRef = useRef(null);

  const {
    fullName = "Participant",
    avatar = null,
    isHost = false,
    isLocal = false,
    isMuted = false,
    isVideoOff = false,
    isSpeaking = false,
  } = participant;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && video.srcObject !== stream) {
      video.srcObject = stream;
      // ✅ Safe play — handle autoplay block gracefully
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
      className={`relative overflow-hidden rounded-2xl border bg-linear-to-br from-surface to-page transition ${
        isSpeaking ? "border-accent-emerald/60 ring-2 ring-accent-emerald/30" : "border-line"
      } ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          hasVideo ? "opacity-100" : "opacity-0"
        }`}
      />

      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt={fullName} className="h-20 w-20 rounded-full object-cover ring-2 ring-line sm:h-24 sm:w-24" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-accent-blue to-accent-purple text-2xl font-bold text-white shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
              {initial}
            </div>
          )}
        </div>
      )}

      {isVideoOff && (
        <div className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 backdrop-blur-sm">
          <VideoOff className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      {!isVideoOff && isSpeaking && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-accent-emerald shadow-lg">
          <Volume2 className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
        <div className="inline-flex max-w-[70%] items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-sm">
          {isMuted ? (
            <MicOff className="h-3 w-3 shrink-0 text-accent-rose" />
          ) : (
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isSpeaking ? "animate-pulse bg-accent-emerald" : "bg-accent-emerald/60"}`} />
          )}
          <span className="truncate text-[11px] font-medium text-white">
            {fullName}
            {isLocal && <span className="ml-1 text-white/60">(You)</span>}
          </span>
        </div>

        {isHost && (
          <div className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-accent-violet/90 px-2 py-1 backdrop-blur-sm">
            <Crown className="h-3 w-3 text-white" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white">Host</span>
          </div>
        )}
      </div>
    </div>
  );
}