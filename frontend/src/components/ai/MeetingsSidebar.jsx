// frontend/src/components/ai/MeetingsSidebar.jsx
import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import MeetingListItem from "./MeetingListItem.jsx";

const TABS = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "upcoming", label: "Upcoming" },
];

function getMeetingState(meeting) {
  if (meeting.status === "completed") return "completed";
  if (meeting.status === "scheduled" || meeting.status === "live")
    return "upcoming";
  return "other";
}

export default function MeetingsSidebar({
  meetings = [],
  loading = false,
  selectedId,
  onSelect,
  insightsMap = {}, // { meetingId: "ready" | "generated" }
}) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    return {
      all: meetings.length,
      completed: meetings.filter((m) => getMeetingState(m) === "completed")
        .length,
      upcoming: meetings.filter((m) => getMeetingState(m) === "upcoming")
        .length,
    };
  }, [meetings]);

  const visible = useMemo(() => {
    let list = [...meetings];

    // Tab filter
    if (tab !== "all") {
      list = list.filter((m) => getMeetingState(m) === tab);
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((m) =>
        m.title?.toLowerCase().includes(q)
      );
    }

    // Sort: most recent first
    list.sort((a, b) => {
      const aT = new Date(a.startedAt || a.scheduledAt || 0).getTime();
      const bT = new Date(b.startedAt || b.scheduledAt || 0).getTime();
      return bT - aT;
    });

    return list;
  }, [meetings, tab, search]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-card overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-line p-4">
        <h2 className="text-base font-bold text-fg">Meetings</h2>
      </div>

      {/* Search + Filter */}
      <div className="shrink-0 border-b border-line p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings..."
              className="w-full rounded-lg border border-line bg-surface pl-8 pr-3 py-2 text-xs text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition"
            />
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-fg-3 hover:bg-card transition"
            title="Filters"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-surface p-1">
          {TABS.map((t) => {
            const active = tab === t.value;
            const count = counts[t.value] || 0;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "bg-card text-fg shadow-sm"
                    : "text-fg-3 hover:text-fg"
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                      active
                        ? "bg-accent-blue text-accent-50"
                        : "bg-card text-fg-3"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent-blue" />
          </div>
        ) : visible.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-fg-3">No meetings found</p>
          </div>
        ) : (
          visible.map((meeting, index) => (
            <MeetingListItem
              key={meeting._id}
              meeting={meeting}
              index={index}
              selected={selectedId === meeting._id}
              onClick={() => onSelect?.(meeting)}
              aiStatus={insightsMap[meeting._id] || null}
            />
          ))
        )}
      </div>
    </div>
  );
}