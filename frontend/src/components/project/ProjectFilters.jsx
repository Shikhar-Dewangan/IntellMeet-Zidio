// frontend/src/components/project/ProjectFilters.jsx
import { X, LayoutGrid, List as ListIcon, SlidersHorizontal } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priority" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function FilterSelect({ value, onChange, options, label }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="appearance-none rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg-2 hover:bg-card focus:border-accent-blue focus:outline-none cursor-pointer transition"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function ProjectFilters({
  // team filter
  teamFilter,
  setTeamFilter,
  teams = [],

  // status filter
  statusFilter,
  setStatusFilter,

  // priority filter
  priorityFilter,
  setPriorityFilter,

  // view mode
  viewMode,
  setViewMode,

  // clear
  onClear,
  hasActiveFilters,
}) {
  const teamOptions = [
    { value: "all", label: "All Teams" },
    ...teams.map((t) => ({ value: t._id, label: t.name })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-3 shrink-0">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
      </div>

      <FilterSelect
        value={teamFilter}
        onChange={setTeamFilter}
        options={teamOptions}
        label="Filter by team"
      />

      <FilterSelect
        value={statusFilter}
        onChange={setStatusFilter}
        options={STATUS_OPTIONS}
        label="Filter by status"
      />

      <FilterSelect
        value={priorityFilter}
        onChange={setPriorityFilter}
        options={PRIORITY_OPTIONS}
        label="Filter by priority"
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface hover:bg-card px-2.5 py-1.5 text-xs font-semibold text-fg-2 transition"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}

      <div className="ml-auto flex items-center gap-1 rounded-lg border border-line bg-surface p-1 shrink-0">
        <button
          type="button"
          onClick={() => setViewMode("grid")}
          aria-label="Grid view"
          className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
            viewMode === "grid"
              ? "bg-accent-blue/15 text-accent-blue"
              : "text-fg-3 hover:bg-card"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("list")}
          aria-label="List view"
          className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
            viewMode === "list"
              ? "bg-accent-blue/15 text-accent-blue"
              : "text-fg-3 hover:bg-card"
          }`}
        >
          <ListIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}