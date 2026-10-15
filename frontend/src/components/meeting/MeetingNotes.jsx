import { useEffect, useRef, useState } from "react";
import { FileText, Save, Loader2 } from "lucide-react";

export default function MeetingNotes({ value = "", onChange, onSave, readOnly = false, saving = false, lastSavedAt = null }) {
  const [local, setLocal] = useState(value);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (e) => {
    const next = e.target.value;
    setLocal(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange?.(next);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const formatTime = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-violet/15">
            <FileText className="h-4 w-4 text-accent-violet" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-fg">Shared Notes</h3>
            <p className="text-[11px] text-fg-3">
              {lastSavedAt ? `Saved at ${formatTime(lastSavedAt)}` : "Visible to everyone"}
            </p>
          </div>
        </div>
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving || readOnly}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-semibold text-fg transition hover:bg-surface disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 p-3">
        <textarea
          value={local}
          onChange={handleChange}
          readOnly={readOnly}
          placeholder={readOnly ? "Notes are read-only" : "Type shared notes here… everyone in the meeting sees them."}
          className="h-full w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition"
        />
      </div>
    </div>
  );
}