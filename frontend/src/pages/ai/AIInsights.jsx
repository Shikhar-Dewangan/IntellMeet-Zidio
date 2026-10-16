// frontend/src/pages/ai/AIInsights.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Share2, Users, Clock, Calendar, Sparkles, Loader2,
  Play, CheckCircle2, MoreHorizontal,
} from "lucide-react";

import { getMyMeetings } from "../../services/meeting.service.js";
import {
  getMeetingAIInsight,
  generateMeetingAIInsight,
  getMeetingTranscript,
} from "../../services/ai.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";

import AIInsightsHero from "../../components/ai/AIInsightsHero.jsx";
import MeetingsSidebar from "../../components/ai/MeetingsSidebar.jsx";
import AIInsightsTabs from "../../components/ai/AIInsightsTabs.jsx";
import MeetingDetailsPanel from "../../components/ai/MeetingDetailsPanel.jsx";

/* ============ HELPERS ============ */
function formatDateLong(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeRange(startedAt, endedAt) {
  if (!startedAt || !endedAt) return "";
  const opts = { hour: "2-digit", minute: "2-digit" };
  return `${new Date(startedAt).toLocaleTimeString(
    [],
    opts
  )} - ${new Date(endedAt).toLocaleTimeString([], opts)}`;
}

function formatDuration(minutes) {
  if (!minutes || minutes < 1) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ============ MAIN PAGE ============ */
export default function AIInsights() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("meeting");

  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  const [insight, setInsight] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [generating, setGenerating] = useState(false);

  const selectedMeeting = useMemo(
    () => meetings.find((m) => m._id === selectedId) || null,
    [meetings, selectedId]
  );

  /* ============ LOAD MEETINGS ============ */
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyMeetings();
        const list = unwrapApiList(res);
        setMeetings(list);

        if (!selectedId && list.length > 0) {
          const completed = list.find((m) => m.status === "completed");
          const first = completed || list[0];
          setSearchParams({ meeting: first._id }, { replace: true });
        }
      } catch (err) {
        toast.error(getApiError(err, "Could not load meetings"));
      } finally {
        setLoadingMeetings(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============ LOAD INSIGHT + TRANSCRIPT ============ */
  const loadInsight = async (meetingId) => {
    setLoadingInsight(true);
    try {
      const res = await getMeetingAIInsight(meetingId);
      const data = unwrapApiData(res);
      setInsight(data?.insight || null);
    } catch {
      setInsight(null);
    } finally {
      setLoadingInsight(false);
    }
  };

  const loadTranscript = async (meetingId) => {
    setLoadingTranscript(true);
    try {
      const res = await getMeetingTranscript(meetingId);
      setTranscript(unwrapApiList(res));
    } catch {
      setTranscript([]);
    } finally {
      setLoadingTranscript(false);
    }
  };

  useEffect(() => {
    if (!selectedId) return;
    loadInsight(selectedId);
    loadTranscript(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ============ GENERATE ============ */
  const handleGenerate = async ({ force = false } = {}) => {
    if (!selectedId) return;
    setGenerating(true);
    try {
      const res = await generateMeetingAIInsight(selectedId, { force });
      unwrapApiData(res);
      toast.success(force ? "Regenerated" : "Generated successfully");
      await loadInsight(selectedId);
    } catch (err) {
      toast.error(getApiError(err, "Could not generate insights"));
    } finally {
      setGenerating(false);
    }
  };

  /* ============ INSIGHTS MAP ============ */
  const insightsMap = useMemo(() => {
    const map = {};
    if (selectedId && insight?.status === "completed") {
      map[selectedId] = "generated";
    } else if (selectedId && insight?.transcript) {
      map[selectedId] = "ready";
    }
    return map;
  }, [selectedId, insight]);

  /* ============ DERIVED ============ */
  const canGenerate = useMemo(() => {
    if (!selectedMeeting) return false;
    return (
      selectedMeeting.status !== "live" &&
      selectedMeeting.status !== "scheduled"
    );
  }, [selectedMeeting]);

  const durationMin =
    selectedMeeting?.startedAt && selectedMeeting?.endedAt
      ? Math.round(
          (new Date(selectedMeeting.endedAt) -
            new Date(selectedMeeting.startedAt)) /
            60000
        )
      : null;

  return (
    <div className="space-y-5">
      {/* ============ HERO ============ */}
      <AIInsightsHero />

      {/* ============ MAIN GRID ============ */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* LEFT: Meetings sidebar */}
        <div className="min-w-0">
          <MeetingsSidebar
            meetings={meetings}
            loading={loadingMeetings}
            selectedId={selectedId}
            onSelect={(meeting) => setSearchParams({ meeting: meeting._id })}
            insightsMap={insightsMap}
          />
        </div>

        {/* RIGHT: Selected meeting detail */}
        <div className="min-w-0">
          {!selectedMeeting ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-line bg-card p-10 text-center">
              <div>
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-fg-3" />
                <p className="text-sm font-semibold text-fg">
                  Select a meeting
                </p>
                <p className="mt-1 text-xs text-fg-3">
                  Choose a meeting from the list to view its AI insights
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ============ PANEL 1: MEETING HEADER ============ */}
              <div className="rounded-2xl border border-line bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: icon + title + meta + avatars */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                      <Users className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl font-bold leading-tight text-fg">
                        {selectedMeeting.title || "Untitled meeting"}
                      </h1>

                      {/* Meta row */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-3">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDateLong(
                            selectedMeeting.startedAt ||
                              selectedMeeting.scheduledAt
                          )}
                        </span>
                        {selectedMeeting.startedAt &&
                          selectedMeeting.endedAt && (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTimeRange(
                                selectedMeeting.startedAt,
                                selectedMeeting.endedAt
                              )}
                            </span>
                          )}
                        {durationMin && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(durationMin)}
                          </span>
                        )}
                      </div>

                      {/* Participants */}
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex items-center -space-x-2.5">
                          {(selectedMeeting.participants || [])
                            .slice(0, 4)
                            .map((p, i) => (
                              <div
                                key={p._id || i}
                                className="h-8 w-8 rounded-full border-2 border-card bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center text-accent-50 text-[10px] font-bold overflow-hidden"
                                title={p.fullName}
                              >
                                {p.avatar ? (
                                  <img
                                    src={p.avatar}
                                    alt={p.fullName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  (p.fullName?.[0] || "U").toUpperCase()
                                )}
                              </div>
                            ))}
                          {(selectedMeeting.participants || []).length > 4 && (
                            <div className="h-8 w-8 rounded-full border-2 border-card bg-accent-blue/10 flex items-center justify-center text-accent-blue text-[10px] font-bold">
                              +
                              {(selectedMeeting.participants || []).length - 4}
                            </div>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs text-fg-3">
                          <Users className="h-3.5 w-3.5" />
                          {(selectedMeeting.participants || []).length}{" "}
                          participants
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status + Actions */}
                  <div className="flex shrink-0 flex-col-reverse items-end gap-3">
                    {selectedMeeting.status === "completed" && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-accent-blue/20 bg-accent-blue/10 px-3 py-1.5 text-xs font-semibold text-accent-blue">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {selectedMeeting.status === "completed" && (
                        <button
                          onClick={() =>
                            navigate(
                              `/recordings?meeting=${selectedMeeting._id}`
                            )
                          }
                          className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-xs font-semibold text-fg transition hover:bg-card"
                        >
                          <Play className="h-4 w-4" />
                          Join Recording
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              `${window.location.origin}/meetings/${selectedMeeting._id}`
                            );
                            toast.success("Link copied");
                          } catch {
                            toast.error("Could not copy");
                          }
                        }}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-xs font-semibold text-fg transition hover:bg-card"
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </button>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-fg transition hover:bg-card"
                        title="More"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============ PANEL 2 + 3 + 4 GRID ============ */}
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="contents">
                  {/* PANEL 2: Tabs + Generate button in SAME ROW */}
                  {/* PANEL 3: Tab content */}
                  <AIInsightsTabs
                    insight={insight}
                    transcript={transcript}
                    loadingInsight={loadingInsight}
                    loadingTranscript={loadingTranscript}
                    onGenerate={() => handleGenerate()}
                    onRegenerate={() => handleGenerate({ force: true })}
                    generating={generating}
                    canGenerate={canGenerate}
                  />
                </div>

                {/* PANEL 4: Meeting Details */}
                <div className="min-w-0">
                  <MeetingDetailsPanel
                    meeting={selectedMeeting}
                    insight={insight}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}