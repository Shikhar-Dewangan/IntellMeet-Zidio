import { Shield, Download, Trash2, AlertTriangle } from "lucide-react";

export default function AccountSection() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-accent-600 dark:text-accent-400" />
          <h2 className="text-lg font-semibold text-fg">Account</h2>
        </div>
        <p className="text-sm text-fg-3">Manage your account data and preferences</p>
      </div>

      <div className="rounded-xl border border-line bg-card p-4">
        <p className="text-sm font-semibold text-fg">Export Your Data</p>
        <p className="mt-1 text-xs text-fg-3">
          Download all your account data as a JSON file
        </p>
        <button className="mt-3 inline-flex items-center gap-2 rounded-xl border border-line bg-surface hover:bg-card px-4 py-2.5 text-sm font-semibold text-fg transition">
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>
    </div>
  );
}