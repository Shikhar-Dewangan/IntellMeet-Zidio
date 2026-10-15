function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProjectMembers({ members = [], max = 3, size = "md" }) {
  const visible = members.slice(0, max);
  const extra = Math.max(0, members.length - max);

  const sizes = {
    sm: "h-6 w-6 text-[9px] border-2",
    md: "h-7 w-7 text-[10px] border-2",
    lg: "h-9 w-9 text-xs border-2",
  };

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((m, i) => (
        <div
          key={m._id || i}
          className={`${sizes[size]} rounded-full bg-gradient-to-br from-accent-blue to-accent-blue/60 flex items-center justify-center text-white font-bold border-card overflow-hidden shrink-0`}
          title={m.fullName || "Member"}
        >
          {m.avatar ? (
            <img
              src={m.avatar}
              alt={m.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(m.fullName || "U")
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className={`${sizes[size]} rounded-full bg-surface border-card flex items-center justify-center text-fg-2 font-bold shrink-0`}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}