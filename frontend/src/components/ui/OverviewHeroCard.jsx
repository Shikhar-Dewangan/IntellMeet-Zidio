import { Link } from "react-router-dom";
import { FileText, BarChart3, Calendar, Sparkles, Video } from "lucide-react";

export default function OverviewHero({
  badge = "Welcome back",
  title,
  description,
  primaryAction,
  secondaryAction,
  stats = null,
  showVisual = true,
}) {
  const PrimaryIcon = primaryAction?.icon;
  const SecondaryIcon = secondaryAction?.icon;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-linear-to-br from-card via-card to-page">
      {/* Right visual */}
      {showVisual && (
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none">
          <div className="absolute top-1/2 -translate-y-1/2 right-12 w-72 h-72">
            <div className="absolute -top-6 right-16 w-44 h-44 rounded-full bg-accent-blue/40 blur-[80px]" />
            <div className="absolute bottom-0 right-0 w-52 h-52 rounded-full bg-accent-purple/40 blur-[80px]" />
            <div className="absolute top-16 left-0 w-32 h-32 rounded-full bg-accent-violet/30 blur-[60px]" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-3xl bg-linear-to-br from-accent-blue to-accent-purple shadow-2xl shadow-accent-purple/40 flex items-center justify-center rotate-6">
              <Video className="w-11 h-11 text-white" />
            </div>

            <div className="absolute top-0 left-6 w-14 h-14 rounded-2xl bg-card border border-line shadow-xl flex items-center justify-center -rotate-6">
              <FileText className="w-6 h-6 text-accent-blue" />
            </div>
            <div className="absolute top-6 -right-2 w-16 h-16 rounded-2xl bg-card border border-line shadow-xl flex items-center justify-center rotate-12">
              <BarChart3 className="w-7 h-7 text-accent-emerald" />
            </div>
            <div className="absolute bottom-6 -right-2 w-16 h-16 rounded-2xl bg-card border border-line shadow-xl flex items-center justify-center -rotate-6">
              <Calendar className="w-7 h-7 text-accent-rose" />
            </div>
            <div className="absolute bottom-0 left-10 w-14 h-14 rounded-2xl bg-card border border-line shadow-xl flex items-center justify-center rotate-6">
              <Sparkles className="w-6 h-6 text-accent-violet" />
            </div>

            <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 rounded-full bg-accent-blue" />
            <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-accent-violet" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="max-w-xl">
          {badge && (
            <span className="inline-block text-[11px] font-semibold tracking-[0.15em] uppercase text-accent-blue mb-3">
              {badge}
            </span>
          )}

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-fg leading-tight">
            {title}
          </h1>

          {description && (
            <p className="mt-3 text-sm sm:text-base text-fg-2 leading-relaxed max-w-md">
              {description}
            </p>
          )}

          {/* Stats chips */}
          {stats && stats.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2.5">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-2 text-xs sm:text-sm font-medium ${
                      stat.highlight ? "text-accent-blue" : "text-fg-2"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        stat.highlight
                          ? "bg-accent-blue/15"
                          : "bg-surface border border-line"
                      }`}
                    >
                      {Icon && (
                        <Icon
                          className={`h-3.5 w-3.5 ${
                            stat.highlight ? "text-accent-blue" : "text-fg-3"
                          }`}
                        />
                      )}
                    </span>
                    {stat.label}
                  </span>
                );
              })}
            </div>
          )}

          {(primaryAction || secondaryAction) && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {primaryAction && (
                <Link
                  to={primaryAction.to || "#"}
                  onClick={primaryAction.onClick}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-semibold transition shadow-lg shadow-accent-blue/25"
                >
                  {PrimaryIcon && <PrimaryIcon className="w-4 h-4" />}
                  {primaryAction.label}
                </Link>
              )}

              {secondaryAction && (
                <Link
                  to={secondaryAction.to || "#"}
                  onClick={secondaryAction.onClick}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-card border border-line text-fg text-sm font-semibold hover:bg-surface transition"
                >
                  {secondaryAction.label}
                  {SecondaryIcon && <SecondaryIcon className="w-4 h-4" />}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}