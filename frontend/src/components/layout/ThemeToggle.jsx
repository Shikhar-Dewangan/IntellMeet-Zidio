import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, setLight, setDark } = useTheme();
  const isLight = theme === "light";

  const base =
    "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition";
  const on = "bg-blue-600 text-white shadow-sm";
  const off = "text-fg-3 hover:text-fg";

  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-full bg-card border border-line ${className}`}
    >
      <button
        onClick={setLight}
        aria-label="Light mode"
        aria-pressed={isLight}
        className={`${base} ${isLight ? on : off}`}
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Light</span>
      </button>

      <button
        onClick={setDark}
        aria-label="Dark mode"
        aria-pressed={!isLight}
        className={`${base} ${!isLight ? on : off}`}
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Dark</span>
      </button>
    </div>
  );
}
