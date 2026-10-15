// frontend/src/components/project/ProjectTabs.jsx
export default function ProjectTabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto -mb-px border-b border-line">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`relative shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? "text-accent-blue"
                : "text-fg-2 hover:text-fg"
            }`}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-accent-blue text-white"
                    : "bg-surface text-fg-3 border border-line"
                }`}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full bg-accent-blue" />
            )}
          </button>
        );
      })}
    </div>
  );
}