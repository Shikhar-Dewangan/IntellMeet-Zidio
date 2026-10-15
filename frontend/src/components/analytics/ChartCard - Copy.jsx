import { MoreVertical } from "lucide-react";

export default function ChartCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-card overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
              <Icon className="h-4 w-4 text-accent-blue" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-fg truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-fg-3 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {action || (
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-fg-3 hover:bg-surface transition shrink-0">
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}