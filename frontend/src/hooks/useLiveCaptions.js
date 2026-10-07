import { useEffect, useRef, useState } from "react";

export default function useLiveCaptions({
  socketRef,
  meetingId,
  maxHistory = 50,
  enabled = true,
}) {
  const [captions, setCaptions] = useState([]);
  const [latestCaption, setLatestCaption] = useState(null);
  const [speakingUserId, setSpeakingUserId] = useState(null);
  const speakingTimeoutRef = useRef(null);
  const latestIdRef = useRef(null); // ✅ Dedup guard

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !enabled || !meetingId) return undefined;

    const handleSegment = (payload = {}) => {
      if (!payload?.text?.trim()) return;
      if (payload.meetingId && payload.meetingId !== meetingId) return;

      const captionId = `${payload.speakerId}-${payload.timestamp || Date.now()}`;

      // ✅ Dedup — same caption twice nahi
      if (latestIdRef.current === captionId) return;
      latestIdRef.current = captionId;

      const caption = {
        id: captionId,
        speakerId: payload.speakerId || null,
        speakerName: payload.speakerName || "Participant",
        text: payload.text.trim(),
        language: payload.language || null,
        timestamp: payload.timestamp || new Date().toISOString(),
        sequence: payload.sequence ?? null,
      };

      setCaptions((prev) => {
        const next = [...prev, caption];
        return next.length > maxHistory ? next.slice(-maxHistory) : next;
      });

      setLatestCaption(caption);

      if (caption.speakerId) {
        setSpeakingUserId(caption.speakerId);
        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current);
        }
        speakingTimeoutRef.current = setTimeout(() => {
          setSpeakingUserId(null);
        }, 3000);
      }
    };

    socket.on("transcript:segment", handleSegment);

    return () => {
      socket.off("transcript:segment", handleSegment);
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, [socketRef, meetingId, maxHistory, enabled]);

  const clearCaptions = () => {
    setCaptions([]);
    setLatestCaption(null);
    setSpeakingUserId(null);
    latestIdRef.current = null;
  };

  return { captions, latestCaption, speakingUserId, clearCaptions };
}