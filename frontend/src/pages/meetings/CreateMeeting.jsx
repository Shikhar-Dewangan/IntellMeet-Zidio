import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarPlus } from "lucide-react";
import { createMeeting } from "../../services/meeting.service.js";
import { PageHeader, SectionCard } from "../../components/ui/Shared.jsx";

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduledAt: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  const submit = async (event) => {
    event.preventDefault();
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
    <>
      <PageHeader
        title="Create meeting"
        subtitle="Schedule a meeting for your workspace."
      />
      <SectionCard>
        <form onSubmit={submit} className="max-w-xl space-y-4 p-5">
          {[
            ["title", "Title", "text"],
            ["description", "Description", "text"],
          ].map(([name, label, type]) => (
            <label
              key={name}
              className="block text-sm font-medium text-slate-700 "
            >
              {label}
              <input
                required={name === "title"}
                name={name}
                type={type}
                value={form[name]}
                onChange={update}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal  "
              />
            </label>
          ))}
          <label className="block text-sm font-medium text-slate-700 ">
            Scheduled at
            <input
              required
              name="scheduledAt"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={update}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal  "
            />
          </label>
          <button
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <CalendarPlus className="h-4 w-4" />
            {saving ? "Creating..." : "Create meeting"}
          </button>
        </form>
      </SectionCard>
    </>
  );
}
