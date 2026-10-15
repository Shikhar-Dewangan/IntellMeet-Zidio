// frontend/src/hooks/useMeetingDuration.js
import { useEffect, useRef, useState } from "react";

/**
 * Tracks meeting duration in seconds since a given start time.
 * Updates every second while active.
 *
 * @param {string|Date|null} startedAt - Meeting start time
 * @param {boolean} active - Whether to tick
 * @returns {{ seconds: number, formatted: string }}
 */
export default function useMeetingDuration(startedAt, active = true) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startedAt || !active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const start = new Date(startedAt).getTime();

    const tick = () => {
      const diff = Math.floor((Date.now() - start) / 1000);
      setSeconds(diff > 0 ? diff : 0);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startedAt, active]);

  return {
    seconds,
    formatted: formatDuration(seconds),
  };
}

function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return "00:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}