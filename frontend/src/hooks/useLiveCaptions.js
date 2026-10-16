// frontend/src/hooks/useLiveCaptions.js
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
  const seenIdsRef = useRef(new Set());

  const pushCaption = (payload) => {
    if (!payload?.text?.trim()) return;

    const speakerId = payload.speakerId || payload.speaker?._id || null;
    const speakerName =
      payload.speakerName || payload.speaker?.fullName || "Participant";
    const captionId = `${speakerId}-${payload.timestamp || Date.now()}`;

    // Dedup
    if (seenIdsRef.current.has(captionId)) return;
    seenIdsRef.current.add(captionId);

    // Keep set size bounded
    if (seenIdsRef.current.size > 200) {
      seenIdsRef.current = new Set(Array.from(seenIdsRef.current).slice(-100));
    }

    const caption = {
      id: captionId,
      speakerId,
      speakerName,
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

    if (speakerId) {
      setSpeakingUserId(speakerId);
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
      speakingTimeoutRef.current = setTimeout(() => {
        setSpeakingUserId(null);
      }, 3000);
    }
  };

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !enabled || !meetingId) return undefined;

    const handleSegment = (payload = {}) => {
      if (payload.meetingId && payload.meetingId !== meetingId) return;
      pushCaption(payload);
    };

    socket.on("transcript:segment", handleSegment);

    return () => {
      socket.off("transcript:segment", handleSegment);
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef, meetingId, maxHistory, enabled]);

  const clearCaptions = () => {
    setCaptions([]);
    setLatestCaption(null);
    setSpeakingUserId(null);
    seenIdsRef.current = new Set();
  };

  // ✅ NEW: expose `addCaption` for local fallback
  const addCaption = (payload) => pushCaption(payload);

  return {
    captions,
    latestCaption,
    speakingUserId,
    clearCaptions,
    addCaption,
  };
}