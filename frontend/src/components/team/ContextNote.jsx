// frontend/src/components/team/ContextNote.jsx
import { Info } from "lucide-react";

/**
 * Reusable muted helper note for Team section UI.
 *
 * Uses only existing theme tokens:
 *   text-fg-3, bg-surface, border-line
 */
export default function ContextNote({ children, className = "" }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-line bg-surface/50 px-3 py-2 ${className}`}
    >
      <Info className="h-3.5 w-3.5 text-fg-3 shrink-0 mt-0.5" />
      <p className="text-xs text-fg-3 leading-relaxed">{children}</p>
    </div>
  );
}