import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Play,
  Plus,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import { getAnalyticsOverview } from "../../services/analytics.service.js";
import { getMyMeetings } from "../../services/meeting.service.js";
import { getMyNotifications } from "../../services/notification.service.js";
import { getRecordings } from "../../services/recording.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";
import { EmptyState, LoadingState } from "../../components/ui/Shared.jsx";

const emptyAnalytics = {
  meetings: { total: 0 },
  projects: { total: 0 },
  tasks: { total: 0 },
};

function StatCard({ label, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-slate-500">{label}</p>
          <p className="mt-0.5 text-2xl font-bold leading-tight text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Date not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date not set" : date.toLocaleString();
}

/* ============================================================
   MAIN DASHBOARD
   ============================================================ */

export default function Dashboard() {
  const user = useSelector((state) => state.auth.user);
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [meetings, setMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      getAnalyticsOverview(),
      getMyMeetings(),
      getMyNotifications(),
      getRecordings(),
    ]).then(
      ([
        analyticsResult,
        meetingsResult,
        notificationsResult,
        recordingsResult,
      ]) => {
        if (!isMounted) return;

        const results = [
          analyticsResult,
          meetingsResult,
          notificationsResult,
          recordingsResult,
        ];
        const failedRequest = results.find(
          (result) => result.status === "rejected",
        );
        if (failedRequest) {
          toast.error(
            getApiError(
              failedRequest.reason,
              "Some dashboard data could not be loaded",
            ),
          );
        }

        if (analyticsResult.status === "fulfilled") {
          setAnalytics({
            ...emptyAnalytics,
            ...(unwrapApiData(analyticsResult.value) || {}),
          });
        }
        if (meetingsResult.status === "fulfilled")
          setMeetings(unwrapApiList(meetingsResult.value));
        if (notificationsResult.status === "fulfilled")
          setNotifications(unwrapApiList(notificationsResult.value));
        if (recordingsResult.status === "fulfilled")
          setRecordings(unwrapApiList(recordingsResult.value));
        setLoading(false);
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const firstName = user?.fullName?.trim()?.split(/\s+/)[0] || user?.username;
  const now = Date.now();
  const upcomingMeetings = meetings
    .filter((meeting) => {
      if (meeting.status !== "scheduled" && meeting.status !== "upcoming")
        return false;
      return (
        !meeting.scheduledAt || new Date(meeting.scheduledAt).getTime() >= now
      );
    })
    .sort((first, second) => {
      const firstTime = first.scheduledAt
        ? new Date(first.scheduledAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const secondTime = second.scheduledAt
        ? new Date(second.scheduledAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return firstTime - secondTime;
    })
    .slice(0, 4);
  const recentNotifications = [...notifications]
    .sort(
      (first, second) =>
        new Date(second.createdAt || 0) - new Date(first.createdAt || 0),
    )
    .slice(0, 4);
  const recentRecordings = [...recordings]
    .sort(
      (first, second) =>
        new Date(second.recordedAt || second.createdAt || 0) -
        new Date(first.recordedAt || first.createdAt || 0),
    )
    .slice(0, 3);
  const stats = [
    {
      id: "meetings",
      label: "Total Meetings",
      value: analytics.meetings?.total ?? 0,
      icon: Video,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: "projects",
      label: "Projects",
      value: analytics.projects?.total ?? 0,
      icon: FolderKanban,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      id: "tasks",
      label: "Tasks",
      value: analytics.tasks?.total ?? 0,
      icon: CheckCircle2,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      id: "recordings",
      label: "Recordings",
      value: recordings.length,
      icon: Play,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  if (loading) return <LoadingState text="Loading your workspace..." />;

  return (
    <div className="space-y-5">
      {/* ============ WELCOME HERO ============ */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-50 via-white to-violet-50 border border-slate-200">
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none">
          <div className="absolute top-1/2 -translate-y-1/2 right-12 w-64 h-64">
            <div className="absolute -top-4 right-10 w-32 h-32 rounded-full bg-blue-400/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-violet-400/30 blur-3xl" />
            <div className="absolute top-10 left-0 w-24 h-24 rounded-full bg-fuchsia-400/20 blur-2xl" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-3xl bg-linear-to-br from-blue-500 to-violet-600 shadow-2xl shadow-blue-500/30 flex items-center justify-center rotate-6">
              <Video className="w-10 h-10 text-white" />
            </div>

            <div className="absolute top-0 left-4 w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center -rotate-6">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="absolute top-4 -right-2 w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center rotate-12">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="absolute bottom-4 -right-2 w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center -rotate-6">
              <Calendar className="w-6 h-6 text-rose-500" />
            </div>
            <div className="absolute bottom-0 left-8 w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center rotate-6">
              <Sparkles className="w-5 h-5 text-violet-500" />
            </div>

            <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 rounded-full bg-blue-400" />
            <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-violet-400" />
          </div>
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="max-w-xl">
            <span className="inline-block text-[11px] font-semibold tracking-[0.15em] uppercase text-blue-600 mb-3">
              Welcome back
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
              Hi{firstName ? `, ${firstName}` : " there"}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-md">
              Here's what's happening with your meetings, tasks and projects
              today. Let's make progress!
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/meetings/create"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/25"
              >
                <Plus className="w-4 h-4" />
                New Meeting
              </Link>
              <Link
                to="/meetings"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-50 transition"
              >
                <ArrowRight className="w-4 h-4" />
                View meetings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STAT CARDS ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* ============ UPCOMING + ACTIVITY ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upcoming Meetings */}
        <section className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Upcoming Meetings
              </h2>
            </div>
            <Link
              to="/meetings"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingMeetings.length ? (
              upcomingMeetings.map((meeting) => (
                <div
                  key={meeting._id}
                  className="flex items-center gap-3 sm:gap-4 px-5 py-4 hover:bg-slate-50 transition"
                >
                  <span className="shrink-0 rounded-md bg-blue-100 px-2.5 py-1.5 text-[11px] font-bold text-blue-700">
                    {meeting.scheduledAt
                      ? new Date(meeting.scheduledAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "Scheduled"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {meeting.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {formatDate(meeting.scheduledAt)}
                    </p>
                  </div>
                  <Link
                    to={`/meetings/${meeting._id}`}
                    className="shrink-0 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    View
                  </Link>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Calendar}
                title="No upcoming meetings"
                description="Scheduled meetings will appear here."
              />
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Recent Activity
              </h2>
            </div>
            <Link
              to="/notifications"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <ul className="divide-y divide-slate-100">
            {recentNotifications.length ? (
              recentNotifications.map((notification) => (
                <li
                  key={notification._id}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-slate-900">
                      {notification.title ||
                        notification.message ||
                        "Notification"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <EmptyState
                  icon={Bell}
                  title="No recent activity"
                  description="Workspace updates will appear here."
                />
              </li>
            )}
          </ul>
        </section>
      </div>

      {/* ============ RECORDINGS + AI INSIGHTS ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Recordings */}
        <section className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <Play className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Recent Recordings
              </h2>
            </div>
            <Link
              to="/recordings"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRecordings.length ? (
              recentRecordings.map((recording) => (
                <Link
                  key={recording._id}
                  to={`/recordings/${recording._id}`}
                  className="group min-w-0"
                >
                  <div className="mb-3 flex aspect-video items-center justify-center rounded-xl bg-slate-100 transition group-hover:bg-slate-200  ">
                    <Play className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {recording.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(recording.recordedAt || recording.createdAt)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-3">
                <EmptyState
                  icon={Play}
                  title="No recordings yet"
                  description="Recordings from your meetings will appear here."
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
