import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Calendar, Filter, Plus, Search, Video } from "lucide-react";
import {
  deleteMeeting,
  endMeeting,
  getMyMeetings,
  startMeeting,
} from "../../services/meeting.service.js";
import { getApiError, unwrapApiList } from "../../utils/apiData.js";
import {
  AvatarGroup,
  EmptyState,
  FilterBar,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  Tabs,
} from "../../components/ui/Shared.jsx";

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadMeetings = async () => {
    try {
      const response = await getMyMeetings();
      setMeetings(unwrapApiList(response));
    } catch (error) {
      toast.error(getApiError(error, "Could not load meetings"));
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const tabs = [
    { value: "all", label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "live", label: "Live" },
    { value: "completed", label: "Completed" },
  ];

  const visibleMeetings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return meetings.filter((meeting) => {
      const matchesTab =
        statusFilter === "all" || meeting.status === statusFilter;
      const matchesSearch =
        !query ||
        meeting.title?.toLowerCase().includes(query) ||
        meeting.description?.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [meetings, search, statusFilter]);

  const actOnMeeting = async (operation, id, message) => {
    try {
      await operation(id);
      toast.success(message);
      await loadMeetings();
    } catch (error) {
      toast.error(getApiError(error, "Meeting action failed"));
    }
  };

  if (loading) return <LoadingState text="Loading meetings..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Meetings"
        subtitle="Create, manage, and join your meetings."
        action={
          <Link
            to="/meetings/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New meeting
          </Link>
        }
      />

      <FilterBar>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search meetings"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-9 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20    sm:w-40"
          >
            <option value="all">All status</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </FilterBar>

      <Tabs tabs={tabs} active={statusFilter} onChange={setStatusFilter} />

      {visibleMeetings.length ? (
        <SectionCard>
          <div className="divide-y divide-slate-100 ">
            {visibleMeetings.map((meeting) => (
              <div
                key={meeting._id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="flex items-center gap-3 sm:min-w-[160px]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600  ">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 ">
                      {meeting.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 ">
                      {meeting.duration || "Meeting"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                      Scheduled
                    </p>
                    <p className="mt-1 text-sm text-slate-600 ">
                      {meeting.scheduledAt
                        ? new Date(meeting.scheduledAt).toLocaleString()
                        : "No date set"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={meeting.status || "upcoming"} />
                    <AvatarGroup
                      participants={meeting.participants || []}
                      extra={0}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Link
                    to={
                      meeting.status === "live"
                        ? `/meetings/${meeting._id}/room`
                        : `/meetings/${meeting._id}`
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    {meeting.status === "live" ? "Join" : "View"}
                  </Link>

                  {meeting.status === "scheduled" && (
                    <button
                      type="button"
                      onClick={() =>
                        actOnMeeting(
                          startMeeting,
                          meeting._id,
                          "Meeting started",
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50    "
                    >
                      Start
                    </button>
                  )}

                  {meeting.status === "live" && (
                    <button
                      type="button"
                      onClick={() =>
                        actOnMeeting(endMeeting, meeting._id, "Meeting ended")
                      }
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100   "
                    >
                      End
                    </button>
                  )}

                  {meeting.status !== "live" &&
                    meeting.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() =>
                          actOnMeeting(
                            deleteMeeting,
                            meeting._id,
                            "Meeting deleted",
                          )
                        }
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100   "
                      >
                        Delete
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard>
          <EmptyState
            icon={Video}
            title="No meetings found"
            description={
              search || statusFilter !== "all"
                ? "Try a different filter or add a new meeting."
                : "Your upcoming and recent meetings will appear here."
            }
            action={
              <Link
                to="/meetings/create"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Schedule meeting
              </Link>
            }
          />
        </SectionCard>
      )}
    </div>
  );
}
