import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, Radio, ArrowDown, Trash2, X, Languages } from "lucide-react";
import { getLanguageLabel, getLanguageShort, formatRelativeTime } from "../../utils/language.js";

export default function LiveCaptionsPanel({ captions = [], onClose, onClear, isLive = false, className = "" }) {
  const scrollRef = useRef(null);
  const scrollThrottleRef = useRef(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showAutoScrollButton, setShowAutoScrollButton] = useState(false);

  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [captions.length, autoScroll]);

  // ✅ Throttled scroll handler (100ms) — saves CPU on rapid scroll
  const handleScroll = useCallback(() => {
    const now = Date.now();
    if (now - scrollThrottleRef.current < 100) return;
    scrollThrottleRef.current = now;

    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 60;

    setAutoScroll((prev) => {
      if (nearBottom && !prev) return true;
      if (!nearBottom && prev) return false;
      return prev;
    });

    setShowAutoScrollButton(!nearBottom);
  }, []);

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setAutoScroll(true);
    setShowAutoScrollButton(false);
  };

  const visibleCaptions = useMemo(() => captions.slice(-40), [captions]);

  return (
    <div className={`flex h-full flex-col bg-card ${className}`}>
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue/15">
            <Mic className="h-4 w-4 text-accent-blue" />
          </div>
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-fg truncate">
              Live Captions
              {isLive && (
                <span className="inline-flex items-center gap-1 rounded-md bg-accent-rose/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-rose">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-rose animate-pulse" />
                  Live
                </span>
              )}
            </h3>
            <p className="text-[11px] text-fg-3">{captions.length} segment{captions.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {captions.length > 0 && (
            <button type="button" onClick={onClear} className="rounded-lg p-2 text-fg-3 transition hover:bg-surface hover:text-fg" title="Clear captions">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-fg-3 transition hover:bg-surface hover:text-fg" title="Close">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-3 py-3 space-y-2">
          {visibleCaptions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
                <Radio className="h-5 w-5 text-fg-3" />
              </div>
              <p className="text-sm font-medium text-fg">No captions yet</p>
              <p className="mt-1 max-w-xs text-xs text-fg-3 leading-relaxed">
                Captions will appear here in real-time as participants speak.
              </p>
            </div>
          ) : (
            visibleCaptions.map((caption, index) => {
              const isLatest = index === visibleCaptions.length - 1;
              const langLabel = getLanguageLabel(caption.language);
              const langShort = getLanguageShort(caption.language);

              return (
                <div
                  key={caption.id}
                  className={`rounded-xl border px-3 py-2.5 transition ${
                    isLatest ? "border-accent-blue/30 bg-accent-blue/5" : "border-line bg-surface/50"
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-blue/15">
                        <Mic className="h-2.5 w-2.5 text-accent-blue" />
                      </span>
                      <span className="truncate text-xs font-semibold text-fg">{caption.speakerName}</span>
                      {langLabel && (
                        <span className="shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-medium text-fg-2" title={langLabel}>
                          {langShort}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-fg-3">{formatRelativeTime(caption.timestamp)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-fg-2">{caption.text}</p>
                </div>
              );
            })
          )}
        </div>

        {showAutoScrollButton && (
          <button
            type="button"
            onClick={jumpToBottom}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-fg shadow-lg transition hover:bg-surface"
          >
            <ArrowDown className="h-3 w-3" />
            New captions
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-line px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-fg-3">
          <Languages className="h-3 w-3" />
          <span>Auto language detection</span>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide text-fg-3">
          {autoScroll ? "Auto-scroll on" : "Paused"}
        </span>
      </div>
    </div>
  );
}