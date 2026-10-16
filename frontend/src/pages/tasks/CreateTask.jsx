// frontend/src/pages/CreateTask.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import CreateTaskForm from "../../components/task/CreateTaskForm.jsx";
import CreateTaskSidebar from "../../components/task/CreateTaskSidebar.jsx";

export default function CreateTask() {
  const navigate = useNavigate();
  const [liveData, setLiveData] = useState({
    team: null,
    project: null,
    assignee: null,
    priority: "medium",
    status: "todo",
    startDate: "",
    dueDate: "",
    title: "",
    description: "",
    members: [],
  });

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link
          to="/tasks"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card hover:bg-surface transition"
          title="Back to Tasks"
        >
          <ArrowLeft className="h-4 w-4 text-fg-2" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/15">
            <CheckCircle2 className="h-5 w-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-fg">
              Create Task
            </h1>
            <p className="text-xs text-fg-3">
              Create and assign a new task for your team
            </p>
          </div>
        </div>
        <Link
          to="/tasks"
          className="ml-auto hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-surface px-3.5 py-2 text-xs font-semibold text-fg transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Tasks
        </Link>
      </div>

      {/* LAYOUT: form on left, sidebar on right */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <CreateTaskForm
          onLiveDataChange={setLiveData}
          onCreated={(task) => navigate(`/tasks/${task._id}`)}
          onCancel={() => navigate("/tasks")}
        />
        <CreateTaskSidebar
          team={liveData.team}
          members={liveData.members}
          project={liveData.project}
          assignee={liveData.assignee}
          priority={liveData.priority}
          status={liveData.status}
          startDate={liveData.startDate}
          dueDate={liveData.dueDate}
        />
      </div>
    </div>
  );
}