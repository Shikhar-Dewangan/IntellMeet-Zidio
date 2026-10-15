// frontend/src/components/task/CreateTaskSidebar.jsx
import { useMemo } from "react";
import {
  Users, FolderKanban, UserIcon, Flag, Calendar, ListTodo, Info, Shield,
} from "lucide-react";

const PRIORITY_LABEL = {
  low: { label: "Low", color: "text-accent-emerald" },
  medium: { label: "Medium", color: "text-amber-500" },
  high: { label: "High", color: "text-accent-rose" },
};

const STATUS_LABEL = {
  todo: { label: "To Do", color: "text-slate-400" },
  "in-progress": { label: "In Progress", color: "text-accent-blue" },
  completed: { label: "Completed", color: "text-accent-emerald" },
};

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "from-accent-400 to-accent-700",
  "from-accent-500 to-accent-900",
  "from-accent-200 to-accent-600",
  "from-accent-400 to-accent-900",
  "from-accent-500 to-accent-700",
];

function getAvatarColor(id = "") {
  const hash = id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CreateTaskSidebar({
  team,
  members = [],
  project,
  assignee,
  priority,
  status,
  startDate,
  dueDate,
}) {
  const priorityCfg = PRIORITY_LABEL[priority] || PRIORITY_LABEL.medium;
  const statusCfg = STATUS_LABEL[status] || STATUS_LABEL.todo;

  const selectedAssigneeId = useMemo(
    () => assignee?._id || null,
    [assignee]
  );

  return (
    <aside className="space-y-4">
      {/* SELECTED TEAM MEMBERS */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent-blue" />
            <h3 className="text-sm font-bold text-fg">Selected Team Members</h3>
          </div>
          <p className="text-[11px] text-fg-3 mt-0.5">
            Team members who can be assigned
          </p>
        </div>

        {!team ? (
          <div className="p-6 text-center">
            <Users className="mx-auto h-5 w-5 text-fg-3 mb-2" />
            <p className="text-xs text-fg-3">Select a team first</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-fg-3">No members found</p>
          </div>
        ) : (
          <div className="p-2 max-h-72 overflow-y-auto">
            {members.map((m) => {
              const isSelected =
                selectedAssigneeId === m._id;
              const avatarColor = getAvatarColor(m._id);
              return (
                <div
                  key={m._id}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-2 transition ${
                    isSelected ? "bg-accent-blue/10" : "hover:bg-surface"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full bg-linear-to-br ${avatarColor} flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0`}
                  >
                    {m.avatar ? (
                      <img src={m.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      getInitials(m.fullName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-fg truncate">
                      {m.fullName}
                    </p>
                    <p className="text-[10px] text-fg-3 truncate">
                      {m.email || "Team member"}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] font-bold text-accent-blue shrink-0">
                      SELECTED
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TASK INFORMATION SUMMARY */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-accent-blue" />
            <h3 className="text-sm font-bold text-fg">Task Information</h3>
          </div>
        </div>

        <div className="p-4 space-y-3.5">
          <SummaryRow
            icon={Users}
            label="Team"
            value={team?.name || "Not selected"}
            valueClass={team ? "text-fg" : "text-fg-3"}
          />
          <SummaryRow
            icon={FolderKanban}
            label="Project"
            value={project?.name || "Not selected"}
            valueClass={project ? "text-fg" : "text-fg-3"}
          />
          <SummaryRow
            icon={UserIcon}
            label="Assignee"
            value={assignee?.fullName || "Unassigned"}
            valueClass={assignee ? "text-fg" : "text-fg-3"}
          />
          <SummaryRow
            icon={Flag}
            label="Priority"
            value={priorityCfg.label}
            valueClass={priorityCfg.color}
          />
          <SummaryRow
            icon={Calendar}
            label="Start Date"
            value={formatDate(startDate)}
            valueClass="text-fg"
          />
          <SummaryRow
            icon={Calendar}
            label="Due Date"
            value={formatDate(dueDate)}
            valueClass="text-fg"
          />
          <SummaryRow
            icon={ListTodo}
            label="Status"
            value={statusCfg.label}
            valueClass={statusCfg.color}
          />
        </div>
      </div>

      {/* PERMISSION NOTE */}
      <div className="rounded-2xl border border-accent-blue/20 bg-accent-blue/5 p-4">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-blue/15">
            <Shield className="h-3.5 w-3.5 text-accent-blue" />
          </div>
          <div className="text-xs text-fg-2 leading-relaxed space-y-1">
            <p className="font-semibold text-fg">Important</p>
            <ul className="list-disc list-inside space-y-0.5 text-fg-3">
              <li>
                You can assign this task only to current members of the
                selected team.
              </li>
              <li>Only projects assigned to this team are shown.</li>
              <li>
                Team Owners and authorized Task Owners can create and
                assign tasks.
              </li>
              <li>
                Project Owners do not get task-management permissions
                automatically.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({ icon: Icon, label, value, valueClass = "text-fg" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-xs text-fg-3 shrink-0">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={`text-xs font-semibold text-right truncate ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}