import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Search, X, UserPlus, Loader2, Check } from "lucide-react";

import { searchUsers } from "../../services/user.service.js";
import { inviteUsersToMeeting } from "../../services/meeting.service.js";
import { getApiError } from "../../utils/apiData.js";

export default function InviteParticipantsDialog({
  open,
  onClose,
  meetingId,
  existingParticipantIds = [],
  existingInvitedIds = [],
  onSuccess,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  /* ============ RESET ON OPEN ============ */
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  /* ============ DEBOUNCED SEARCH ============ */
  useEffect(() => {
    if (!open) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await searchUsers(q);
        const list =
          response?.data?.data ?? response?.data ?? [];
        setResults(Array.isArray(list) ? list : []);
      } catch (error) {
        const msg = getApiError(error, "Could not search users");
        if (!/required/i.test(msg)) toast.error(msg);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  /* ============ ESCAPE + SCROLL LOCK ============ */
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

  /* ============ DERIVED ============ */
  const blockedIds = useMemo(() => {
    const s = new Set();
    [...existingParticipantIds, ...existingInvitedIds].forEach((id) => {
      const v = id?.toString?.() || id;
      if (v) s.add(v);
    });
    return s;
  }, [existingParticipantIds, existingInvitedIds]);

  const selectedIds = useMemo(
    () => new Set(selected.map((u) => u._id)),
    [selected],
  );

  /* ============ HANDLERS ============ */
  const toggleUser = (user) => {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
    );
  };

  const removeUser = (id) =>
    setSelected((prev) => prev.filter((u) => u._id !== id));

  const handleSend = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one user");
      return;
    }
    setSending(true);
    try {
      await inviteUsersToMeeting(
        meetingId,
        selected.map((u) => u._id),
      );
      toast.success(
        `${selected.length} invitation${selected.length > 1 ? "s" : ""} sent`,
      );
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(getApiError(error, "Could not send invitations"));
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const getInitial = (u) =>
    (u?.fullName || u?.email || "U")[0]?.toUpperCase() || "U";

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-line bg-card shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-accent-blue/15 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-accent-blue" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-fg">
                  Invite Participants
                </h2>
                <p className="text-xs text-fg-3">
                  Search registered users to invite
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface text-fg-3 hover:text-fg transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-line shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-line text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition"
              />
            </div>

            {selected.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selected.map((u) => (
                  <span
                    key={u._id}
                    className="inline-flex items-center gap-1 pl-1 pr-2 py-1 rounded-full bg-accent-blue/15 text-accent-blue text-xs font-medium"
                  >
                    <span className="w-5 h-5 rounded-full bg-accent-blue text-white flex items-center justify-center text-[9px] font-bold">
                      {getInitial(u)}
                    </span>
                    <span className="max-w-30 truncate">
                      {u.fullName || u.email}
                    </span>
                    <button
                      onClick={() => removeUser(u._id)}
                      className="p-0.5 rounded-full hover:bg-accent-blue/20"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto min-h-50">
            {!query.trim() ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-fg-3" />
                </div>
                <p className="text-sm font-medium text-fg">
                  Start typing to search
                </p>
                <p className="mt-1 text-xs text-fg-3">
                  Search by name or email
                </p>
              </div>
            ) : searching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-accent-blue animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <p className="text-sm font-medium text-fg">No users found</p>
                <p className="mt-1 text-xs text-fg-3">
                  Try a different search term
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {results.map((user) => {
                  const isBlocked = blockedIds.has(user._id);
                  const isSelected = selectedIds.has(user._id);
                  return (
                    <li key={user._id}>
                      <button
                        type="button"
                        disabled={isBlocked}
                        onClick={() => !isBlocked && toggleUser(user)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                          isBlocked
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-surface cursor-pointer"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {getInitial(user)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-fg truncate">
                            {user.fullName || "Unnamed"}
                          </p>
                          <p className="text-xs text-fg-3 truncate">
                            {user.email}
                          </p>
                        </div>
                        {isBlocked ? (
                          <span className="text-[10px] font-medium text-fg-3 px-2 py-1 rounded-md bg-surface border border-line">
                            Already added
                          </span>
                        ) : (
                          <div
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? "bg-accent-blue border-accent-blue"
                                : "border-line"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-line shrink-0">
            <p className="text-xs text-fg-3">{selected.length} selected</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-line bg-card hover:bg-surface text-fg text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || selected.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-lg shadow-accent-blue/25"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Send Invitations
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}