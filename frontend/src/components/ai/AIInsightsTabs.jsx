// frontend/src/components/ai/AIInsightsTabs.jsx
import { useState } from "react";
import { Sparkles, FileText, ListChecks, Loader2 } from "lucide-react";
import SummaryTab from "./SummaryTab.jsx";
import TranscriptTab from "./TranscriptTab.jsx";
import ActionItemsTab from "./ActionItemsTab.jsx";

const TABS = [
  { value: "summary", label: "Summary", icon: Sparkles },
  { value: "transcript", label: "Transcript", icon: FileText },
  { value: "actions", label: "Action Items", icon: ListChecks },
];

export default function AIInsightsTabs({
  insight,
  transcript,
  loadingInsight,
  loadingTranscript,
  onGenerate,
  onRegenerate,
  generating,
  canGenerate,
}) {
  const [tab, setTab] = useState("summary");
  const isCompleted = insight?.status === "completed";

  return (
    // `contents` => parent grid (AIInsights.jsx) places the tabs row full-width,
    // and the content card in the left column.
    <div className="contents">
      {/* ============ TABS + GENERATE ROW (full width) ============ */}
      <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
        {/* Tabs (left) – separate buttons, no wrapper pill */}
        <div className="flex flex-wrap items-center gap-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                  active
                    ? "border-accent-blue/20 bg-accent-blue/10 text-accent-blue shadow-sm"
                    : "border-line/60 bg-surface/70 text-fg-2 hover:bg-surface hover:text-fg"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Generate AI Insights button (right) */}
        {canGenerate && (
          <button
            onClick={() => (isCompleted ? onRegenerate() : onGenerate())}
            disabled={generating}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-accent-blue px-4 text-sm font-semibold text-accent-50 transition hover:bg-accent-blue/90 disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isCompleted ? "Regenerate AI Insights" : "Generate AI Insights"}
          </button>
        )}
      </div>

      {/* ============ TAB CONTENT CARD ============ */}
      <div className="min-w-0 rounded-2xl border border-line bg-card p-5">
        {tab === "summary" && (
          <SummaryTab
            insight={insight}
            loading={loadingInsight}
            onGenerate={onGenerate}
            onRegenerate={onRegenerate}
            generating={generating}
            canGenerate={canGenerate}
          />
        )}
        {tab === "transcript" && (
          <TranscriptTab
            transcript={transcript}
            loading={loadingTranscript}
          />
        )}
        {tab === "actions" && (
          <ActionItemsTab
            insight={insight}
            loading={loadingInsight}
            onGenerate={onGenerate}
            onRegenerate={onRegenerate}
            generating={generating}
            canGenerate={canGenerate}
          />
        )}
      </div>
    </div>
  );
}
