// frontend/src/components/ai/ActionItemsTab.jsx
import {
  ListChecks, Loader2, User as UserIcon, Calendar, RefreshCw,
  AlertTriangle, Sparkles,
} from "lucide-react";

export default function ActionItemsTab({
  insight,
  loading = false,
  onGenerate,
  onRegenerate,
  generating = false,
  canGenerate = true,
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
        <p className="mt-3 text-xs text-fg-3">Loading action items...</p>
      </div>
    );
  }

  const actionItems = Array.isArray(insight?.actionItems)
    ? insight.actionItems
    : [];
  const status = insight?.status;

  if (actionItems.length > 0) {
    return (
      <div className="space-y-3">
        {actionItems.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-line bg-surface/50 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
                <ListChecks className="h-4 w-4 text-accent-blue" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-xs text-fg-3 leading-relaxed">
                    {item.description}
                  </p>
                )}
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-fg-3">
                  <span className="inline-flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    {item.owner || "Not assigned"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.deadline || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {canGenerate && (
          <div className="pt-2">
            <button
              onClick={onRegenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-fg hover:bg-card transition disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Regenerate
            </button>
          </div>
        )}
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
          Action items can only be extracted from a saved transcript.
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

  if (status === "completed") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/10">
          <ListChecks className="h-6 w-6 text-accent-blue" />
        </div>
        <p className="text-sm font-semibold text-fg">No action items found</p>
        <p className="mt-1 max-w-sm text-xs text-fg-3">
          This meeting did not contain any explicit tasks or follow-up actions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
        <ListChecks className="h-6 w-6 text-fg-3" />
      </div>
      <p className="text-sm font-semibold text-fg">No action items yet</p>
      <p className="mt-1 max-w-sm text-xs text-fg-3">
        Generate to extract tasks from the meeting transcript.
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
          Generate Action Items
        </button>
      )}
    </div>
  );
}