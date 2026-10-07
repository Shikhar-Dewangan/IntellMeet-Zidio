import { AlertTriangle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DangerZoneSection() {
  const handleDelete = () => {
    const confirm1 = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone.",
    );
    if (!confirm1) return;
    const confirm2 = window.prompt(
      'Type "DELETE" to confirm permanent account deletion:',
    );
    if (confirm2 !== "DELETE") {
      toast.error("Deletion cancelled");
      return;
    }
    toast.error("Account deletion is not yet enabled");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-5 w-5 text-accent-rose" />
          <h2 className="text-lg font-semibold text-fg">Danger Zone</h2>
        </div>
        <p className="text-sm text-fg-3">Irreversible actions — be careful</p>
      </div>

      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          Delete Account
        </p>
        <p className="mt-1 text-xs text-fg-3">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <button
          onClick={handleDelete}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition"
        >
          <Trash2 className="h-4 w-4" />
          Delete My Account
        </button>
      </div>
    </div>
  );
}