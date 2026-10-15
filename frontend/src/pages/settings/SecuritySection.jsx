import { useState } from "react";
import { Lock, Save, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.js";
import { getApiError } from "../../utils/apiData.js";

export default function SecuritySection() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      toast.error("New password must be different from current");
      return;
    }

    setSaving(true);
    try {
      await api.patch("/users/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(getApiError(error, "Could not change password"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-5 w-5 text-accent-600 dark:text-accent-400" />
          <h2 className="text-lg font-semibold text-fg">Change Password</h2>
        </div>
        <p className="text-sm text-fg-3">
          Use a strong password with at least 6 characters
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-fg mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <Lock className="h-4 w-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={show ? "text" : "password"}
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-card border border-line text-sm text-fg placeholder:text-fg-3 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-fg mb-1.5">
            New Password
          </label>
          <input
            type={show ? "text" : "password"}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            placeholder="Minimum 6 characters"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-card border border-line text-sm text-fg placeholder:text-fg-3 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-fg mb-1.5">
            Confirm New Password
          </label>
          <input
            type={show ? "text" : "password"}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Re-enter new password"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-card border border-line text-sm text-fg placeholder:text-fg-3 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-accent-600/25"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Update Password
            </>
          )}
        </button>
      </div>
    </form>
  );
}