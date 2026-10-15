// frontend/src/components/project/ProjectCard.jsx
import { Link } from "react-router-dom";
import { Calendar, Star, MoreVertical, GitBranch } from "lucide-react";
import ProjectMembers from "./ProjectMembers.jsx";
import TeamBadges from "./TeamBadges.jsx";

const STATUS_CONFIG = {
  planning: {
    label: "Planning",
    cls: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
  },
  active: {
    label: "Active",
    cls: "bg-accent-blue/15 text-accent-blue border-accent-blue/20",
    dot: "bg-accent-blue",
  },
  completed: {
    label: "Completed",
    cls: "bg-accent-emerald/15 text-accent-emerald border-accent-emerald/20",
    dot: "bg-accent-emerald",
  },
  archived: {
    label: "Archived",
    cls: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
  },
};

function getStatusBadge(project) {
  const now = new Date();
  const isOverdue =
    project.dueDate &&
    new Date(project.dueDate) < now &&
    project.status !== "completed" &&
    project.status !== "archived";

  if (isOverdue && project.status === "active") {
    return {
      label: "At Risk",
      cls: "bg-accent-rose/15 text-accent-rose border-accent-rose/20",
      dot: "bg-accent-rose",
    };
  }

  return STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
}

function formatDate(iso) {
  if (!iso) return "No date";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectCard({
  project,
  onDelete,
  onToggleFavorite,
  favorite,
  menuOpen,
  setMenuOpen,
}) {
  const status = getStatusBadge(project);
  const memberCount = project.members?.length || 0;
  const teamCount = project.teams?.length || 0;

  return (
    <div className="group relative rounded-2xl border border-line bg-card p-4 hover:shadow-lg hover:border-accent-blue/30 transition">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-blue/15"
        >
          <GitBranch className="h-5 w-5 text-accent-blue" />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite?.(project._id)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
              favorite
                ? "text-accent-amber"
                : "text-fg-3 hover:text-accent-amber hover:bg-surface"
            }`}
            aria-label={favorite ? "Remove favorite" : "Add favorite"}
          >
            <Star
              className={`h-3.5 w-3.5 ${favorite ? "fill-current" : ""}`}
            />
          </button>
          <div className="relative">
            <button
              onClick={() =>
                setMenuOpen?.(menuOpen ? null : project._id)
              }
              className="flex h-7 w-7 items-center justify-center rounded-lg text-fg-3 hover:bg-surface transition"
              aria-label="More options"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen?.(null)}
                />
                <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-line bg-card shadow-xl overflow-hidden">
                  <Link
                    to={`/projects/${project._id}`}
                    className="block px-3 py-2 text-xs font-medium text-fg hover:bg-surface transition"
                  >
                    View details
                  </Link>
                  <button
                    onClick={() => onDelete?.(project._id)}
                    className="flex w-full items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent-rose hover:bg-accent-rose/10 transition border-t border-line"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Title + description */}
      <Link to={`/projects/${project._id}`} className="block group/title">
        <h3 className="text-sm font-bold text-fg group-hover/title:text-accent-blue transition truncate">
          {project.name}
        </h3>
      </Link>
      <p className="mt-1 text-xs text-fg-3 leading-relaxed line-clamp-2 min-h-8">
        {project.description || "No description provided"}
      </p>

      {/* Team badges */}
      {teamCount > 0 && (
        <div className="mt-3">
          <TeamBadges teams={project.teams} max={2} size="xs" />
        </div>
      )}

      {/* Meta row: owner + members */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {project.owner && (
            <span className="text-[10px] text-fg-3 truncate">
              {project.owner.fullName || "Owner"}
            </span>
          )}
        </div>
        {memberCount > 0 && (
          <ProjectMembers members={project.members || []} size="sm" />
        )}
      </div>

      {/* Footer: date + status */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] text-fg-3">
          <Calendar className="h-3 w-3" />
          {formatDate(project.dueDate || project.startDate)}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${status.cls}`}
        >
          <span className={`h-1 w-1 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>
    </div>
  );
}