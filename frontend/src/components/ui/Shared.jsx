import { Loader2 } from "lucide-react";

/* ============ Page Header ============ */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 ">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 ">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ============ Section Card ============ */
export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-2xl bg-white  border border-slate-200  overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 ">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-blue-600 " />}
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 ">
              {title}
            </h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ============ Status Badge ============ */
export function StatusBadge({ status }) {
  const map = {
    upcoming: "bg-blue-50  text-blue-700 ",
    live: "bg-red-50  text-red-700 ",
    completed: "bg-emerald-50  text-emerald-700 ",
    cancelled: "bg-slate-100  text-slate-600 ",
    todo: "bg-slate-100  text-slate-600 ",
    "in-progress": "bg-blue-50  text-blue-700 ",
    active: "bg-emerald-50  text-emerald-700 ",
    paused: "bg-amber-50  text-amber-700 ",
  };
  const labels = {
    upcoming: "Upcoming",
    live: "Live",
    completed: "Completed",
    cancelled: "Cancelled",
    todo: "Todo",
    "in-progress": "In Progress",
    active: "Active",
    paused: "Paused",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${map[status] || map.todo}`}
    >
      {labels[status] || status}
    </span>
  );
}

/* ============ Priority Badge ============ */
export function PriorityBadge({ priority }) {
  const map = {
    high: "bg-red-50  text-red-700 ",
    medium: "bg-amber-50  text-amber-700 ",
    low: "bg-emerald-50  text-emerald-700 ",
  };
  const labels = { high: "High", medium: "Medium", low: "Low" };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${map[priority] || map.medium}`}
    >
      {labels[priority] || priority}
    </span>
  );
}

/* ============ Avatar Group ============ */
export function AvatarGroup({ participants = [], extra = 0, size = "md" }) {
  const colors = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-amber-500",
  ];
  const sizes = {
    sm: "w-6 h-6 text-[9px]",
    md: "w-7 h-7 text-[10px]",
    lg: "w-9 h-9 text-xs",
  };
  const cls = sizes[size];
  return (
    <div className="flex items-center -space-x-2">
      {participants.slice(0, 4).map((p, i) => (
        <div
          key={i}
          className={`${cls} ${colors[i % colors.length]} rounded-full border-2 border-white  flex items-center justify-center text-white font-bold`}
        >
          {typeof p === "string" ? p[0] : p.name?.[0] || "U"}
        </div>
      ))}
      {extra > 0 && (
        <div
          className={`${cls} rounded-full bg-slate-200  border-2 border-white  flex items-center justify-center text-slate-600  font-bold`}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ============ Empty State ============ */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100  flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-slate-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 ">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500  max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ============ Loading State ============ */
export function LoadingState({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-blue-600  animate-spin" />
      <p className="mt-3 text-sm text-slate-500 ">{text}</p>
    </div>
  );
}

/* ============ Filter Bar ============ */
export function FilterBar({ children }) {
  return <div className="flex flex-col sm:flex-row gap-3 mb-5">{children}</div>;
}

/* ============ Tabs ============ */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100  overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
            active === t.value
              ? "bg-white  text-slate-900  shadow-sm"
              : "text-slate-600  hover:text-slate-900 "
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
