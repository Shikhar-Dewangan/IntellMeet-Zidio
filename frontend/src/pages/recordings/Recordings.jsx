import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Clock3, PlayCircle, Search, Trash2, Video, Mic, Sparkles,
  CalendarDays, User as UserIcon, ArrowUpDown, LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import {
  deleteRecording,
  getRecordings,
} from "../../services/recording.service.js";
import { getApiError, unwrapApiList } from "../../utils/apiData.js";
import {
  EmptyState,
  LoadingState,
  SectionCard,
  Tabs,
} from "../../components/ui/Shared.jsx";
import OverviewHero from "../../components/ui/OverviewHeroCard.jsx";

/* ============================================================
   HELPERS
   ============================================================ */
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m < 60) return `${m}:${String(s).padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

function formatShortDuration(seconds) {
  if (!seconds || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m < 60) return `${m}:${String(s).padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function getRecordingAccent(index) {
  const gradients = [
    "from-accent-500 via-accent-600 to-accent-700",
    "from-violet-500 via-violet-600 to-violet-700",
    "from-emerald-500 via-emerald-600 to-emerald-700",
    "from-rose-500 via-rose-600 to-rose-700",
    "from-amber-500 via-amber-600 to-amber-700",
    "from-blue-500 via-blue-600 to-blue-700",
  ];
  return gradients[index % gradients.length];
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function Recordings() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [deletingId, setDeletingId] = useState(null);

  const loadRecordings = async () => {
    try {
      const response = await getRecordings();
      setRecordings(unwrapApiList(response));
    } catch (error) {
      toast.error(getApiError(error, "Could not load recordings"));
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  /* ============ STATS ============ */
  const stats = useMemo(() => {
    const total = recordings.length;
    const totalDuration = recordings.reduce(
      (sum, r) => sum + (r.duration || 0),
      0,
    );
    const withSummary = recordings.filter((r) => r.summary?.trim()).length;
    const transcribed = recordings.filter((r) => r.transcription?.trim()).length;
    return { total, totalDuration, withSummary, transcribed };
  }, [recordings]);

  /* ============ FILTER + SORT ============ */
  const visibleRecordings = useMemo(() => {
    const query = search.trim().toLowerCase();

    let list = recordings.filter((rec) => {
      if (!query) return true;
      return (
        rec.title?.toLowerCase().includes(query) ||
        rec.meeting?.title?.toLowerCase().includes(query) ||
        rec.recordedBy?.fullName?.toLowerCase().includes(query)
      );
    });

    if (filterBy === "transcribed") {
      list = list.filter((r) => r.transcription && r.transcription.trim());
    } else if (filterBy === "summarized") {
      list = list.filter((r) => r.summary && r.summary.trim());
    } else if (filterBy === "unprocessed") {
      list = list.filter((r) => !r.summary && !r.transcription);
    }

    list.sort((a, b) => {
      const aT = new Date(a.recordedAt || a.createdAt || 0).getTime();
      const bT = new Date(b.recordedAt || b.createdAt || 0).getTime();
      if (sortBy === "latest") return bT - aT;
      if (sortBy === "oldest") return aT - bT;
      if (sortBy === "longest") return (b.duration || 0) - (a.duration || 0);
      if (sortBy === "shortest") return (a.duration || 0) - (b.duration || 0);
      return 0;
    });

    return list;
  }, [recordings, search, sortBy, filterBy]);

  const handleDelete = async (recording) => {
    if (
      !window.confirm(
        `Delete "${recording.title}"? This action cannot be undone.`,
      )
    )
      return;

    setDeletingId(recording._id);
    try {
      await deleteRecording(recording._id);
      setRecordings((items) => items.filter((i) => i._id !== recording._id));
      toast.success("Recording deleted");
    } catch (error) {
      toast.error(getApiError(error, "Could not delete recording"));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingState text="Loading recordings..." />;

  /* ============ HERO STATS ============ */
  const heroStats = [
    {
      icon: Video,
      label: `${stats.total} recording${stats.total !== 1 ? "s" : ""}`,
    },
    {
      icon: Clock3,
      label: formatDuration(stats.totalDuration),
    },
    ...(stats.withSummary > 0
      ? [
          {
            icon: Sparkles,
            label: `${stats.withSummary} with AI summary`,
            highlight: true,
          },
        ]
      : []),
    ...(stats.transcribed > 0
      ? [
          {
            icon: Mic,
            label: `${stats.transcribed} transcribed`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      {/* ============ HERO ============ */}
      <OverviewHero
        badge="Recordings Library"
        title="Recorded Meetings"
        description="Watch, review, and manage all your past meeting recordings. AI-powered transcripts and summaries are available for every recording."
        stats={heroStats}
        showVisual
      />

      {/* ============ FILTERS ============ */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recordings..."
            className="w-full rounded-xl border border-line bg-card pl-9 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition"
          />
        </div>

        <div className="flex-1 lg:flex-none">
          <Tabs
            tabs={[
              { value: "all", label: "All" },
              { value: "transcribed", label: "Transcribed" },
              { value: "summarized", label: "With Summary" },
              { value: "unprocessed", label: "Unprocessed" },
            ]}
            active={filterBy}
            onChange={setFilterBy}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-xl border border-line bg-card pl-9 pr-8 py-2.5 text-sm text-fg focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition cursor-pointer"
            >
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
              <option value="longest">Longest first</option>
              <option value="shortest">Shortest first</option>
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-line bg-card p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-accent-500/15 text-accent-600 dark:text-accent-400"
                  : "text-fg-3 hover:text-fg hover:bg-surface"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                viewMode === "list"
                  ? "bg-accent-500/15 text-accent-600 dark:text-accent-400"
                  : "text-fg-3 hover:text-fg hover:bg-surface"
              }`}
              title="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      {visibleRecordings.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Video}
            title={
              search || filterBy !== "all"
                ? "No recordings match your filters"
                : "No recordings yet"
            }
            description={
              search || filterBy !== "all"
                ? "Try adjusting your search or filter."
                : "Recordings from your past meetings will appear here."
            }
          />
        </SectionCard>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecordings.map((recording, index) => (
            <RecordingCard
              key={recording._id}
              recording={recording}
              accentGradient={getRecordingAccent(index)}
              onDelete={() => handleDelete(recording)}
              deleting={deletingId === recording._id}
            />
          ))}
        </div>
      ) : (
        <SectionCard>
          <div className="divide-y divide-line">
            {visibleRecordings.map((recording, index) => (
              <RecordingRow
                key={recording._id}
                recording={recording}
                accentGradient={getRecordingAccent(index)}
                onDelete={() => handleDelete(recording)}
                deleting={deletingId === recording._id}
              />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ============================================================
   GRID CARD
   ============================================================ */
function RecordingCard({ recording, accentGradient, onDelete, deleting }) {
  const duration = formatShortDuration(recording.duration);
  const hasSummary = recording.summary?.trim();
  const hasTranscript = recording.transcription?.trim();
  const ownerName = recording.recordedBy?.fullName || "Unknown";

  return (
    <div className="group overflow-hidden rounded-2xl border border-line bg-card hover:shadow-lg hover:border-accent-500/30 transition">
      <Link to={`/recordings/${recording._id}`} className="block">
        <div
          className={`relative aspect-video overflow-hidden bg-linear-to-br ${accentGradient}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_50%)]" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur ring-2 ring-white/30 transition group-hover:scale-110 group-hover:bg-white/30">
              <PlayCircle className="h-7 w-7 text-white" />
            </div>
          </div>

          <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {duration}
          </span>

          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {hasSummary && (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white">
                <Sparkles className="h-2.5 w-2.5 text-accent-emerald" />
                AI
              </span>
            )}
            {hasTranscript && (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white">
                <Mic className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <div>
          <Link
            to={`/recordings/${recording._id}`}
            className="block text-sm font-semibold text-fg hover:text-accent-600 dark:hover:text-accent-400 transition line-clamp-2"
          >
            {recording.title || "Untitled Recording"}
          </Link>
          {recording.meeting?.title && (
            <p className="mt-0.5 text-xs text-fg-3 truncate flex items-center gap-1">
              <Video className="h-3 w-3 shrink-0" />
              {recording.meeting.title}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-fg-3">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatDate(recording.recordedAt || recording.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1 truncate">
            <UserIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{ownerName}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Link
            to={`/recordings/${recording._id}`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 px-3 py-2 text-xs font-semibold text-white transition shadow-sm shadow-accent-600/20"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Watch
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-rose/30 bg-accent-rose/10 text-accent-rose transition hover:bg-accent-rose/20 disabled:opacity-50"
            title="Delete recording"
          >
            {deleting ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-rose border-t-transparent" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LIST ROW
   ============================================================ */
function RecordingRow({ recording, accentGradient, onDelete, deleting }) {
  const duration = formatShortDuration(recording.duration);
  const hasSummary = recording.summary?.trim();
  const hasTranscript = recording.transcription?.trim();
  const ownerName = recording.recordedBy?.fullName || "Unknown";

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-4 hover:bg-surface/50 transition">
      <Link
        to={`/recordings/${recording._id}`}
        className={`relative shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-linear-to-br ${accentGradient}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur ring-1 ring-white/30">
            <PlayCircle className="h-5 w-5 text-white" />
          </div>
        </div>
        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
          {duration}
        </span>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <Link
            to={`/recordings/${recording._id}`}
            className="text-sm font-semibold text-fg hover:text-accent-600 dark:hover:text-accent-400 transition truncate"
          >
            {recording.title || "Untitled Recording"}
          </Link>
          {hasSummary && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent-emerald/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-emerald border border-accent-emerald/20 shrink-0">
              <Sparkles className="h-2.5 w-2.5" />
              AI
            </span>
          )}
        </div>

        {recording.meeting?.title && (
          <p className="text-xs text-fg-3 truncate flex items-center gap-1">
            <Video className="h-3 w-3 shrink-0" />
            {recording.meeting.title}
          </p>
        )}

        <div className="mt-1 flex items-center gap-3 text-[11px] text-fg-3">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatDate(recording.recordedAt || recording.createdAt)}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 truncate">
            <UserIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{ownerName}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={`/recordings/${recording._id}`}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 px-3 py-2 text-xs font-semibold text-white transition"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          Watch
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-accent-rose/30 bg-accent-rose/10 text-accent-rose transition hover:bg-accent-rose/20 disabled:opacity-50"
          title="Delete recording"
        >
          {deleting ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-rose border-t-transparent" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}