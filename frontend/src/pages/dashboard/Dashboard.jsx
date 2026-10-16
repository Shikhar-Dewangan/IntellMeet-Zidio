import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Video, FolderKanban, CheckCircle2, Play, Plus, ArrowRight, CalendarDays,
  Zap, Sparkles, FileText, Calendar, BarChart3, ChevronRight, Clock, FolderOpen,
} from "lucide-react";

import { getAnalyticsOverview } from "../../services/analytics.service.js";
import { getMyMeetings } from "../../services/meeting.service.js";
import { getMyNotifications } from "../../services/notification.service.js";
import { getRecordings } from "../../services/recording.service.js";
import { getApiError, unwrapApiData, unwrapApiList } from "../../utils/apiData.js";
import { EmptyState, LoadingState } from "../../components/ui/Shared.jsx";
import { create } from "axios";

/* ───────────────────────────────────────────────────────────
   ROUTES — change here if your paths differ
   ─────────────────────────────────────────────────────────── */
const ROUTES = {
  newMeeting: "/meetings/new",
  joinMeeting: "/meetings/join",
  meetings: "/meetings",
  meetingById: (id) => `/meetings/${id}`,
  notifications: "/notifications",
  recordings: "/recordings",
  recordingById: (id) => `/recordings/${id}`,
  analytics: "/analytics",
};

/* Primary button color — matches your shell (blue-600). */
const PRIMARY_BTN =
  "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25";

/* ───────────────────────────────────────────────────────────
   RESPONSE MAPPING — if a field name differs in your API,
   add it to the key lists here. Nothing else needs to change.
   ─────────────────────────────────────────────────────────── */
const pick = (obj, keys, fallback = null) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return fallback;
};

const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const fmtTime = (d) =>
  d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

const fmtMinutes = (m) => {
  if (m === null || m === undefined || m === "") return "";
  if (typeof m === "string" && Number.isNaN(Number(m))) return m;
  const n = Number(m);
  if (n < 60) return `${n} min`;
  const h = n / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} ${h === 1 ? "hour" : "hours"}`;
};

const fmtClock = (v) => {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "string" && Number.isNaN(Number(v))) return v;
  const s = Math.round(Number(v));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const timeAgo = (v) => {
  const d = toDate(v);
  if (!d) return "";
  const min = Math.floor(Math.max(0, Date.now() - d.getTime()) / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
};

const mapMeeting = (m) => {
  const start = toDate(pick(m, ["startTime", "scheduledAt", "scheduledFor", "startsAt", "date"]));
  const people = pick(m, ["participants", "attendees", "members"], []);
  const list = Array.isArray(people) ? people : [];
  const total = pick(m, ["participantCount"], list.length);
  return {
    id: pick(m, ["_id", "id"]),
    start,
    time: fmtTime(start),
    title: pick(m, ["title", "name", "topic"], "Untitled meeting"),
    duration: fmtMinutes(pick(m, ["duration", "durationMinutes"])),
    platform: pick(m, ["platform", "provider"], "IntelliMeet"),
    attendees: list.slice(0, 3).map((p) => {
      const u = p?.user || p;
      return {
        name: pick(u, ["name", "fullName"], "U"),
        avatarUrl: pick(u, ["avatar", "avatarUrl", "profilePicture"]),
      };
    }),
    extra: Math.max(0, Number(total) - 3),
  };
};

const mapActivity = (n) => ({
  id: pick(n, ["_id", "id"]),
  text: pick(n, ["message", "title", "text"], ""),
  time: timeAgo(pick(n, ["createdAt", "time"])),
});

const mapRecording = (r) => ({
  id: pick(r, ["_id", "id"]),
  title: pick(r, ["title", "meetingTitle", "name"], "Recording"),
  duration: fmtClock(pick(r, ["duration", "durationSeconds"])),
  timestamp: timeAgo(pick(r, ["createdAt", "recordedAt"])),
  thumbnailUrl: pick(r, ["thumbnailUrl", "thumbnail"]),
});

/* ───────────────────────────────────────────────────────────
   STATIC STYLING CONFIG (no data in here)
   ─────────────────────────────────────────────────────────── */
const STAT_CARDS = [
  { key: "meetings", label: "Total Meetings", icon: Video, tint: "bg-blue-500/15 text-blue-500", keys: ["totalMeetings", "meetings", "meetingCount"] },
  { key: "projects", label: "Projects", icon: FolderKanban, tint: "bg-violet-500/15 text-violet-500", keys: ["totalProjects", "projects", "projectCount"] },
  { key: "tasks", label: "Tasks", icon: CheckCircle2, tint: "bg-emerald-500/15 text-emerald-500", keys: ["totalTasks", "tasks", "taskCount"] },
  { key: "recordings", label: "Recordings", icon: Play, tint: "bg-amber-500/15 text-amber-500", keys: ["totalRecordings", "recordings", "recordingCount"] },
];

const TIME_BADGE = [
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
];

const ACTIVITY_STYLES = [
  { icon: FileText, tint: "bg-violet-500/15 text-violet-500" },
  { icon: Video, tint: "bg-emerald-500/15 text-emerald-500" },
  { icon: FileText, tint: "bg-blue-500/15 text-blue-500" },
  { icon: FolderOpen, tint: "bg-amber-500/15 text-amber-500" },
];

const THUMB_GRADIENT = [
  "from-orange-500/80 via-rose-500/60 to-purple-700/80",
  "from-purple-700 via-fuchsia-600/70 to-pink-500/70",
  "from-slate-600 to-slate-900",
];

const cardCls =
  "min-w-0 rounded-2xl border border-line bg-card p-4 transition hover:shadow-md sm:p-5";

/* ───────────────────────────────────────────────────────────
   SMALL HELPERS (kept in this file)
   ─────────────────────────────────────────────────────────── */
function Avatar({ name, src, size = "h-8 w-8", className = "" }) {
  const initial = String(name || "U").charAt(0).toUpperCase();
  return src ? (
    <img src={src} alt={name} className={`${size} shrink-0 rounded-full object-cover ${className}`} />
  ) : (
    <span
      className={`${size} ${className} inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-purple to-accent-blue text-xs font-semibold text-white`}
    >
      {initial}
    </span>
  );
}

function CardHeader({ icon: Icon, tint, title, to }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tint}`}>
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="truncate text-sm font-semibold text-fg sm:text-base">{title}</h2>
      </div>
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        View all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function StatCard({ icon: Icon, tint, label, value }) {
  return (
    <div className={`${cardCls} flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-fg-3">{label}</p>
        <p className="text-2xl font-bold text-fg">{value}</p>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   PAGE
   ─────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  const [data, setData] = useState({ overview: null, meetings: [], notifications: [], recordings: [] });

  // {firstName} ← Redux auth user
  const firstName = useMemo(() => {
    const full = user?.name || user?.fullName || "";
    return full.trim().split(" ")[0] || "there";
  }, [user]);

  /* Fetch everything in parallel; one failure doesn't block the rest */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const results = await Promise.allSettled([
        getAnalyticsOverview(),
        getMyMeetings(),
        getMyNotifications(),
        getRecordings(),
      ]);
      if (cancelled) return;
      const [overviewR, meetingsR, notifR, recR] = results;

      const failed = results.find((r) => r.status === "rejected");
      if (failed) toast.error(getApiError(failed.reason), { id: "dashboard-error" });

      setData({
        overview: overviewR.status === "fulfilled" ? unwrapApiData(overviewR.value) : null,
        meetings: meetingsR.status === "fulfilled" ? unwrapApiList(meetingsR.value) : [],
        notifications: notifR.status === "fulfilled" ? unwrapApiList(notifR.value) : [],
        recordings: recR.status === "fulfilled" ? unwrapApiList(recR.value) : [],
      });
      setNow(Date.now());
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* Derived view data */
  const stats = STAT_CARDS.map((c) => {
    const rawValue = pick(data.overview, c.keys);
    const value =
      rawValue && typeof rawValue === "object"
        ? pick(rawValue, ["total", "count"], 0)
        : rawValue ?? (data.overview ? 0 : "—");

    return { ...c, value };
  });

  const upcoming = useMemo(() => {
    return data.meetings
      .map(mapMeeting)
      .filter((m) => !m.start || m.start.getTime() >= now)
      .sort((a, b) => (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity))
      .slice(0, 3);
  }, [data.meetings, now]);

  const activities = data.notifications.slice(0, 4).map(mapActivity);
  const recordings = data.recordings.slice(0, 3).map(mapRecording);

  // AI Insights: no dedicated service, so read from the analytics overview if present.
  const insight = pick(data.overview, ["aiInsight", "insight"]);
  const insightTitle = typeof insight === "string" ? insight : pick(insight, ["title", "headline"]);
  const insightBody = typeof insight === "string" ? "" : pick(insight, ["description", "body", "summary"], "");

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5">
      {/* ── SECTION 1: HERO ── {firstName} from Redux */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-linear-to-br from-white to-slate-100 dark:from-[#171726] dark:to-[#0a0a0f]">
        <div className="grid items-center md:grid-cols-2">
          <div className="relative z-10 p-5 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-500 dark:text-blue-400">
              Welcome back
            </p>
            <h1 className="mt-2 text-2xl font-bold text-fg sm:text-3xl lg:text-4xl">Hello, {firstName} </h1>
            <p className="mt-3 max-w-md text-sm text-fg-2">
              Here's what's happening with your meetings, tasks and projects today. Let's make progress!
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={ROUTES.meetings}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${PRIMARY_BTN}`}
              >
                <Plus className="h-4 w-4" /> New Meeting
              </Link>
              <Link
                to={ROUTES.joinMeeting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:bg-[#1A1A22] dark:text-slate-100 dark:hover:bg-[#22222E]"
              >
                Join with code <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Illustration — hidden on mobile */}
          <div className="relative hidden h-72 md:block" aria-hidden="true">
            <div className="absolute left-1/4 top-4 h-40 w-40 rounded-full bg-blue-500/30 blur-[80px]" />
            <div className="absolute right-1/4 top-16 h-48 w-48 rounded-full bg-violet-500/30 blur-[80px]" />
            <div className="absolute bottom-0 left-1/2 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-[60px]" />

            <div className="absolute left-1/2 top-1/2 h-56 w-64 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm" />

            <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 rotate-6 items-center justify-center rounded-2xl bg-linear-to-br from-accent-purple to-accent-blue text-white shadow-2xl shadow-[#7C5CFF]/40">
              <Video className="h-12 w-12" />
            </div>

            <div className="absolute left-[14%] top-[18%] flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-card text-blue-500 shadow-xl lg:left-[18%]">
              <FileText className="h-6 w-6" />
            </div>
            <div className="absolute right-[10%] top-[12%] flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-card text-emerald-500 shadow-xl lg:right-[16%]">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div className="absolute bottom-[14%] right-[14%] flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-card text-rose-500 shadow-xl lg:right-[20%]">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="absolute bottom-[18%] left-[16%] flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-card text-violet-500 shadow-xl lg:left-[22%]">
              <Sparkles className="h-5 w-5" />
            </div>

            <span className="absolute left-[8%] top-[40%] h-1.5 w-1.5 rounded-full bg-violet-400/70" />
            <span className="absolute right-[5%] top-[50%] h-2 w-2 rounded-full bg-blue-400/70" />
            <span className="absolute bottom-[10%] left-[48%] h-1.5 w-1.5 rounded-full bg-fuchsia-400/70" />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: STAT CARDS ── value ← getAnalyticsOverview() */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.key} icon={s.icon} tint={s.tint} label={s.label} value={s.value} />
        ))}
      </section>

      {/* ── SECTION 3: UPCOMING MEETINGS + RECENT ACTIVITY ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Upcoming Meetings ← getMyMeetings() */}
        <div className={`${cardCls} lg:col-span-2`}>
          <CardHeader icon={CalendarDays} tint="bg-blue-500/15 text-blue-500" title="Upcoming Meetings" to={ROUTES.meetings} />
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming meetings" description="Scheduled meetings will show up here." />
          ) : (
            <div className="space-y-2">
              {upcoming.map((m, i) => (
                <div
                  key={m.id ?? i}
                  className="flex flex-col gap-3 rounded-xl p-2 transition hover:bg-card-hover sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-bold ${TIME_BADGE[i % 3]}`}>
                      {m.time || "—"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{m.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-fg-3">
                        {m.duration && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 shrink-0" /> {m.duration}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Video className="h-3.5 w-3.5 shrink-0" /> {m.platform}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="flex items-center -space-x-2">
                      {m.attendees.map((a, j) => (
                        <Avatar key={j} name={a.name} src={a.avatarUrl} className="ring-2 ring-card" />
                      ))}
                      {m.extra > 0 && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-medium text-fg-2 ring-2 ring-card">
                          +{m.extra}
                        </span>
                      )}
                    </div>
                    <Link
                      to={ROUTES.meetingById(m.id)}
                      className={`shrink-0 rounded-xl px-4 py-1.5 text-sm font-semibold transition ${PRIMARY_BTN}`}
                    >
                      Join
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity ← getMyNotifications() */}
        <div className={`${cardCls} lg:col-span-1`}>
          <CardHeader icon={Zap} tint="bg-amber-500/15 text-amber-500" title="Recent Activity" to={ROUTES.notifications} />
          {activities.length === 0 ? (
            <EmptyState title="No recent activity" description="New updates will appear here." />
          ) : (
            <ul className="space-y-4">
              {activities.map((a, i) => {
                const { icon: Icon, tint } = ACTIVITY_STYLES[i % 4];
                return (
                  <li key={a.id ?? i} className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-fg-2">{a.text}</p>
                      <p className="text-xs text-fg-3">{a.time}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ── SECTION 4: RECENT RECORDINGS + AI INSIGHTS ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Recordings ← getRecordings() */}
        <div className={`${cardCls} lg:col-span-2`}>
          <CardHeader icon={Play} tint="bg-violet-500/15 text-violet-500" title="Recent Recordings" to={ROUTES.recordings} />
          {recordings.length === 0 ? (
            <EmptyState title="No recordings yet" description="Recorded meetings will appear here." />
          ) : (
            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3">
              {recordings.map((r, i) => (
                <Link key={r.id ?? i} to={ROUTES.recordingById(r.id)} className="group block min-w-0">
                  <div className={`relative aspect-video overflow-hidden rounded-xl bg-linear-to-br ${THUMB_GRADIENT[i % 3]}`}>
                    {r.thumbnailUrl && (
                      <img src={r.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition group-hover:scale-110">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    </span>
                    {r.duration && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
                        {r.duration}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{r.title}</p>
                    <p className="text-xs text-fg-3">{r.timestamp}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights ← analytics overview (aiInsight / insight) */}
        <div className={`${cardCls} lg:col-span-1`}>
          <CardHeader icon={Sparkles} tint="bg-violet-500/15 text-violet-500" title="AI Insights" to={ROUTES.analytics} />
          {insightTitle ? (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-linear-to-br from-blue-600/10 to-accent-violet/5 p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-accent-purple to-accent-blue text-base font-bold text-white">
                AI
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-fg">{insightTitle}</p>
                {insightBody && <p className="mt-1 text-xs text-fg-2">{insightBody}</p>}
              </div>
              <Link
                to={ROUTES.analytics}
                aria-label="Open insights"
                className="shrink-0 rounded-lg p-1.5 text-blue-600 hover:bg-surface dark:text-blue-400"
              >
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          ) : (
            <EmptyState title="No insights yet" description="AI insights will appear after a few meetings." />
          )}
        </div>
      </section>
    </div>
  );
}
