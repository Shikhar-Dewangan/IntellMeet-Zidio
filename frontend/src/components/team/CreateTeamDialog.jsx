// frontend/src/components/team/CreateTeamDialog.jsx
import { useEffect, useRef, useState } from "react";
import { X, Plus, Loader2, Users, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { createTeam } from "../../services/team.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";
import ContextNote from "./ContextNote.jsx";

export default function CreateTeamDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm({ name: "", description: "" });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setCreating(true);
    try {
      const response = await createTeam({
        name: form.name.trim(),
        description: form.description.trim(),
      });
      const team = unwrapApiData(response);
      toast.success("Team created");
      onCreated?.(team);
      onClose?.();
    } catch (error) {
      toast.error(getApiError(error, "Could not create team"));
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15">
                <Users className="h-5 w-5 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-fg">Create a new team</h2>
                <p className="text-xs text-fg-3">Bring your team together</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={creating}
              className="rounded-lg p-2 text-fg-3 transition hover:bg-surface hover:text-fg disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">
                Team name <span className="text-accent-blue">*</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Product Team"
                maxLength={100}
                required
                disabled={creating}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Team for product development"
                maxLength={1000}
                disabled={creating}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition resize-none disabled:opacity-60"
              />
            </div>

            {/* Contextual note (mandatory) */}
            <ContextNote>
              Team create karne ke baad aap uske <strong>owner</strong> honge
              aur uski membership manage kar sakenge.
            </ContextNote>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={creating}
                className="flex-1 px-4 py-2.5 rounded-xl border border-line bg-card hover:bg-surface text-fg text-sm font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !form.name.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-lg shadow-accent-600/25"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Team
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}