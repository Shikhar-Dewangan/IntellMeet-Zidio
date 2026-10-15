import { useState } from "react";
import { Mic, Video } from "lucide-react";
import toast from "react-hot-toast";
import Toggle from "../../components/ui/Toggle.jsx";

export default function AudioVideoSection() {
  const [prefs, setPrefs] = useState({
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    joinMuted: false,
    videoQuality: "medium",
  });

  const update = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    localStorage.setItem("intellimeet-av-prefs", JSON.stringify({ ...prefs, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mic className="h-5 w-5 text-accent-600 dark:text-accent-400" />
          <h2 className="text-lg font-semibold text-fg">Audio & Video</h2>
        </div>
        <p className="text-sm text-fg-3">
          Configure your default call preferences
        </p>
      </div>

      <div className="rounded-xl border border-line bg-card p-4">
        <p className="text-sm font-semibold text-fg mb-1">Audio Processing</p>
        <p className="text-xs text-fg-3 mb-3">Improves call quality</p>

        <div className="divide-y divide-line">
          <Toggle
            label="Echo Cancellation"
            description="Reduce echo from speakers"
            checked={prefs.echoCancellation}
            onChange={(v) => update("echoCancellation", v)}
          />
          <Toggle
            label="Noise Suppression"
            description="Filter background noise"
            checked={prefs.noiseSuppression}
            onChange={(v) => update("noiseSuppression", v)}
          />
          <Toggle
            label="Auto Gain Control"
            description="Automatically adjust microphone volume"
            checked={prefs.autoGainControl}
            onChange={(v) => update("autoGainControl", v)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card p-4">
        <p className="text-sm font-semibold text-fg mb-1">Video Quality</p>
        <p className="text-xs text-fg-3 mb-3">Higher = better quality but more bandwidth</p>

        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "low", label: "Low", sub: "360p" },
            { value: "medium", label: "Medium", sub: "720p" },
            { value: "high", label: "High", sub: "1080p" },
          ].map((q) => (
            <button
              key={q.value}
              type="button"
              onClick={() => update("videoQuality", q.value)}
              className={`rounded-xl border px-3 py-3 text-center transition ${
                prefs.videoQuality === q.value
                  ? "border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400"
                  : "border-line bg-surface text-fg-2 hover:bg-card"
              }`}
            >
              <p className="text-sm font-semibold">{q.label}</p>
              <p className="text-[11px] mt-0.5">{q.sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card p-4">
        <Toggle
          label="Join muted"
          description="Start every meeting with microphone off"
          checked={prefs.joinMuted}
          onChange={(v) => update("joinMuted", v)}
        />
      </div>
    </div>
  );
}