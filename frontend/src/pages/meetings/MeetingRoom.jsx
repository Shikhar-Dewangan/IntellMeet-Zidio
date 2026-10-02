import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MessageSquareText,
  Mic,
  MonitorUp,
  PhoneOff,
  Users,
  Video,
} from "lucide-react";
import { leaveMeeting, joinMeeting } from "../../services/meeting.service.js";
import useSocket from "../../hooks/useSocket.js";
import useWebRTC from "../../hooks/useWebRTC.js";
import { getApiError } from "../../utils/apiData.js";

export default function MeetingRoom() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useSocket({
    enabled: Boolean(import.meta.env.VITE_SOCKET_URL),
  });
  const { error: mediaError } = useWebRTC({ enabled: true });

  useEffect(() => {
    joinMeeting(meetingId)
      .then(() => setJoined(true))
      .catch((requestError) => {
        const message = getApiError(requestError, "Could not join meeting");
        setError(message);
        toast.error(message);
      });

    return () => {
      leaveMeeting(meetingId).catch((requestError) => {
        console.error("Could not leave meeting", requestError);
      });
    };
  }, [meetingId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !joined) return undefined;

    const join = () => socket.emit("meeting:join", { meetingId });
    socket.on("connect", join);

    if (socket.connected) join();

    return () => {
      socket.off("connect", join);
      if (socket.connected) socket.emit("meeting:leave", { meetingId });
    };
  }, [joined, meetingId, socketRef]);

  const leave = async () => {
    try {
      await leaveMeeting(meetingId);
      navigate(`/meetings/${meetingId}`);
    } catch (requestError) {
      toast.error(getApiError(requestError, "Could not leave meeting"));
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="text-sm font-semibold text-slate-100">Meeting room</p>
          <p className="text-xs text-slate-400">
            {joined ? "Connected" : "Connecting..."}
          </p>
        </div>

        <button
          type="button"
          onClick={leave}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          <PhoneOff className="h-4 w-4" />
          Leave
        </button>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900 via-slate-900 to-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.22),_transparent_40%)]" />

          <div className="relative flex h-full min-h-[360px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br from-blue-500 to-violet-600 shadow-2xl shadow-blue-500/30">
              <Video className="h-10 w-10 text-white" />
            </div>

            <p className="text-xl font-semibold text-slate-100">
              {error || "Meeting media workspace"}
            </p>
            <p className="mt-2 max-w-lg text-sm text-slate-400">
              {mediaError
                ? "Camera or microphone permission was unavailable."
                : "WebRTC media and Socket.IO signaling are initializing."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-200 transition hover:bg-slate-700"
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-200 transition hover:bg-slate-700"
              >
                <MonitorUp className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-200 transition hover:bg-slate-700"
              >
                <MessageSquareText className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600  ">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-slate-100">
                Participants
              </p>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-300">
              {joined ? "Live" : "Syncing"}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { name: "Aisha", color: "bg-blue-500" },
              { name: "Ravi", color: "bg-violet-500" },
              { name: "Nina", color: "bg-emerald-500" },
              { name: "Leo", color: "bg-amber-500" },
            ].map((person) => (
              <div
                key={person.name}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${person.color} text-xs font-bold text-white`}
                  >
                    {person.name[0]}
                  </div>
                  <span className="text-sm text-slate-200">{person.name}</span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  Ready
                </span>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
