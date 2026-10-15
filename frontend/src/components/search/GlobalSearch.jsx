// frontend/src/components/search/GlobalSearch.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, Users, FolderKanban, CheckCircle2, Video, Loader2,
  ArrowRight,
} from "lucide-react";
import useDebounce from "../../hooks/useDebounce.js";
import { globalSearch } from "../../services/search.service.js";
import { unwrapApiData } from "../../utils/apiData.js";

const EMPTY = { teams: [], projects: [], tasks: [], meetings: [] };

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function GlobalSearch({
  placeholder = "Search teams, projects, tasks, meetings...",
  autoFocus = false,
  onNavigate,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedQuery = useDebounce(query, 350);

  /* ============ FETCH RESULTS ============ */
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    globalSearch(debouncedQuery.trim(), 5)
      .then((res) => {
        if (cancelled) return;
        const data = unwrapApiData(res) || EMPTY;
        setResults({
          teams: data.teams || [],
          projects: data.projects || [],
          tasks: data.tasks || [],
          meetings: data.meetings || [],
        });
      })
      .catch(() => {
        if (!cancelled) setResults(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  /* ============ FLATTEN RESULTS for keyboard nav ============ */
  const flatItems = useMemo(() => {
    const items = [];
    results.teams.forEach((t) =>
      items.push({ type: "team", id: t._id, data: t, path: `/teams/${t._id}` })
    );
    results.projects.forEach((p) =>
      items.push({
        type: "project",
        id: p._id,
        data: p,
        path: `/projects/${p._id}`,
      })
    );
    results.tasks.forEach((t) =>
      items.push({ type: "task", id: t._id, data: t, path: `/tasks/${t._id}` })
    );
    results.meetings.forEach((m) =>
      items.push({
        type: "meeting",
        id: m._id,
        data: m,
        path: `/meetings/${m._id}`,
      })
    );
    return items;
  }, [results]);

  /* ============ OUTSIDE CLICK ============ */
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ============ KEYBOARD NAV ============ */
  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" && query.trim()) setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        navigateTo(flatItems[activeIndex].path);
      } else if (query.trim()) {
        // No item selected → go to tasks page with query
        navigateTo(`/tasks?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  const navigateTo = (path) => {
    onNavigate?.();
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
    navigate(path);
  };

  const hasResults =
    results.teams.length +
      results.projects.length +
      results.tasks.length +
      results.meetings.length >
    0;

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* INPUT */}
      <div className="relative">
        <Search className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full rounded-xl border border-line bg-card py-2.5 pl-9 pr-9 text-sm text-fg placeholder:text-fg-3 transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults(EMPTY);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-fg-3 hover:bg-surface transition"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* RESULTS PANEL */}
      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-line bg-card shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-accent-500" />
            </div>
          )}

          {!loading && !hasResults && (
            <div className="py-8 px-4 text-center">
              <Search className="mx-auto w-5 h-5 text-fg-3 mb-2" />
              <p className="text-sm text-fg-2">No results found</p>
              <p className="text-xs text-fg-3 mt-1">
                Try a different keyword
              </p>
            </div>
          )}

          {!loading && hasResults && (
            <div className="overflow-y-auto">
              {results.teams.length > 0 && (
                <Section title="Teams" icon={Users}>
                  {results.teams.map((t, idx) => {
                    const globalIdx = idx;
                    return (
                      <ResultRow
                        key={t._id}
                        active={activeIndex === globalIdx}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onClick={() => navigateTo(`/teams/${t._id}`)}
                        icon={
                          <div className="h-8 w-8 rounded-lg bg-accent-blue/15 flex items-center justify-center text-accent-blue text-xs font-bold">
                            {getInitials(t.name)}
                          </div>
                        }
                        title={t.name}
                        subtitle={
                          t.description ||
                          `${t.members?.length || 0} members`
                        }
                      />
                    );
                  })}
                </Section>
              )}

              {results.projects.length > 0 && (
                <Section title="Projects" icon={FolderKanban}>
                  {results.projects.map((p, idx) => {
                    const globalIdx =
                      results.teams.length + idx;
                    return (
                      <ResultRow
                        key={p._id}
                        active={activeIndex === globalIdx}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onClick={() => navigateTo(`/projects/${p._id}`)}
                        icon={
                          <div className="h-8 w-8 rounded-lg bg-accent-violet/15 flex items-center justify-center">
                            <FolderKanban className="w-4 h-4 text-accent-violet" />
                          </div>
                        }
                        title={p.name}
                        subtitle={
                          p.description ||
                          `Status: ${p.status || "—"}`
                        }
                      />
                    );
                  })}
                </Section>
              )}

              {results.tasks.length > 0 && (
                <Section title="Tasks" icon={CheckCircle2}>
                  {results.tasks.map((t, idx) => {
                    const globalIdx =
                      results.teams.length +
                      results.projects.length +
                      idx;
                    return (
                      <ResultRow
                        key={t._id}
                        active={activeIndex === globalIdx}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onClick={() => navigateTo(`/tasks/${t._id}`)}
                        icon={
                          <div className="h-8 w-8 rounded-lg bg-accent-emerald/15 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
                          </div>
                        }
                        title={t.title}
                        subtitle={
                          t.project?.name
                            ? `${t.project.name} · ${t.status || "—"}`
                            : t.status || "—"
                        }
                      />
                    );
                  })}
                </Section>
              )}

              {results.meetings.length > 0 && (
                <Section title="Meetings" icon={Video}>
                  {results.meetings.map((m, idx) => {
                    const globalIdx =
                      results.teams.length +
                      results.projects.length +
                      results.tasks.length +
                      idx;
                    return (
                      <ResultRow
                        key={m._id}
                        active={activeIndex === globalIdx}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onClick={() => navigateTo(`/meetings/${m._id}`)}
                        icon={
                          <div className="h-8 w-8 rounded-lg bg-accent-rose/15 flex items-center justify-center">
                            <Video className="w-4 h-4 text-accent-rose" />
                          </div>
                        }
                        title={m.title}
                        subtitle={m.status || "—"}
                      />
                    );
                  })}
                </Section>
              )}

              {/* Footer hint */}
              <div className="border-t border-line px-4 py-2 bg-surface/50 flex items-center justify-between text-[10px] text-fg-3">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-card border border-line font-mono text-[9px]">
                    ↑↓
                  </kbd>{" "}
                  Navigate{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-card border border-line font-mono text-[9px] ml-2">
                    ⏎
                  </kbd>{" "}
                  Open{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-card border border-line font-mono text-[9px] ml-2">
                    Esc
                  </kbd>{" "}
                  Close
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ SUB COMPONENTS ============ */

function Section({ title, icon: Icon, children }) {
  return (
    <div className="border-b border-line last:border-0">
      <div className="flex items-center gap-2 px-4 py-2 bg-surface/50">
        <Icon className="w-3 text-fg-3" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-fg-3">
          {title}
        </p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ResultRow({ active, onMouseEnter, onClick, icon, title, subtitle }) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
        active ? "bg-accent-500/10" : "hover:bg-surface/50"
      }`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-fg truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-[10px] text-fg-3 truncate">{subtitle}</p>
        )}
      </div>
      {active && (
        <ArrowRight className="w-3.5 h-3.5 text-accent-500 shrink-0" />
      )}
    </button>
  );
}