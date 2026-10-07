import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";   // ← ADD
import toast from "react-hot-toast";
import {
  Calendar,
  Filter,
  Plus,
  Search,
  Video,
  Zap,
  CheckCircle2,
  Hash,
} from "lucide-react";

import {
  deleteMeeting,
  endMeeting,
  getMyMeetings,
  startMeeting,
} from "../../services/meeting.service.js";
import { getApiError, unwrapApiList } from "../../utils/apiData.js";

import {
  EmptyState,
  FilterBar,
  LoadingState,
  SectionCard,
  Tabs,
} from "../../components/ui/Shared.jsx";

import OverviewHero from "../../components/ui/OverviewHeroCard.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import MeetingCard from "../../components/meeting/MeetingCard.jsx";

// ← ADD helper
const getUserId = (u) => {
  if (!u) return null;
  if (typeof u === "string") return u;
  return u._id || u.id || null;
};

export default function Meetings() {
  const navigate = useNavigate();
  const currentUserId = useSelector((s) => getUserId(s.auth.user)); // ← ADD
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

  useEffect(() => {
    const interval = setInterval(() => {
      loadMeetings();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const actOnMeeting = async (operation, id, message) => {
    try {
      await operation(id);
      toast.success(message);
      await loadMeetings();
    } catch (error) {
      toast.error(getApiError(error, "Meeting action failed"));
    }
  };

  const handleJoin = (meeting) => {
    navigate(`/meetings/${meeting._id}/room`);
  };

  const handleCopyLink = (meeting) => {
    const link = `${window.location.origin}/meetings/${meeting._id}/room`;
    navigator.clipboard?.writeText(link);
    toast.success("Meeting link copied");
  };

  // ← ADD
  const handleDelete = (meeting) => {
    if (
      !window.confirm(
        `Delete "${meeting.title}"? This action cannot be undone.`,
      )
    )
      return;
    actOnMeeting(deleteMeeting, meeting._id, "Meeting deleted");
  };

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: meetings.length,
      upcoming: meetings.filter(
        (m) =>
          (m.status === "scheduled" || m.status === "upcoming") &&
          (!m.scheduledAt || new Date(m.scheduledAt).getTime() >= now),
      ).length,
      live: meetings.filter((m) => m.status === "live").length,
      completed: meetings.filter((m) => m.status === "completed").length,
    };
  }, [meetings]);

  const visibleMeetings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return meetings
      .filter((m) => {
        const matchesTab =
          statusFilter === "all" || m.status === statusFilter;
        const matchesSearch =
          !query ||
          m.title?.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query);
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => {
        const aT = a.scheduledAt
          ? new Date(a.scheduledAt).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bT = b.scheduledAt
          ? new Date(b.scheduledAt).getTime()
          : Number.MAX_SAFE_INTEGER;
        return bT - aT;
      });
  }, [meetings, search, statusFilter]);

  const tabs = [
    { value: "all", label: `All (${stats.total})` },
    { value: "scheduled", label: `Upcoming (${stats.upcoming})` },
    { value: "live", label: `Live (${stats.live})` },
    { value: "completed", label: `Completed (${stats.completed})` },
  ];

  if (loading) return <LoadingState text="Loading meetings..." />;

  return (
    <div className="space-y-5">
      <OverviewHero
        badge="Meetings"
        title="Plan conversations. Turn them into progress."
        description="Schedule meetings, invite teammates, collaborate in real-time and get AI-powered insights after every meeting."
        primaryAction={{
          label: "Create Meeting",
          to: "/meetings/create",
          icon: Plus,
        }}
        secondaryAction={{
          label: "Join with Code",
          to: "/meetings/join",
          icon: Hash,
        }}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Meetings"
          value={stats.total}
          icon={Video}
          iconBg="bg-blue-100 dark:bg-blue-500/15"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={Calendar}
          iconBg="bg-violet-100 dark:bg-violet-500/15"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          label="Live Now"
          value={stats.live}
          icon={Zap}
          iconBg="bg-emerald-100 dark:bg-emerald-500/15"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          iconBg="bg-amber-100 dark:bg-amber-500/15"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <Tabs tabs={tabs} active={statusFilter} onChange={setStatusFilter} />

        <FilterBar>
          <div className="relative w-full lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-9 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:w-40"
            >
              <option value="all">All status</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </FilterBar>
      </div>

      {visibleMeetings.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {visibleMeetings.map((meeting) => (
            <MeetingCard
              key={meeting._id}
              meeting={meeting}
              currentUserId={currentUserId}
              onJoin={handleJoin}
              onCopyLink={handleCopyLink}
              onStart={() =>
                actOnMeeting(startMeeting, meeting._id, "Meeting started")
              }
              onEnd={() =>
                actOnMeeting(endMeeting, meeting._id, "Meeting ended")
              }
              onDelete={() => handleDelete(meeting)}
            />
          ))}
        </div>
      )}
    </div>
  );
}