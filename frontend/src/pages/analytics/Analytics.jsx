import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3, Users, FolderKanban, Calendar, CheckCircle2, ListTodo,
  Activity, TrendingUp, ArrowRight, Target, Bell,
} from "lucide-react";
import {
  getAnalyticsOverview,
  getAnalyticsTrends,
  getTeamsPerformance,
  getProjectsOverview,
  getRecentActivity,
  getUpcomingDeadlines,
} from "../../services/analytics.service.js";
import { getApiError, unwrapApiData, unwrapApiList } from "../../utils/apiData.js";
import { LoadingState } from "../../components/ui/Shared.jsx";
import StatTileWithTrend from "../../components/analytics/StatTileWithTrend.jsx";
import ChartCard from "../../components/analytics/ChartCard.jsx";
import ProductivityChart from "../../components/analytics/ProductivityChart.jsx";
import MeetingActivityChart from "../../components/analytics/MeetingActivityChart.jsx";
import TaskStatusDonut from "../../components/analytics/TaskStatusDonut.jsx";
import ProjectsOverviewDonut from "../../components/analytics/ProjectsOverviewDonut.jsx";
import TeamsPerformanceTable from "../../components/analytics/TeamsPerformanceTable.jsx";
import RecentActivityFeed from "../../components/analytics/RecentActivityFeed.jsx";
import UpcomingDeadlines from "../../components/analytics/UpcomingDeadlines.jsx";

const emptyAnalytics = {
  teams: { total: 0 },
  projects: { total: 0 },
  meetings: { total: 0, byStatus: {}, averageCompletedDurationMs: 0 },
  tasks: { total: 0, byStatus: {} },
  actionItems: { total: 0, byStatus: {} },
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [trends, setTrends] = useState([]);
  const [teamsPerformance, setTeamsPerformance] = useState([]);
  const [projectsOverview, setProjectsOverview] = useState({ total: 0, byStatus: {} });
  const [recentActivity, setRecentActivity] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30d");

  // Load overview on mount
  useEffect(() => {
    getAnalyticsOverview()
      .then((response) =>
        setAnalytics({ ...emptyAnalytics, ...unwrapApiData(response) })
      )
      .catch((error) =>
        toast.error(getApiError(error, "Could not load analytics"))
      );
  }, []);

  // Load trends when range changes
  useEffect(() => {
    getAnalyticsTrends(dateRange)
      .then((response) => {
        const data = unwrapApiData(response);
        setTrends(data?.data || []);
      })
      .catch((error) => {
        console.error("Trends error:", error);
        setTrends([]);
      });
  }, [dateRange]);

  // Load other data once
  useEffect(() => {
    Promise.allSettled([
      getTeamsPerformance().then((r) => setTeamsPerformance(unwrapApiList(r))),
      getProjectsOverview().then((r) => setProjectsOverview(unwrapApiData(r) || { total: 0, byStatus: {} })),
      getRecentActivity(8).then((r) => setRecentActivity(unwrapApiList(r))),
      getUpcomingDeadlines(8).then((r) => setDeadlines(unwrapApiList(r))),
    ]).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const meetings = analytics.meetings || {};
    const tasks = analytics.tasks || {};
    const projects = analytics.projects || {};
    const teams = analytics.teams || {};

    return {
      teams: teams.total ?? 0,
      projects: projects.total ?? 0,
      meetings: meetings.total ?? 0,
      tasks: tasks.total ?? 0,
      avgDuration: Math.round(
        (meetings.averageCompletedDurationMs ?? 0) / 60000
      ),
    };
  }, [analytics]);

  const tabs = [
    { value: "overview", label: "Overview", icon: BarChart3 },
    { value: "teams", label: "Teams", icon: Users },
    { value: "projects", label: "Projects", icon: FolderKanban },
    { value: "meetings", label: "Meetings", icon: Calendar },
    { value: "tasks", label: "Tasks", icon: ListTodo },
    { value: "activity", label: "Activity", icon: Activity },
  ];

  if (loading) return <LoadingState text="Loading analytics..." />;

  return (
    <div className="space-y-5">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg">Analytics</h1>
          <p className="mt-1 text-sm text-fg-2">
            Track your productivity, team collaboration, and overall progress.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 cursor-pointer"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* ============ 4 STAT CARDS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTileWithTrend
          icon={Users}
          value={stats.teams}
          label="Total Teams"
          sub="Active teams"
          trend="+0%"
          to="/teams"
          iconBg="bg-accent-blue/15"
          iconColor="text-accent-blue"
        />
        <StatTileWithTrend
          icon={FolderKanban}
          value={stats.projects}
          label="Total Projects"
          sub="Across workspace"
          trend="+0%"
          to="/projects"
          iconBg="bg-accent-violet/15"
          iconColor="text-accent-violet"
        />
        <StatTileWithTrend
          icon={Calendar}
          value={stats.meetings}
          label="Total Meetings"
          sub={`Avg ${stats.avgDuration}m duration`}
          trend="+0%"
          to="/meetings"
          iconBg="bg-accent-blue/15"
          iconColor="text-accent-blue"
        />
        <StatTileWithTrend
          icon={CheckCircle2}
          value={stats.tasks}
          label="Total Tasks"
          sub={`${analytics.tasks?.byStatus?.completed ?? 0} completed`}
          trend="+0%"
          to="/tasks"
          iconBg="bg-accent-emerald/15"
          iconColor="text-accent-emerald"
        />
      </div>

      {/* ============ TABS ============ */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-surface border border-line">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
                active
                  ? "bg-accent-blue text-white shadow-sm"
                  : "text-fg-2 hover:text-fg hover:bg-card"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ============ OVERVIEW TAB ============ */}
      {activeTab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Productivity Chart (Bar) */}
          <ChartCard
            title="Productivity Overview"
            subtitle="Meetings vs Projects vs Tasks"
            icon={TrendingUp}
            className="lg:col-span-2"
          >
            <ProductivityChart data={trends} />
          </ChartCard>

          {/* Task Status Donut */}
          <ChartCard
            title="Task Status"
            subtitle="Current breakdown"
            icon={CheckCircle2}
            action={
              <span className="text-[11px] font-semibold text-fg-3">
                {stats.tasks} total
              </span>
            }
          >
            <TaskStatusDonut
              data={analytics.tasks?.byStatus || {}}
              total={stats.tasks}
            />
          </ChartCard>

          {/* Meeting Activity Chart */}
          <ChartCard
            title="Meeting Activity"
            subtitle={`Last ${dateRange}`}
            icon={Calendar}
            className="lg:col-span-2"
          >
            <MeetingActivityChart data={trends} />
          </ChartCard>

          {/* Projects Overview Donut */}
          <ChartCard
            title="Projects Overview"
            subtitle="By status"
            icon={FolderKanban}
          >
            <ProjectsOverviewDonut
              data={projectsOverview?.byStatus || {}}
              total={projectsOverview?.total || 0}
            />
          </ChartCard>

          {/* Teams Performance Table */}
          <ChartCard
            title="Teams Performance"
            subtitle="Top performing teams"
            icon={Users}
            className="lg:col-span-3"
            action={
              <Link
                to="/teams"
                className="text-xs font-semibold text-accent-blue hover:underline"
              >
                View all
              </Link>
            }
          >
            <TeamsPerformanceTable teams={teamsPerformance} />
          </ChartCard>

          {/* Recent Activity Feed */}
          <ChartCard
            title="Recent Activity"
            subtitle="What's happening"
            icon={Activity}
            className="lg:col-span-2"
            action={
              <button className="text-xs font-semibold text-accent-blue hover:underline">
                View all
              </button>
            }
          >
            <RecentActivityFeed activities={recentActivity} />
          </ChartCard>

          {/* Upcoming Deadlines */}
          <ChartCard
            title="Upcoming Deadlines"
            subtitle="Don't miss these"
            icon={Bell}
          >
            <UpcomingDeadlines deadlines={deadlines} />
          </ChartCard>

          {/* Quick Navigation */}
          <div className="rounded-2xl border border-line bg-card overflow-hidden lg:col-span-3">
            <div className="px-4 py-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent-blue" />
                <h3 className="text-sm font-semibold text-fg">
                  Quick Navigation
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
              <QuickNav to="/teams" icon={Users} title="Teams" sub="Manage your teams" bg="bg-accent-blue/15" color="text-accent-blue" />
              <QuickNav to="/projects" icon={FolderKanban} title="Projects" sub="Track projects" bg="bg-accent-violet/15" color="text-accent-violet" />
              <QuickNav to="/meetings" icon={Calendar} title="Meetings" sub="Schedule meetings" bg="bg-accent-blue/15" color="text-accent-blue" />
              <QuickNav to="/tasks" icon={CheckCircle2} title="Tasks" sub="Manage tasks" bg="bg-accent-emerald/15" color="text-accent-emerald" />
            </div>
          </div>
        </div>
      )}

      {/* ============ TEAMS TAB ============ */}
      {activeTab === "teams" && (
        <ChartCard title="Teams Performance" subtitle="All teams breakdown" icon={Users}>
          <TeamsPerformanceTable teams={teamsPerformance} />
        </ChartCard>
      )}

      {/* ============ PROJECTS TAB ============ */}
      {activeTab === "projects" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Projects Overview" subtitle="By status" icon={FolderKanban}>
            <ProjectsOverviewDonut
              data={projectsOverview?.byStatus || {}}
              total={projectsOverview?.total || 0}
            />
          </ChartCard>
          <ChartCard title="Project Trend" subtitle={`Last ${dateRange}`} icon={TrendingUp}>
            <ProductivityChart data={trends} />
          </ChartCard>
        </div>
      )}

      {/* ============ MEETINGS TAB ============ */}
      {activeTab === "meetings" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Meeting Status" subtitle="Current breakdown" icon={Calendar}>
            <TaskStatusDonut
              data={analytics.meetings?.byStatus || {}}
              total={stats.meetings}
            />
          </ChartCard>
          <ChartCard title="Meeting Trend" subtitle={`Last ${dateRange}`} icon={TrendingUp}>
            <MeetingActivityChart data={trends} />
          </ChartCard>
        </div>
      )}

      {/* ============ TASKS TAB ============ */}
      {activeTab === "tasks" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Task Status" subtitle="Current breakdown" icon={CheckCircle2}>
            <TaskStatusDonut
              data={analytics.tasks?.byStatus || {}}
              total={stats.tasks}
            />
          </ChartCard>
          <ChartCard title="Upcoming Deadlines" subtitle="Tasks needing attention" icon={Bell}>
            <UpcomingDeadlines deadlines={deadlines} />
          </ChartCard>
        </div>
      )}

      {/* ============ ACTIVITY TAB ============ */}
      {activeTab === "activity" && (
        <ChartCard title="Recent Activity" subtitle="Latest updates" icon={Activity}>
          <RecentActivityFeed activities={recentActivity} />
        </ChartCard>
      )}
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */
function QuickNav({ to, icon: Icon, title, sub, bg, color }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-line bg-surface/50 hover:bg-surface hover:border-accent-blue/30 p-3 transition"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-fg truncate">{title}</p>
        <p className="text-[10px] text-fg-3 truncate">{sub}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-fg-3 transition group-hover:translate-x-0.5 shrink-0" />
    </Link>
  );
}