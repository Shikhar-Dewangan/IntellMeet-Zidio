import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

export default function StatTileWithTrend({
  icon: Icon,
  value,
  label,
  sub,
  trend,
  trendDirection = "up",
  to,
  iconBg = "bg-accent-blue/15",
  iconColor = "text-accent-blue",
}) {
  const TrendIcon = trendDirection === "up" ? TrendingUp : TrendingDown;
  const trendColor =
    trendDirection === "up"
      ? "text-accent-emerald bg-accent-emerald/10"
      : "text-accent-rose bg-accent-rose/10";

  const Wrapper = to ? Link : "div";
  const wrapperProps = to ? { to } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group relative overflow-hidden rounded-2xl border border-line bg-card p-4 hover:shadow-md hover:border-accent-blue/30 transition block"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${trendColor}`}
          >
            <TrendIcon className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold leading-tight text-fg">{value}</p>
        <p className="text-xs font-semibold text-fg-2 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-fg-3 mt-0.5 truncate">{sub}</p>}
      </div>

      {to && (
        <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-fg-3 opacity-0 group-hover:opacity-100 transition" />
      )}
    </Wrapper>
  );
}