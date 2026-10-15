export default function StatCard({
  label,
  value,
  icon: Icon,
  iconBg = "bg-accent-blue/15",
  iconColor = "text-accent-blue",
  change,
  changeType = "up", // "up" | "down" | "flat" | "warn"
}) {
  const changeStyles = {
    up: "text-accent-emerald",
    down: "text-accent-rose",
    warn: "text-accent-amber",
    flat: "text-fg-3",
  };

  return (
    <div className="rounded-2xl border border-line bg-card p-4 transition hover:shadow-md sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-fg-2">{label}</p>
          <p className="mt-0.5 text-2xl font-bold leading-tight text-fg">
            {value}
          </p>
        </div>
      </div>

      {change && (
        <p className={`mt-3 text-xs font-medium ${changeStyles[changeType]}`}>
          {changeType === "up" && "↑ "}
          {changeType === "down" && "↓ "}
          {changeType === "warn" && "⚠ "}
          {change}
        </p>
      )}
    </div>
  );
}