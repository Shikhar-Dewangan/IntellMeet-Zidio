import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Radio, Square, Loader2 } from "lucide-react";
import { createRecording } from "../../services/recording.service.js";
import { getApiError } from "../../utils/apiData.js";

export default function RecordingControls({
  meetingId, enabled = true, streamToRecord = null,
  recording = false, onToggleRecording, onRecordingStarted, onRecordingStopped, onRecordingUploaded,
}) {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!recording) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    setSeconds(0);
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [recording]);

  const startRecording = () => {
    if (!streamToRecord) {
      toast.error("No stream available to record");
      return;
    }
    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";

      const recorder = new MediaRecorder(streamToRecord, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        if (blob.size === 0) {
          toast.error("Recording was empty");
          return;
        }
        await uploadRecording(blob);
      };

      recorder.start(1000);
      onRecordingStarted?.();
      toast.success("Recording started");
    } catch (error) {
      console.error(error);
      toast.error("Could not start recording");
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    try { recorder.stop(); } catch {}
    onRecordingStopped?.();
    toast.success("Recording stopped — uploading…");
  };

  const uploadRecording = async (blob) => {
    setUploading(true);
    try {
      const file = new File([blob], `meeting-${meetingId}-${Date.now()}.webm`, { type: blob.type || "video/webm" });
      const response = await createRecording({
        meetingId,
        file,
        title: "Meeting recording",
        durationSeconds: seconds,
      });
      toast.success("Recording uploaded");
      onRecordingUploaded?.(response);
    } catch (error) {
      toast.error(getApiError(error, "Could not upload recording"));
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = () => {
    if (uploading) return;
    if (recording) {
      stopRecording();
      onToggleRecording?.(false);
    } else {
      startRecording();
      onToggleRecording?.(true);
    }
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state === "recording") {
        try { recorderRef.current.stop(); } catch {}
      }
    };
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (!enabled) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={uploading}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
          recording ? "bg-accent-rose text-white hover:bg-accent-rose/90" : "border border-line bg-card text-fg hover:bg-surface"
        } disabled:opacity-60`}
        title={recording ? "Stop recording" : "Start recording"}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : recording ? <Square className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">
          {uploading ? "Uploading…" : recording ? `Stop • ${formatTime(seconds)}` : "Record"}
        </span>
      </button>
    </div>
  );
}