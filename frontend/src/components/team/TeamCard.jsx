import { Link } from "react-router-dom";
import {
  Users,
  FolderKanban,
  Calendar,
  CheckCircle2,
  MoreVertical,
  ArrowRight,
  Crown,
} from "lucide-react";

/* ============================================================
   BANNER DESIGNS (colorful illustration-style banners)
   ============================================================ */
const BANNER_STYLES = [
  // 1. Accent-colored room with desk
  {
    bg: "from-slate-900 via-accent-blue/50 to-slate-900",
    accent: "bg-accent-blue",
    icon: "text-accent-blue",
  },
  // 2. Purple room with TV (like screenshot 2)
  {
    bg: "from-slate-900 via-violet-900 to-slate-900",
    accent: "bg-violet-500",
    icon: "text-violet-400",
  },
  // 3. Orange room with plants (like screenshot 3)
  {
    bg: "from-slate-900 via-amber-900 to-slate-900",
    accent: "bg-amber-500",
    icon: "text-amber-400",
  },
  // 4. Blue theme
  {
    bg: "from-slate-900 via-blue-900 to-slate-900",
    accent: "bg-accent-blue",
    icon: "text-accent-blue",
  },
  // 5. Emerald theme
  {
    bg: "from-slate-900 via-emerald-900 to-slate-900",
    accent: "bg-emerald-500",
    icon: "text-emerald-400",
  },
  // 6. Violet theme
  {
    bg: "from-slate-900 via-fuchsia-900 to-slate-900",
    accent: "bg-fuchsia-500",
    icon: "text-fuchsia-400",
  },
];

const ICON_STYLES = [
  { bg: "bg-accent-blue", color: "text-white" },
  { bg: "bg-violet-500", color: "text-white" },
  { bg: "bg-amber-500", color: "text-white" },
  { bg: "bg-accent-blue", color: "text-white" },
  { bg: "bg-emerald-500", color: "text-white" },
  { bg: "bg-fuchsia-500", color: "text-white" },
];

const hash = (str = "") =>
  str.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);

/* ============================================================
   AVATAR STACK
   ============================================================ */
function AvatarStack({ members = [], extra = 0 }) {
  const colors = [
    "bg-accent-rose",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-accent-blue",
  ];

  return (
    <div className="flex items-center -space-x-2">
      {members.slice(0, 4).map((m, i) => {
        const name = m?.fullName || m?.name || "U";
        const initial = name[0]?.toUpperCase() || "U";

        if (m?.avatar) {
          return (
            <img
              key={i}
              src={m.avatar}
              alt={name}
              title={name}
              className="w-7 h-7 rounded-full object-cover border-2 border-card shrink-0"
            />
          );
        }

        return (
          <div
            key={i}
            title={name}
            className={`w-7 h-7 ${colors[i % colors.length]} rounded-full border-2 border-card flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
          >
            {initial}
          </div>
        );
      })}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full bg-surface border-2 border-card flex items-center justify-center text-fg-2 text-[10px] font-bold shrink-0">
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MINI STAT
   ============================================================ */
function MiniStat({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface/50 px-2.5 py-2">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${bg}`}>
        <Icon className={`h-3 w-3 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-fg leading-tight">{value}</p>
        <p className="text-[9px] text-fg-3 leading-tight">{label}</p>
      </div>
    </div>
  );
}

/* ============================================================
   TEAM CARD
   ============================================================ */
export default function TeamCard({ team, currentUserId, onDelete }) {
  const idx = hash(team._id) % BANNER_STYLES.length;
  const banner = BANNER_STYLES[idx];
  const iconStyle = ICON_STYLES[idx];

  const memberCount = team.members?.length || 0;
  const extra = Math.max(memberCount - 4, 0);
  const stats = team.stats || { projects: 0, meetings: 0, tasks: 0 };

  const ownerId = team.owner?._id || team.owner;
  const isOwner = ownerId === currentUserId;

  return (
    <div className="group overflow-hidden rounded-2xl border border-line bg-card hover:shadow-xl hover:border-accent-blue/30 transition flex flex-col">
      {/* ============ BANNER ============ */}
      <div className={`relative h-28 bg-linear-to-br ${banner.bg} shrink-0 overflow-hidden`}>
        {/* Illustration-style abstract shapes */}
        <div className="absolute inset-0">
          {/* Desk/room silhouette */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/30" />

          {/* Monitor/TV */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-11 rounded-sm bg-black/50 border border-white/10" />
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-12 h-7 rounded-sm bg-linear-to-br from-white/20 to-white/5" />

          {/* Desk lamp / plant */}
          <div className="absolute bottom-2 left-4 w-6 h-6 rounded-full bg-white/10" />
          <div className="absolute bottom-2 right-4 w-8 h-6 rounded-sm bg-white/10" />

          {/* Soft glow */}
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${banner.accent} opacity-20 blur-2xl`} />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-black/40 blur-2xl" />
        </div>

        {/* Owner badge */}
        {isOwner && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-300/30">
            <Crown className="h-2.5 w-2.5" />
            OWNER
          </span>
        )}

        {/* Menu button */}
        {isOwner && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.();
            }}
            className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 backdrop-blur-sm text-white/90 hover:bg-black/60 transition"
            aria-label="Delete team"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ============ ICON (overlapping banner) ============ */}
      <div className="px-5 -mt-7 relative">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconStyle.bg} border-4 border-card shadow-lg`}
        >
          <Users className={`h-6 w-6 ${iconStyle.color}`} />
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="flex-1 p-5 pt-3 space-y-4">
        <div>
          <Link
            to={`/teams/${team._id}`}
            className="block text-base font-bold text-fg hover:text-accent-blue transition line-clamp-1"
          >
            {team.name}
          </Link>
          <p className="mt-1 text-sm text-fg-3 leading-relaxed line-clamp-2">
            {team.description || "No description"}
          </p>
        </div>

        {/* Members */}
        <div className="flex items-center gap-3">
          <AvatarStack members={team.members || []} extra={extra} />
          <span className="text-xs text-fg-3">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2">
          <MiniStat
            icon={FolderKanban}
            label="Projects"
            value={stats.projects || 0}
            color="text-accent-amber"
            bg="bg-accent-amber/10"
          />
          <MiniStat
            icon={Calendar}
            label="Meetings"
            value={stats.meetings || 0}
            color="text-accent-blue"
            bg="bg-accent-blue/10"
          />
          <MiniStat
            icon={CheckCircle2}
            label="Tasks"
            value={stats.tasks || 0}
            color="text-accent-emerald"
            bg="bg-accent-emerald/10"
          />
        </div>
      </div>

      {/* ============ FOOTER ============ */}
      <Link
        to={`/teams/${team._id}`}
        className="flex items-center justify-center gap-1.5 rounded-b-2xl border-t border-line bg-surface/50 py-3 text-sm font-semibold text-fg hover:bg-surface hover:text-accent-blue transition"
      >
        View Team
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}