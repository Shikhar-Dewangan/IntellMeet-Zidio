import { useCallback, useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";

export default function MeetingChat({ messages = [], currentUserId = null, onSend, disabled = false }) {
  const [draft, setDraft] = useState("");
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const scrollRef = useRef(null);
  const scrollThrottleRef = useRef(0);

  // ✅ Only auto-scroll when user is at bottom
  useEffect(() => {
    if (userScrolledUp) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, userScrolledUp]);

  // ✅ Throttled scroll detection
  const handleScroll = useCallback(() => {
    const now = Date.now();
    if (now - scrollThrottleRef.current < 100) return;
    scrollThrottleRef.current = now;

    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setUserScrolledUp(distanceFromBottom > 80);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || disabled) return;
    onSend?.(text);
    setDraft("");
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const getInitial = (name) => (name || "U")[0]?.toUpperCase() || "U";

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
              <MessageSquare className="h-5 w-5 text-fg-3" />
            </div>
            <p className="text-sm font-medium text-fg">No messages yet</p>
            <p className="mt-1 text-xs text-fg-3">Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUserId;
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                {msg.avatar ? (
                  <img src={msg.avatar} alt={msg.fullName} className="h-7 w-7 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-blue to-accent-purple text-[10px] font-bold text-white">
                    {getInitial(msg.fullName)}
                  </div>
                )}
                <div className={`min-w-0 max-w-[75%] ${isMe ? "text-right" : ""}`}>
                  <div className="mb-0.5 flex items-baseline gap-1.5 text-[10px] text-fg-3">
                    <span className="font-medium text-fg-2">{isMe ? "You" : msg.fullName}</span>
                    <span>{formatTime(msg.timestamp)}</span>
                  </div>
                  <div
                    className={`inline-block rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${
                      isMe ? "bg-accent-blue text-white rounded-tr-sm" : "bg-surface text-fg-2 border border-line rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-line bg-card p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={disabled ? "Chat unavailable" : "Type a message…"}
            disabled={disabled}
            className="flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!draft.trim() || disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue text-white transition hover:bg-accent-blue/90 disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}