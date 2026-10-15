import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

export default function ProductivityChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-fg-3">No data available</p>
      </div>
    );
  }

  // Sample down if too many points
  const sampled =
    data.length > 30
      ? data.filter((_, i) => i % Math.ceil(data.length / 30) === 0)
      : data;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="p-4">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={sampled} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(51 65 85 / 0.3)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: "rgb(148 163 184)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgb(148 163 184)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgb(15 23 42)",
              border: "1px solid rgb(51 65 85)",
              borderRadius: "10px",
              fontSize: "12px",
              color: "white",
            }}
            labelFormatter={(label) => formatDate(label)}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="meetings" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Meetings" />
          <Bar dataKey="projects" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Projects" />
          <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} name="Tasks" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}