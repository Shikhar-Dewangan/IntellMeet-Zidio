// frontend/src/components/ai/SummaryTab.jsx
import { useState } from "react";
import { Sparkles, Copy, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function SummaryTab({
  insight,
  loading = false,
  onGenerate,
  onRegenerate,
  generating = false,
  canGenerate = true,
}) {
  const [copied, setCopied] = useState(false);

  const summary = insight?.summary?.trim() || "";
  const hasSummary = summary.length > 0;
  const status = insight?.status;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success("Summary copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
        <p className="mt-3 text-xs text-fg-3">Loading summary...</p>
      </div>
    );
  }

  if (hasSummary) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/15">
              <Sparkles className="h-4 w-4 text-accent-blue" />
            </div>
            <h3 className="text-sm font-bold text-fg">Meeting Summary</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-fg-2 hover:bg-card transition"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied" : "Copy"}
            </button>
            {canGenerate && (
              <button
                onClick={onRegenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-fg-2 hover:bg-card transition disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Regenerate
              </button>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-fg-2 whitespace-pre-wrap">
          {summary}
        </p>
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/10">
          <AlertTriangle className="h-6 w-6 text-accent-blue" />
        </div>
        <p className="text-sm font-semibold text-fg">No transcript available</p>
        <p className="mt-1 max-w-sm text-xs text-fg-3">
          Summary can only be generated from a saved meeting transcript.
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/10">
          <AlertTriangle className="h-6 w-6 text-accent-blue" />
        </div>
        <p className="text-sm font-semibold text-fg">Generation failed</p>
        <p className="mt-1 max-w-sm text-xs text-fg-3">
          {insight?.error || "Please try again."}
        </p>
        {canGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-blue px-4 py-2.5 text-sm font-semibold text-accent-50 hover:bg-accent-blue/90 disabled:opacity-60 transition"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Retry
          </button>
        )}
      </div>
    );
  }

  // Not generated yet
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
        <Sparkles className="h-6 w-6 text-fg-3" />
      </div>
      <p className="text-sm font-semibold text-fg">No summary yet</p>
      <p className="mt-1 max-w-sm text-xs text-fg-3">
        Generate a summary from this meeting's transcript.
      </p>
      {canGenerate && (
        <button
          onClick={onGenerate}
          disabled={generating}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-blue px-4 py-2.5 text-sm font-semibold text-accent-50 hover:bg-accent-blue/90 disabled:opacity-60 transition"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate Summary
        </button>
      )}
    </div>
  );
}