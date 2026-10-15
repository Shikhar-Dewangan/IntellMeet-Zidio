import { useCallback, useEffect, useRef } from "react";
import { uploadTranscriptChunk } from "../services/liveTranscription.service.js";

const CHUNK_INTERVAL = 15000;
const MAX_UPLOAD_RETRIES = 2;

const useMeetingTranscription = ({
  meetingId,
  stream,
  enabled = true,
  onTranscript,
}) => {
  const recorderRef = useRef(null);
  const sequenceRef = useRef(0);
  const intervalRef = useRef(null);
  const uploadingRef = useRef(false); // ✅ Prevent overlapping uploads

  const start = useCallback(() => {
    if (!enabled || !stream) return;
    if (recorderRef.current?.state === "recording") return;

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return;

    const audioStream = new MediaStream(audioTracks);

    let recorder;
    try {
      recorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
    } catch (err) {
      console.error("MediaRecorder init failed:", err);
      return;
    }

    recorderRef.current = recorder;

    recorder.ondataavailable = async (event) => {
      if (!event.data || event.data.size === 0) return;

      // ✅ Skip if already uploading (prevent backlog)
      if (uploadingRef.current) {
        console.warn("[Transcription] Skipping chunk — previous upload in progress");
        return;
      }

      const seq = sequenceRef.current;
      sequenceRef.current += 1;
      uploadingRef.current = true;

      let attempt = 0;
      let success = false;

      while (attempt <= MAX_UPLOAD_RETRIES && !success) {
        try {
          const result = await uploadTranscriptChunk(meetingId, event.data, seq);
          const segment = result?.data?.data ?? result?.data ?? result;
          if (segment && onTranscript) onTranscript(segment);
          success = true;
        } catch (error) {
          attempt++;
          if (attempt > MAX_UPLOAD_RETRIES) {
            console.error("Transcript upload failed after retries:", error?.message);
          } else {
            await new Promise((r) => setTimeout(r, 500 * attempt));
          }
        }
      }

      uploadingRef.current = false;
    };

    recorder.start();

    intervalRef.current = setInterval(() => {
      if (recorder.state === "recording") {
        recorder.stop();
        setTimeout(() => {
          if (recorder.state === "inactive") recorder.start();
        }, 100);
      }
    }, CHUNK_INTERVAL);
  }, [enabled, meetingId, onTranscript, stream]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    uploadingRef.current = false;
  }, []);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  return { start, stop };
};

export default useMeetingTranscription;