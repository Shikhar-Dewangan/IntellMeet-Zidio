// frontend/src/components/meeting/LiveCaptionsOverlay.jsx
import { useEffect, useRef } from "react";
import { Mic, ChevronUp, Languages } from "lucide-react";
import { getLanguageShort } from "../../utils/language.js";

export default function LiveCaptionsOverlay({
  caption = null,
  onOpenPanel,
  visible = true,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 220, easing: "ease-out" }
      );
    }
  }, [caption?.id]);

  if (!visible) return null;

  if (!caption) {
    return (
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-2xl">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/75 px-3 py-2 shadow-2xl backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
          <p className="text-xs font-medium text-white/90 sm:text-sm">
            Live captions ready — waiting for someone to speak…
          </p>
        </div>
      </div>
    );
  }

  const langShort = getLanguageShort(caption.language);

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-2xl">
      <div
        ref={scrollRef}
        className="pointer-events-auto rounded-xl border border-white/10 bg-black/80 px-3 py-2.5 shadow-2xl backdrop-blur-md sm:px-4 sm:py-3"
      >
        {/* Header: speaker + language + expand */}
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-blue/25">
              <Mic className="h-3 w-3 text-accent-blue" />
            </span>
            <span className="truncate text-xs font-semibold text-white sm:text-sm">
              {caption.speakerName}
            </span>
            {langShort && (
              <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/85">
                {langShort}
              </span>
            )}
          </div>
          {onOpenPanel && (
            <button
              type="button"
              onClick={onOpenPanel}
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/85 transition hover:bg-white/20"
              title="Open all captions"
            >
              <Languages className="h-3 w-3" />
              All
              <ChevronUp className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Caption text */}
        <p className="text-sm leading-relaxed text-white sm:text-base">
          {caption.text}
        </p>
      </div>
    </div>
  );
}