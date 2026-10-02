import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, CheckCircle2, Clock3, Users } from "lucide-react";
import { getAnalyticsOverview } from "../../services/analytics.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";
import {
  LoadingState,
  PageHeader,
  SectionCard,
} from "../../components/ui/Shared.jsx";

const emptyAnalytics = {
  meetings: {},
  projects: {},
  tasks: {},
  actionItems: {},
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsOverview()
      .then((response) =>
        setAnalytics({ ...emptyAnalytics, ...unwrapApiData(response) }),
      )
      .catch((error) =>
        toast.error(getApiError(error, "Could not load analytics")),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState text="Loading analytics..." />;

  const stats = [
    ["Total Meetings", analytics.meetings?.total ?? 0, Users],
    [
      "Average Meeting",
      `${((analytics.meetings?.averageCompletedDurationMs ?? 0) / 60000).toFixed(0)}m`,
      Clock3,
    ],
    [
      "Tasks Completed",
      analytics.tasks?.byStatus?.completed ?? 0,
      CheckCircle2,
    ],
    ["Action Items", analytics.actionItems?.total ?? 0, BarChart3],
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Insights and metrics from your workspace."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5  "
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600  ">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs text-slate-500 ">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 ">{value}</p>
          </div>
        ))}
      </div>

      <SectionCard title="Status overview" icon={BarChart3}>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Metric
            label="Scheduled meetings"
            value={analytics.meetings?.byStatus?.scheduled ?? 0}
          />
          <Metric
            label="In-progress tasks"
            value={analytics.tasks?.byStatus?.["in-progress"] ?? 0}
          />
          <Metric
            label="Open action items"
            value={analytics.actionItems?.byStatus?.open ?? 0}
          />
        </div>
      </SectionCard>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 ">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900 ">{value}</p>
    </div>
  );
}
