import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarPlus,
  ArrowLeft,
  Type,
  AlignLeft,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Video,
  Sparkles,
  Info,
} from "lucide-react";
import { createMeeting } from "../../services/meeting.service.js";

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    duration: 30,
    platform: "IntelliMeet",
  });
  const [saving, setSaving] = useState(false);

  const update = (e) =>
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await createMeeting(form);
      const meeting =
        response?.data?.meeting ?? response?.meeting ?? response?.data;
      toast.success("Meeting created");
      navigate(meeting?._id ? `/meetings/${meeting._id}` : "/meetings", {
        replace: true,
      });
    } catch (error) {
      toast.error(error.message || "Could not create meeting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* ============ BACK LINK ============ */}
      <Link
        to="/meetings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Meetings
      </Link>

      {/* ============ HERO / HEADER ============ */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-card via-card to-page p-6 sm:p-8">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent-purple/20 blur-[80px] pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/15 text-accent-blue text-[11px] font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3 h-3" />
            New Meeting
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg leading-tight">
            Create a new meeting
          </h1>
          <p className="mt-2 text-sm sm:text-base text-fg-2 leading-relaxed max-w-xl">
            Schedule a meeting and invite your team. AI-powered transcription,
            summaries, and action items will be generated automatically.
          </p>
        </div>
      </div>

      {/* ============ FORM ============ */}
      <form onSubmit={submit} className="space-y-5">
        {/* ---------- Section 1: Basic info ---------- */}
        <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/15 flex items-center justify-center">
              <Info className="w-4 h-4 text-accent-blue" />
            </div>
            <h2 className="text-base font-semibold text-fg">
              Basic Information
            </h2>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">
                Meeting Title
                <span className="text-accent-rose ml-0.5">*</span>
              </label>
              <div className="relative">
                <Type className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={update}
                  placeholder="e.g. Product Roadmap Discussion"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-surface border border-line text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">
                Description
              </label>
              <div className="relative">
                <AlignLeft className="w-4 h-4 text-fg-3 absolute left-3 top-3.5" />
                <textarea
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={update}
                  placeholder="What's this meeting about?"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-surface border border-line text-sm text-fg placeholder:text-fg-3 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Section 2: Schedule ---------- */}
        <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/15 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-accent-purple" />
            </div>
            <h2 className="text-base font-semibold text-fg">
              Schedule & Duration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scheduled at */}
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">
                Scheduled At
                <span className="text-accent-rose ml-0.5">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  name="scheduledAt"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={update}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-surface border border-line text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">
                Duration (minutes)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  name="duration"
                  value={form.duration}
                  onChange={update}
                  className="w-full appearance-none pl-9 pr-4 py-3 rounded-xl bg-surface border border-line text-sm text-fg focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition cursor-pointer"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

       

        {/* ---------- Action buttons ---------- */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <Link
            to="/meetings"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-line bg-card text-fg text-sm font-semibold hover:bg-surface transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-lg shadow-accent-blue/25"
          >
            <CalendarPlus className="w-4 h-4" />
            {saving ? "Creating..." : "Create Meeting"}
          </button>
        </div>
      </form>
    </div>
  );
}