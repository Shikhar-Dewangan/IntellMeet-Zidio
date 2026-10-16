// frontend/src/components/team/AddMemberDialog.jsx
import { useEffect, useRef, useState } from "react";
import {
  X, Search, Loader2, UserPlus, Check, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { addTeamMember } from "../../services/team.service.js";
import { searchUsers } from "../../services/user.service.js";
import {
  getApiError,
  unwrapApiData,
  unwrapApiList,
} from "../../utils/apiData.js";
import ContextNote from "./ContextNote.jsx";

export default function AddMemberDialog({ open, onClose, team, onUpdated }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [justAdded, setJustAdded] = useState(new Set());
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setJustAdded(new Set());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await searchUsers(trimmed);
        setResults(unwrapApiList(response));
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, open]);

  const handleAdd = async (user) => {
    setAddingId(user._id);
    try {
      const response = await addTeamMember(team._id, user._id);
      const updated = unwrapApiData(response);
      setJustAdded((s) => new Set(s).add(user._id));
      onUpdated?.(updated);
      toast.success(`${user.fullName} added to team`);
    } catch (error) {
      toast.error(getApiError(error, "Could not add member"));
    } finally {
      setAddingId(null);
    }
  };

  if (!open) return null;

  const existingMemberIds = new Set(
    (team?.members || []).map((m) => m._id || m)
  );

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-2xl flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-rose/15">
                <UserPlus className="h-5 w-5 text-accent-rose" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-fg">
                  Add Members
                </h2>
                <p className="text-xs text-fg-3">
                  Search users by name or email
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-fg-3 transition hover:bg-surface hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 border-b border-line shrink-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-line bg-surface pl-9 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-rose focus:outline-none focus:ring-2 focus:ring-accent-rose/20 transition"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-fg-3" />
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {query.trim().length < 2 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
                  <Search className="h-5 w-5 text-fg-3" />
                </div>
                <p className="text-sm font-medium text-fg-2">
                  Start typing to search
                </p>
                <p className="mt-1 text-xs text-fg-3">
                  Enter at least 2 characters to find users
                </p>
              </div>
            )}

            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
                  <Users className="h-5 w-5 text-fg-3" />
                </div>
                <p className="text-sm font-medium text-fg-2">
                  No users found
                </p>
                <p className="mt-1 text-xs text-fg-3">
                  Try a different name or email
                </p>
              </div>
            )}

            {results.map((user) => {
              const isMember = existingMemberIds.has(user._id);
              const isAdding = addingId === user._id;
              const wasJustAdded = justAdded.has(user._id);
              const initials = (user.fullName || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition border-b border-line last:border-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-rose to-rose-700 text-sm font-bold text-white overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg truncate">
                      {user.fullName || "User"}
                    </p>
                    <p className="text-xs text-fg-3 truncate">
                      {user.email}
                    </p>
                  </div>

                  {isMember || wasJustAdded ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-500 shrink-0">
                      <Check className="h-3 w-3" />
                      {wasJustAdded ? "Added" : "Member"}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(user)}
                      disabled={isAdding}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent-rose hover:bg-accent-rose/90 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition shrink-0"
                    >
                      {isAdding ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserPlus className="h-3 w-3" />
                      )}
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contextual note (mandatory) */}
          <div className="px-5 pt-3 pb-2 border-t border-line shrink-0">
            <ContextNote>
              Added members ko is team ka access milega. Unhe Team Owner
              permissions automatically nahi milengi.
            </ContextNote>
          </div>

          <div className="px-5 py-3 flex items-center justify-between shrink-0 bg-surface/30">
            <div className="flex items-center gap-2 text-xs text-fg-3">
              <Users className="h-3.5 w-3.5" />
              <span>
                {team?.members?.length || 0} member
                {(team?.members?.length || 0) !== 1 ? "s" : ""} in team
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-line bg-card hover:bg-surface px-4 py-2 text-sm font-semibold text-fg transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}