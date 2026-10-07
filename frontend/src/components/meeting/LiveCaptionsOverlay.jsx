import { useEffect, useRef } from "react";
import { Mic, ChevronUp } from "lucide-react";
import { getLanguageShort } from "../../utils/language.js";

export default function LiveCaptionsOverlay({ caption = null, onOpenPanel, visible = true }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 220, easing: "ease-out" },
      );
    }
  }, [caption?.id]);

  if (!visible) return null;

  if (!caption) {
    return (
      <div className="pointer-events-none absolute bottom-20 left-1/2 z-20 w-[min(92%,48rem)] -translate-x-1/2">
        <div className="pointer-events-auto mx-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-black/70 px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
          <p className="text-xs font-medium text-white/80 sm:text-sm">Live captions ready — waiting for someone to speak…</p>
        </div>
      </div>
    );
  }

  const langShort = getLanguageShort(caption.language);

  return (
    <div className="pointer-events-none absolute bottom-20 left-1/2 z-20 w-[min(92%,52rem)] -translate-x-1/2">
      <div ref={scrollRef} className="pointer-events-auto mx-auto flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/75 px-4 py-3 shadow-2xl backdrop-blur-md sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-blue/20">
              <Mic className="h-3 w-3 text-accent-blue" />
            </span>
            <span className="truncate text-xs font-semibold text-white sm:text-sm">{caption.speakerName}</span>
            {langShort && (
              <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                {langShort}
              </span>
            )}
          </div>
          {onOpenPanel && (
            <button
              type="button"
              onClick={onOpenPanel}
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80 transition hover:bg-white/20"
              title="Open full captions"
            >
              All
              <ChevronUp className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-white sm:text-base">{caption.text}</p>
      </div>
    </div>
  );
}