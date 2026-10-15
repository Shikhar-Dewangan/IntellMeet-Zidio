// frontend/src/components/project/TeamBadges.jsx
import { Link } from "react-router-dom";
import { Users } from "lucide-react";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamBadges({
  teams = [],
  max = 2,
  size = "sm",
  className = "",
}) {
  if (!Array.isArray(teams) || teams.length === 0) return null;

  const visible = teams.slice(0, max);
  const extra = Math.max(0, teams.length - max);

  const sizes = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <div className={`flex items-center flex-wrap gap-1.5 ${className}`}>
      {visible.map((team) => {
        return (
          <Link
            key={team._id}
            to={`/teams/${team._id}`}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center rounded-md border border-accent-blue/20 bg-accent-blue/15 font-semibold text-accent-blue transition hover:opacity-80 ${sizes[size]}`}
            title={team.name}
          >
            <Users className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-25">
              {team.name || getInitials(team.name)}
            </span>
          </Link>
        );
      })}

      {extra > 0 && (
        <span
          className={`inline-flex items-center rounded-md border border-line bg-surface font-semibold text-fg-3 ${sizes[size]}`}
          title={`${extra} more team${extra > 1 ? "s" : ""}`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}