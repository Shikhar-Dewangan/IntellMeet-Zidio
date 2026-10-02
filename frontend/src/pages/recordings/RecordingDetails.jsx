import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Bot,
  FileText,
  ListTodo,
  Trash2,
  Video,
} from "lucide-react";
import {
  processRecording,
  getRecordingById,
  updateRecording,
  deleteRecording,
} from "../../services/recording.service.js";
import { createTask } from "../../services/task.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";
import {
  EmptyState,
  LoadingState,
  PageHeader,
  SectionCard,
  Tabs,
} from "../../components/ui/Shared.jsx";

export default function RecordingDetails() {
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("summary");

  const loadRecording = async () => {
    try {
      const response = await getRecordingById(recordingId);
      const data = unwrapApiData(response);
      setRecording(data);
      setActionItems(data?.actionItems || []);
    } catch (error) {
      toast.error(getApiError(error, "Could not load recording"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecording();
  }, [recordingId]);

  const process = async () => {
    try {
      const result = unwrapApiData(await processRecording(recordingId));
      setRecording(result?.recording || result);
      setActionItems(result?.actionItems || []);
      toast.success("Recording processed");
    } catch (error) {
      toast.error(getApiError(error, "Could not process recording"));
    }
  };

  const createActionTask = async (item) => {
    try {
      await createTask({
        title: item.title,
        description: item.description,
        project: item.project,
        meeting: item.meeting,
        actionItem: item._id,
        priority: "medium",
      });
      toast.success("Task created from action item");
    } catch (error) {
      toast.error(getApiError(error, "Could not create task"));
    }
  };

  const save = async () => {
    try {
      const response = await updateRecording(recordingId, {
        title: recording.title,
        description: recording.description,
      });
      setRecording(unwrapApiData(response));
      toast.success("Recording updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not update recording"));
    }
  };

  const remove = async () => {
    try {
      await deleteRecording(recordingId);
      toast.success("Recording deleted");
      navigate("/recordings", { replace: true });
    } catch (error) {
      toast.error(getApiError(error, "Could not delete recording"));
    }
  };

  if (loading) return <LoadingState text="Loading recording..." />;

  if (!recording) {
    return (
      <div className="space-y-5">
        <PageHeader title="Recording" subtitle="Recording not found." />
        <SectionCard>
          <EmptyState
            icon={Video}
            title="Recording not found"
            description="This recording may have been removed or is unavailable."
            action={
              <Link
                to="/recordings"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to recordings
              </Link>
            }
          />
        </SectionCard>
      </div>
    );
  }

  const tabs = [
    { value: "summary", label: "Summary" },
    { value: "transcript", label: "Transcript" },
    { value: "actions", label: "Action items" },
  ];

  return (
    <div className="space-y-5">
      <Link
        to="/recordings"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:underline "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to recordings
      </Link>

      <PageHeader
        title={recording.title || "Recording"}
        subtitle={`${recording.meeting?.title || "Meeting"} · ${recording.duration ? `${Math.floor(recording.duration / 60)}:${String(recording.duration % 60).padStart(2, "0")}` : "00:00"}`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={process}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Bot className="h-4 w-4" />
              Generate AI summary
            </button>
            <button
              type="button"
              onClick={remove}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100   "
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        }
      />

      <SectionCard>
        {recording.recordingUrl ? (
          <video
            controls
            className="aspect-video w-full bg-slate-950"
            src={recording.recordingUrl}
          />
        ) : (
          <div className="flex min-h-55 items-center justify-center bg-slate-100 p-8 text-center ">
            <div className="space-y-2">
              <Video className="mx-auto h-8 w-8 text-blue-600 " />
              <p className="text-sm font-medium text-slate-700 ">
                Recording preview unavailable
              </p>
              <p className="text-xs text-slate-500 ">
                The media file is not yet available in this environment.
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <SectionCard>
        {tab === "summary" &&
          (recording.summary || recording.keyPoints?.length ? (
            <div className="space-y-5 p-5">
              <div className="rounded-xl bg-slate-50 p-4 ">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Summary
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700 ">
                  {recording.summary ||
                    "No summary yet. Process this recording to generate one."}
                </p>
              </div>

              {recording.keyPoints?.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Key points
                  </p>
                  <ul className="space-y-2 pl-5 text-sm text-slate-600 ">
                    {recording.keyPoints.map((point) => (
                      <li key={point} className="list-disc">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No summary yet"
              description="Process this recording after the meeting ends."
            />
          ))}

        {tab === "transcript" &&
          (recording.transcription ? (
            <div className="whitespace-pre-wrap p-5 text-sm leading-6 text-slate-700 ">
              {recording.transcription}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No transcript yet"
              description="Transcript data will appear here when available."
            />
          ))}

        {tab === "actions" &&
          (actionItems.length ? (
            <div className="divide-y divide-slate-100 ">
              {actionItems.map((item) => (
                <div
                  key={item._id || item.title}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 ">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-xs text-slate-500 ">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => createActionTask(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    <ListTodo className="h-3.5 w-3.5" />
                    Create task
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ListTodo}
              title="No action items"
              description="Process the recording to extract action items."
            />
          ))}
      </SectionCard>

      <SectionCard title="Edit metadata" icon={FileText}>
        <div className="space-y-4 p-5">
          <label className="block text-sm font-medium text-slate-700 ">
            Recording title
            <input
              value={recording.title || ""}
              onChange={(event) =>
                setRecording({ ...recording, title: event.target.value })
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 ">
            Description
            <textarea
              value={recording.description || ""}
              onChange={(event) =>
                setRecording({ ...recording, description: event.target.value })
              }
              className="mt-1.5 min-h-30 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
            />
          </label>

          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Save details
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
