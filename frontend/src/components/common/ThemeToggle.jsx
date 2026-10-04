import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";

export default function ThemeToggle({ className = "", compact = false }) {
  const { theme, setLight, setDark, toggleTheme } = useTheme();
  const isLight = theme === "light";

  if (compact) {
    const Icon = isLight ? Moon : Sun;
    const label = isLight ? "Switch to dark mode" : "Switch to light mode";

    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        aria-pressed={!isLight}
        title={label}
        className={`inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-card text-fg-2 transition hover:bg-card-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-line bg-surface p-1 ${className}`}
    >
      <button
        type="button"
        onClick={setLight}
        aria-label="Light mode"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
          isLight
            ? "bg-card text-blue-600 shadow-sm"
            : "text-fg-2 hover:text-fg"
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Light</span>
      </button>

      <button
        type="button"
        onClick={setDark}
        aria-label="Dark mode"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
          !isLight
            ? "bg-blue-600 text-white shadow-sm"
            : "text-fg-2 hover:text-fg"
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Dark</span>
      </button>
    </div>
  );
}
