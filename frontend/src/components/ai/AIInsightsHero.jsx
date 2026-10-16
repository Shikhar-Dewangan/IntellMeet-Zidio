// frontend/src/components/ai/AIInsightsHero.jsx
import {
  Sparkles, FileText, ListChecks, KeyRound,
} from "lucide-react";

const FEATURE_CHIPS = [
  { icon: Sparkles, label: "Smart Summaries" },
  { icon: ListChecks, label: "Action Items" },
  { icon: FileText, label: "Full Transcripts" },
  { icon: KeyRound, label: "Key Decisions" },
];

export default function AIInsightsHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-linear-to-br from-card via-card to-page">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in srgb, var(--accent-500) 12%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--accent-500) 12%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow */}
      <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-accent-400/10 blur-3xl pointer-events-none" />

      <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr] p-6 sm:p-8 lg:p-10 items-center">
        {/* LEFT */}
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-accent-blue shadow-sm">
            <Sparkles className="h-3 w-3 text-accent-blue" />
            AI Insights
          </span>

          <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-fg">
            Turn Your Meetings
            <br />
            into{" "}
            <span className="bg-gradient-to-r from-accent-700 via-accent-500 to-accent-700 bg-clip-text text-transparent">
              Real Progress
            </span>
          </h1>

          <p className="mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-fg-2">
            Get AI-powered summaries, transcripts, action items and key
            takeaways from all your meetings. Save time, stay aligned, and
            never miss what matters.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {FEATURE_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card/80 px-2.5 py-1.5 text-[11px] font-semibold text-fg-2 shadow-sm"
                >
                  <Icon className="h-3 w-3 text-accent-blue" />
                  {chip.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Robot + floating cards */}
        <div className="relative hidden lg:block h-64">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-accent-500/20 blur-3xl scale-150" />
              <div className="relative h-32 w-32 rounded-3xl bg-gradient-to-br from-accent-400 via-accent-500 to-accent-700 shadow-2xl shadow-accent-500/50 flex items-center justify-center border-2 border-accent-50/20">
                <div className="flex gap-3">
                  <div className="h-3 w-3 rounded-full bg-accent-50 shadow-lg shadow-accent-50/50" />
                  <div className="h-3 w-3 rounded-full bg-accent-50 shadow-lg shadow-accent-50/50" />
                </div>
                <div className="absolute bottom-6 h-1 w-8 rounded-full bg-accent-50/40" />
              </div>
              <div className="mx-auto mt-2 h-8 w-24 rounded-t-xl bg-gradient-to-b from-accent-400/80 to-accent-500/30 border-2 border-b-0 border-accent-50/20" />
            </div>
          </div>

          {/* Floating cards */}
          <div className="absolute top-4 left-0 w-24 rounded-xl border border-line bg-card/90 p-2.5 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-2.5 w-2.5 text-accent-blue" />
              <p className="text-[9px] font-bold text-fg">Summary</p>
            </div>
            <div className="space-y-1">
              <div className="h-1 w-full rounded-full bg-accent-500/25" />
              <div className="h-1 w-3/4 rounded-full bg-accent-500/25" />
              <div className="h-1 w-1/2 rounded-full bg-accent-500/25" />
            </div>
          </div>

          <div className="absolute top-0 right-0 w-24 rounded-xl border border-line bg-card/90 p-2.5 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="h-2.5 w-2.5 text-accent-blue" />
              <p className="text-[9px] font-bold text-fg">Transcript</p>
            </div>
            <div className="space-y-1">
              <div className="h-1 w-full rounded-full bg-accent-500/25" />
              <div className="h-1 w-2/3 rounded-full bg-accent-500/25" />
              <div className="h-1 w-5/6 rounded-full bg-accent-500/25" />
            </div>
          </div>

          <div className="absolute bottom-6 left-2 w-28 rounded-xl border border-line bg-card/90 p-2.5 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ListChecks className="h-2.5 w-2.5 text-accent-blue" />
              <p className="text-[9px] font-bold text-fg">
                Action Items
              </p>
            </div>
            <div className="space-y-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-sm border border-accent-blue/50" />
                  <div className="h-1 flex-1 rounded-full bg-accent-500/25" />
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 right-2 w-24 rounded-xl border border-line bg-card/90 p-2.5 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1.5">
              <KeyRound className="h-2.5 w-2.5 text-accent-blue" />
              <p className="text-[9px] font-bold text-fg">
                Key Decisions
              </p>
            </div>
            <div className="space-y-1">
              <div className="h-1 w-full rounded-full bg-accent-500/25" />
              <div className="h-1 w-4/5 rounded-full bg-accent-500/25" />
            </div>
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 -right-2 space-y-1">
            <p className="text-[10px] font-semibold text-fg-3 text-right">
              Meet smarter
            </p>
            <p className="text-[10px] font-semibold text-fg-3 text-right">
              Work faster
            </p>
            <p className="text-[10px] font-semibold text-fg-3 text-right">
              Stay aligned
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}