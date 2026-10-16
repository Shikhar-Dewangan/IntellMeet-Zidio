import { Link } from "react-router-dom";
import { Users, TrendingUp } from "lucide-react";

const COLORS = [
  "from-rose-500 to-rose-700",
  "from-violet-500 to-violet-700",
  "from-blue-500 to-blue-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
];

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function TeamsPerformanceTable({ teams = [] }) {
  if (!teams || teams.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
          <Users className="h-5 w-5 text-fg-3" />
        </div>
        <p className="text-sm text-fg-2">No teams to show</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-3">
              Team
            </th>
            <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-fg-3">
              Projects
            </th>
            <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-fg-3">
              Meetings
            </th>
            <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-fg-3">
              Tasks
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-3">
              Progress
            </th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => (
            <tr
              key={team._id}
              className="border-b border-line last:border-0 hover:bg-surface/30 transition"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/teams/${team._id}`}
                  className="flex items-center gap-3 group"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${COLORS[i % COLORS.length]} text-white text-xs font-bold`}
                  >
                    {getInitials(team.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-fg truncate group-hover:text-accent-blue transition">
                      {team.name}
                    </p>
                    <p className="text-[10px] text-fg-3">
                      {team.memberCount} members
                    </p>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-fg">
                  {team.projects}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-xs font-semibold text-fg">
                  {team.meetings}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-xs font-semibold text-fg">
                  {team.tasks}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-35">
                  <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-accent-blue to-accent-emerald transition-all"
                      style={{ width: `${team.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-fg w-10 text-right">
                    {team.progress}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}