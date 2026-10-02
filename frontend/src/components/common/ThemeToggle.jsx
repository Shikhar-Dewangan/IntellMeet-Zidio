import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, setLight, setDark } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      <button
        onClick={setLight}
        aria-label="Light mode"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
          isLight
            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Light</span>
      </button>

      <button
        onClick={setDark}
        aria-label="Dark mode"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
          !isLight
            ? "bg-blue-600 text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Dark</span>
      </button>
    </div>
  );
}
