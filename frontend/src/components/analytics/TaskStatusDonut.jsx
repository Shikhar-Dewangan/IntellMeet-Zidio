import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  completed: "#10b981",
  "in-progress": "#3b82f6",
  todo: "#94a3b8",
  overdue: "#ef4444",
  open: "#f59e0b",
  pending: "#f59e0b",
};

const LABELS = {
  completed: "Completed",
  "in-progress": "In Progress",
  todo: "Todo",
  overdue: "Overdue",
  open: "Open",
  pending: "Pending",
};

export default function TaskStatusDonut({ data = {}, total = 0 }) {
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key] || key,
      value,
      color: COLORS[key] || "#64748b",
      key,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="h-32 w-32 rounded-full border-8 border-surface flex items-center justify-center">
          <span className="text-2xl font-bold text-fg-3">0</span>
        </div>
        <p className="mt-3 text-xs text-fg-3">No tasks yet</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgb(15 23 42)",
                border: "1px solid rgb(51 65 85)",
                borderRadius: "10px",
                fontSize: "12px",
                color: "white",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold text-fg">{total}</p>
          <p className="text-[10px] text-fg-3 uppercase tracking-wider">
            Total
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[11px] text-fg-2 truncate">
              {item.name}
            </span>
            <span className="ml-auto text-[11px] font-semibold text-fg">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}