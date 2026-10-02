import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Clock3,
  FileAudio2,
  PlayCircle,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import {
  deleteRecording,
  getRecordings,
} from "../../services/recording.service.js";
import { getApiError, unwrapApiList } from "../../utils/apiData.js";
import {
  EmptyState,
  FilterBar,
  LoadingState,
  PageHeader,
  SectionCard,
} from "../../components/ui/Shared.jsx";

export default function Recordings() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const visibleRecordings = recordings.filter((recording) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      recording.title?.toLowerCase().includes(query) ||
      recording.meeting?.title?.toLowerCase().includes(query)
    );
  });

  const remove = async (id) => {
    try {
      await deleteRecording(id);
      setRecordings((items) => items.filter((item) => item._id !== id));
      toast.success("Recording deleted");
    } catch (error) {
      toast.error(getApiError(error, "Could not delete recording"));
    }
  };

  if (loading) return <LoadingState text="Loading recordings..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Recorded meetings"
        subtitle="Access, review, and manage your meeting recordings."
      />

      <FilterBar>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recordings"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
          />
        </div>
      </FilterBar>

      {visibleRecordings.length ? (
        <SectionCard>
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleRecordings.map((recording) => (
              <div
                key={recording._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white  "
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-linear-to-br from-blue-500 via-violet-500 to-slate-900">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_45%)]" />
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                    <PlayCircle className="h-6 w-6 text-white" />
                  </div>
                  <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/60 px-2 py-1 text-[10px] font-semibold text-white">
                    {Math.max(1, Math.round((recording.duration || 0) / 60))}{" "}
                    min
                  </span>
                </div>

                <div className="space-y-4 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 ">
                      {recording.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 ">
                      {recording.meeting?.title || "Meeting recording"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 ">
                    <Clock3 className="h-3.5 w-3.5" />
                    {recording.duration
                      ? `${Math.floor(recording.duration / 60)}:${String(recording.duration % 60).padStart(2, "0")}`
                      : "00:00"}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/recordings/${recording._id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Video className="h-4 w-4" />
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(recording._id)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100   "
                      aria-label="Delete recording"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard>
          <EmptyState
            icon={FileAudio2}
            title="No recordings found"
            description="Completed meeting recordings will appear here."
          />
        </SectionCard>
      )}
    </div>
  );
}
