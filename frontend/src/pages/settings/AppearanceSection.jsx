import { useState } from "react";
import { Palette, Check, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAppearance,
  ACCENT_OPTIONS,
} from "../../context/AppearanceContext.jsx";
import { getApiError } from "../../utils/apiData.js";

const FONT_SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export default function AppearanceSection() {
  const { accent, setAccent, fontSize, setFontSize, saveAppearance } = useAppearance();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAppearance();
      toast.success("Appearance saved");
    } catch (error) {
      toast.error(getApiError(error, "Failed to save appearance"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-5 w-5 text-accent-600 dark:text-accent-400" />
          <h2 className="text-lg font-semibold text-fg">Appearance</h2>
        </div>
        <p className="text-sm text-fg-3">
          Customize how IntelliMeet looks on your device
        </p>
      </div>

      {/* ACCENT COLOR */}
      <div>
        <p className="text-sm font-medium text-fg mb-3">Accent Color</p>
        <div className="flex flex-wrap gap-3">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAccent(opt.value)}
              className={`relative h-11 w-11 rounded-full transition ring-offset-2 ring-offset-surface ${
                accent === opt.value
                  ? "ring-2 ring-accent-600 scale-110"
                  : "hover:scale-105 ring-2 ring-transparent"
              }`}
              style={{ backgroundColor: opt.color }}
              title={opt.label}
              aria-label={opt.label}
            >
              {accent === opt.value && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-fg-3">
          Selected:{" "}
          <span className="font-medium text-fg-2">
            {ACCENT_OPTIONS.find((a) => a.value === accent)?.label}
          </span>
        </p>
      </div>

      {/* FONT SIZE */}
      <div>
        <p className="text-sm font-medium text-fg mb-3">Font Size</p>
        <div className="grid grid-cols-3 gap-3">
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => setFontSize(size.value)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                fontSize === size.value
                  ? "border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400"
                  : "border-line bg-card text-fg-2 hover:bg-surface"
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIVE PREVIEW */}
      <div className="rounded-xl border border-line bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-fg-3 mb-3">
          Live Preview
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-lg bg-accent-600 hover:bg-accent-700 px-4 py-2 text-sm font-semibold text-white transition">
            Primary Button
          </button>
          <a
            href="#"
            className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline"
          >
            Accent Link
          </a>
          <span className="rounded-full bg-accent-500/15 px-2.5 py-1 text-xs font-semibold text-accent-600 dark:text-accent-400 border border-accent-500/20">
            Badge
          </span>
        </div>
      </div>

      {/* SAVE */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-accent-600/25"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Appearance
            </>
          )}
        </button>
      </div>
    </div>
  );
}