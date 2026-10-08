import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Menu, Users, MessageSquare, FileText, Captions, Link2, ChevronLeft, X,
} from "lucide-react";

import {
  joinMeeting, leaveMeeting, getMeetingById, endMeeting,
} from "../../services/meeting.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";

import useSocket from "../../hooks/useSocket.js";
import useWebRTC from "../../hooks/useWebRTC.js";
import useLiveCaptions from "../../hooks/useLiveCaptions.js";
import useMeetingTranscription from "../../hooks/useMeetingTranscription.js";

import VideoGrid from "../../components/meeting/VideoGrid.jsx";
import MeetingControls from "../../components/meeting/MeetingControls.jsx";
import ParticipantList from "../../components/meeting/ParticipantList.jsx";
import MeetingChat from "../../components/meeting/MeetingChat.jsx";
import MeetingNotes from "../../components/meeting/MeetingNotes.jsx";
import LiveCaptionsPanel from "../../components/meeting/LiveCaptionsPanel.jsx";
import LiveCaptionsOverlay from "../../components/meeting/LiveCaptionsOverlay.jsx";
import HostControls from "../../components/meeting/HostControls.jsx";
import RecordingControls from "../../components/meeting/RecordingControls.jsx";
import InviteUserDialog from "../../components/meeting/InviteUserInLiveMeeting.jsx";

const getUserId = (u) => {
  if (!u) return null;
  if (typeof u === "string") return u;
  return u._id || u.id || null;
};

export default function MeetingRoom() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);
  const currentUserId = getUserId(currentUser);

  const [meeting, setMeeting] = useState(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState(null);
  const [streamReady, setStreamReady] = useState(false);
  const [localStream, setLocalStream] = useState(null);   // 👈 ADDED

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [recording, setRecording] = useState(false);

  const [sidePanel, setSidePanel] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [mutedUserIds, setMutedUserIds] = useState(new Set());
  const [videoOffUserIds, setVideoOffUserIds] = useState(new Set());
  const [chatMessages, setChatMessages] = useState([]);
  const [notes, setNotes] = useState("");
  const [notesLastSavedAt, setNotesLastSavedAt] = useState(null);

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef(new Map());

  const socketRef = useSocket({ enabled: true });

  const { error: mediaError } = useWebRTC({
    enabled: joined,
    onLocalStream: (stream) => {
      localStreamRef.current = stream;
      setLocalStream(stream);        // 👈 ADDED
      setStreamReady(true);
    },
  });

  const { captions, latestCaption, speakingUserId, clearCaptions } = useLiveCaptions({
    socketRef,
    meetingId,
    enabled: joined,
  });

  useMeetingTranscription({
    meetingId,
    stream: streamReady ? localStreamRef.current : null,
    enabled: joined && micOn && streamReady,
  });

  /* ===================== INIT ===================== */
  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const meetingResponse = await getMeetingById(meetingId);
        const meetingData = unwrapApiData(meetingResponse);
        if (!active) return;
        setMeeting(meetingData);

        const participantIds = (meetingData.participants || []).map(getUserId).filter(Boolean);
        const hostId = getUserId(meetingData.host);

        const alreadyParticipant = currentUserId && participantIds.includes(currentUserId);
        const isUserHost = hostId && currentUserId && hostId === currentUserId;

        if (!alreadyParticipant && !isUserHost) {
          try {
            await joinMeeting(meetingId);
          } catch (err) {
            const status = err?.response?.status;
            if (status !== 409 && status !== 400) throw err;
          }
        }

        if (!active) return;
        setJoined(true);
      } catch (error) {
        if (!active) return;
        const msg = getApiError(error, "Could not join meeting");
        setFatalError(msg);
        toast.error(msg);
      } finally {
        if (active) setLoading(false);
      }
    };

    init();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  /* ===================== SOCKET EVENTS ===================== */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !joined) return undefined;

    const getOrCreatePeer = (peerId) => {
      if (peersRef.current.has(peerId)) return peersRef.current.get(peerId);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
        iceCandidatePoolSize: 10,
      });

      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            meetingId,
            toUserId: peerId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          closePeer(peerId);
        }
      };

      peersRef.current.set(peerId, pc);
      return pc;
    };

    const closePeer = (peerId) => {
      const pc = peersRef.current.get(peerId);
      if (pc) {
        try { pc.close(); } catch {}
        peersRef.current.delete(peerId);
      }
    };

    const createOfferToPeer = async (peerId) => {
      const pc = getOrCreatePeer(peerId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc:offer", { meetingId, toUserId: peerId, offer });
      } catch (err) {
        console.error("Create offer failed:", err);
      }
    };

    const joinRoom = () => {
      socket.emit("meeting:join", { meetingId }, (response) => {
        if (!response?.ok) {
          toast.error(response?.message || "Could not join room");
          return;
        }
        const initial = (response.participants || []).filter((p) => p.userId !== currentUserId);
        setRemoteParticipants(initial);
        initial.forEach((p) => createOfferToPeer(p.userId).catch(() => {}));
      });
    };

    socket.on("connect", joinRoom);
    if (socket.connected) joinRoom();

    const handleParticipantJoined = (payload) => {
      if (!payload?.userId || payload.userId === currentUserId) return;
      setRemoteParticipants((prev) => {
        if (prev.some((p) => p.userId === payload.userId)) return prev;
        return [...prev, {
          userId: payload.userId,
          fullName: payload.fullName || "Participant",
          avatar: payload.avatar || null,
        }];
      });
    };

    const handleParticipantLeft = (payload) => {
      if (!payload?.userId) return;
      setRemoteParticipants((prev) => prev.filter((p) => p.userId !== payload.userId));
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
      closePeer(payload.userId);
    };

    const handleOffer = async (payload) => {
      if (!payload?.fromUserId || !payload.offer) return;
      try {
        const pc = getOrCreatePeer(payload.fromUserId);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { meetingId, toUserId: payload.fromUserId, answer });
      } catch (err) {
        console.error("Offer handling failed:", err);
      }
    };

    const handleAnswer = async (payload) => {
      if (!payload?.fromUserId || !payload.answer) return;
      const pc = peersRef.current.get(payload.fromUserId);
      if (!pc) return;
      try {
        if (pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      } catch (err) {
        console.error("Answer handling failed:", err);
      }
    };

    const handleIceCandidate = async (payload) => {
      if (!payload?.fromUserId || !payload.candidate) return;
      const pc = peersRef.current.get(payload.fromUserId);
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.error("ICE candidate failed:", err);
      }
    };

    const handleChat = (payload) => {
      if (!payload?.text?.trim()) return;
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${payload.userId}-${Date.now()}-${Math.random()}`,
          userId: payload.userId,
          fullName: payload.fullName || "Participant",
          avatar: payload.avatar || null,
          text: payload.text.trim(),
          timestamp: payload.timestamp || new Date().toISOString(),
        },
      ]);
    };

    const handleNotesUpdate = (payload) => {
      if (typeof payload?.text === "string") {
        setNotes(payload.text);
        setNotesLastSavedAt(new Date().toISOString());
      }
    };

    const handleMuteAll = () => {
      setMicOn(false);
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
      toast("Host muted all participants", { icon: "🔇" });
    };

    const handleCameraOffAll = () => {
      setCamOn(false);
      localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = false));
      toast("Host turned off all cameras", { icon: "📷" });
    };

    const handleMeetingEnded = (payload) => {
      toast.error(
        payload?.reason === "host-inactivity"
          ? "Meeting ended (host inactive)"
          : payload?.reason === "auto-end-no-activity"
          ? "Meeting ended (no activity)"
          : "Meeting has ended",
      );
      setTimeout(() => navigate(`/meetings/${meetingId}`, { replace: true }), 1500);
    };

    const handleError = (payload) => {
      if (payload?.message) toast.error(payload.message);
    };

    socket.on("participant:joined", handleParticipantJoined);
    socket.on("participant:left", handleParticipantLeft);
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleIceCandidate);
    socket.on("chat:message", handleChat);
    socket.on("notes:update", handleNotesUpdate);
    socket.on("meeting:mute-all", handleMuteAll);
    socket.on("meeting:camera-off-all", handleCameraOffAll);
    socket.on("meeting:ended", handleMeetingEnded);
    socket.on("meeting:error", handleError);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("participant:joined", handleParticipantJoined);
      socket.off("participant:left", handleParticipantLeft);
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleIceCandidate);
      socket.off("chat:message", handleChat);
      socket.off("notes:update", handleNotesUpdate);
      socket.off("meeting:mute-all", handleMuteAll);
      socket.off("meeting:camera-off-all", handleCameraOffAll);
      socket.off("meeting:ended", handleMeetingEnded);
      socket.off("meeting:error", handleError);

      if (socket.connected) socket.emit("meeting:leave", { meetingId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, meetingId, currentUserId]);

  useEffect(() => {
    return () => {
      peersRef.current.forEach((pc) => { try { pc.close(); } catch {} });
      peersRef.current.clear();
    };
  }, []);

  /* ===================== CONTROLS ===================== */
  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    socketRef.current?.emit("participant:activity", { meetingId });
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    socketRef.current?.emit("participant:activity", { meetingId });
  };

  const toggleScreen = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenSharing(false);
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(camTrack);
        });
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      const screenTrack = stream.getVideoTracks()[0];
      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      screenTrack.onended = () => {
        setScreenSharing(false);
        screenStreamRef.current = null;
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (camTrack) {
          peersRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video");
            if (sender) sender.replaceTrack(camTrack);
          });
        }
      };
      setScreenSharing(true);
      socketRef.current?.emit("participant:activity", { meetingId });
    } catch (err) {
      if (err?.name !== "NotAllowedError") toast.error("Could not start screen share");
    }
  };

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    socketRef.current?.emit("meeting:hand-raise", { meetingId, raised: next });
  };

  /* ===================== CHAT / NOTES ===================== */
  const sendChat = (text) => {
    socketRef.current?.emit("chat:message", { meetingId, text });
    setChatMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        userId: currentUserId,
        fullName: currentUser?.fullName || "You",
        avatar: currentUser?.avatar || null,
        text,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const updateNotes = (text) => {
    setNotes(text);
    setNotesLastSavedAt(new Date().toISOString());
    socketRef.current?.emit("notes:update", { meetingId, text });
  };

  /* ===================== HOST ===================== */
  const handleMuteAll = () => socketRef.current?.emit("meeting:mute-all", { meetingId });
  const handleCameraOffAll = () => socketRef.current?.emit("meeting:camera-off-all", { meetingId });

  const handleEndMeeting = async () => {
    if (!window.confirm("End this meeting for all participants?")) return;
    try {
      socketRef.current?.emit("meeting:ended", { meetingId });
      await endMeeting(meetingId);
      toast.success("Meeting ended");
      setTimeout(() => navigate(`/meetings/${meetingId}`, { replace: true }), 500);
    } catch (error) {
      toast.error(getApiError(error, "Could not end meeting"));
    }
  };

  const handleLeave = async () => {
    try {
      socketRef.current?.emit("meeting:leave", { meetingId });
      if (!isHost) await leaveMeeting(meetingId);
    } catch {}
    finally {
      navigate(`/meetings/${meetingId}`, { replace: true });
    }
  };

  /* ===================== DERIVED ===================== */
  const isHost = useMemo(() => {
    const hostId = getUserId(meeting?.host);
    return hostId && currentUserId && hostId === currentUserId;
  }, [meeting, currentUserId]);

  const tiles = useMemo(() => {
    const list = [];
    list.push({
      userId: currentUserId || "me",
      stream: streamReady ? localStreamRef.current : null,
      participant: {
        userId: currentUserId,
        fullName: currentUser?.fullName || currentUser?.name || "You",
        avatar: currentUser?.avatar || null,
        isHost,
        isLocal: true,
        isMuted: !micOn,
        isVideoOff: !camOn,
        isSpeaking: speakingUserId === currentUserId,
      },
    });

    remoteParticipants.forEach((p) => {
      list.push({
        userId: p.userId,
        stream: remoteStreams[p.userId] || null,
        participant: {
          userId: p.userId,
          fullName: p.fullName,
          avatar: p.avatar,
          isHost: getUserId(meeting?.host) === p.userId,
          isLocal: false,
          isMuted: mutedUserIds.has(p.userId),
          isVideoOff: videoOffUserIds.has(p.userId),
          isSpeaking: speakingUserId === p.userId,
        },
      });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUserId, currentUser, isHost, micOn, camOn, streamReady,
    remoteParticipants, remoteStreams, meeting, mutedUserIds, videoOffUserIds, speakingUserId,
  ]);

  const participantsList = useMemo(() => {
    const list = [];
    list.push({
      userId: currentUserId,
      fullName: currentUser?.fullName || "You",
      avatar: currentUser?.avatar || null,
      isHost,
      isMuted: !micOn,
      isVideoOff: !camOn,
    });
    remoteParticipants.forEach((p) => {
      list.push({
        userId: p.userId,
        fullName: p.fullName,
        avatar: p.avatar,
        isHost: getUserId(meeting?.host) === p.userId,
        isMuted: mutedUserIds.has(p.userId),
        isVideoOff: videoOffUserIds.has(p.userId),
      });
    });
    return list;
  }, [
    currentUserId, currentUser, isHost, micOn, camOn, remoteParticipants,
    meeting, mutedUserIds, videoOffUserIds,
  ]);

  /* ===================== RENDER ===================== */
  if (loading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-page">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent-blue" />
          <p className="text-sm text-fg-2">Joining meeting…</p>
        </div>
      </div>
    );
  }

  if (fatalError) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-page px-4">
        <div className="max-w-md rounded-2xl border border-line bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-rose/15">
            <X className="h-6 w-6 text-accent-rose" />
          </div>
          <h2 className="text-lg font-semibold text-fg">Could not join meeting</h2>
          <p className="mt-2 text-sm text-fg-2">{fatalError}</p>
          <button
            onClick={() => navigate(`/meetings/${meetingId}`)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-blue/90"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to meeting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-page text-fg">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-card px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="rounded-lg p-2 text-fg-2 transition hover:bg-surface lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg sm:text-base">{meeting?.title || "Meeting"}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-fg-3">
              <span className={`h-1.5 w-1.5 rounded-full ${joined ? "bg-accent-emerald" : "bg-accent-amber"}`} />
              {joined ? "Live" : "Connecting…"}
              <span className="mx-1">·</span>
              {participantsList.length} participant{participantsList.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isHost && (
            <RecordingControls
              meetingId={meetingId}
              enabled={joined}
              streamToRecord={localStream}
              recording={recording}
              onToggleRecording={setRecording}
            />
          )}
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-2.5 py-2 text-xs font-semibold text-fg transition hover:bg-surface sm:px-3"
            title="Invite"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </button>
          {isHost && (
            <HostControls
              meetingCode={meeting?.meetingCode}
              isLive={joined}
              onMuteAll={handleMuteAll}
              onCameraOffAll={handleCameraOffAll}
              onEndMeeting={handleEndMeeting}
              onCopyLink={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/meetings/${meetingId}/room`);
                toast.success("Link copied");
              }}
              onCopyCode={() => {
                navigator.clipboard?.writeText(meeting?.meetingCode);
                toast.success("Code copied");
              }}
            />
          )}
        </div>
      </header>

      <main className="flex flex-1 min-h-0 gap-2 p-2 sm:gap-3 sm:p-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex-1 min-h-0">
            <VideoGrid tiles={tiles} />
            <LiveCaptionsOverlay
              caption={latestCaption}
              visible={joined && sidePanel !== "captions"}
              onOpenPanel={() => setSidePanel("captions")}
            />
          </div>
        </div>

        {sidePanel && (
          <aside className="hidden w-85 shrink-0 overflow-hidden rounded-2xl border border-line bg-card lg:flex">
            <SidePanelWrapper
              sidePanel={sidePanel}
              setSidePanel={setSidePanel}
              captions={captions}
              clearCaptions={clearCaptions}
              participants={participantsList}
              currentUserId={currentUserId}
              speakingUserId={speakingUserId}
              chatMessages={chatMessages}
              onSendChat={sendChat}
              notes={notes}
              onUpdateNotes={updateNotes}
              notesLastSavedAt={notesLastSavedAt}
              isLive={joined}
            />
          </aside>
        )}
      </main>

      <MeetingControls
        micOn={micOn}
        camOn={camOn}
        screenSharing={screenSharing}
        handRaised={handRaised}
        recording={recording}
        captionsOn={sidePanel === "captions"}
        sidePanel={sidePanel}
        isHost={isHost}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onToggleScreen={toggleScreen}
        onToggleHand={toggleHand}
        onToggleRecord={() => setRecording((v) => !v)}
        onToggleCaptions={() => setSidePanel((p) => (p === "captions" ? null : "captions"))}
        onToggleChat={() => setSidePanel((p) => (p === "chat" ? null : "chat"))}
        onToggleParticipants={() => setSidePanel((p) => (p === "participants" ? null : "participants"))}
        onLeave={handleLeave}
      />

      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div onClick={() => setMobileDrawerOpen(false)} className="absolute inset-0 bg-black/60" />
          <div className="absolute right-0 top-0 flex h-full w-[85vw] max-w-sm flex-col border-l border-line bg-card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-fg">Meeting panel</p>
              <button onClick={() => setMobileDrawerOpen(false)} className="rounded-lg p-2 text-fg-3 hover:bg-surface">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex shrink-0 gap-1 border-b border-line px-2 py-2 overflow-x-auto">
              {[
                { key: "participants", label: "People", icon: Users },
                { key: "chat", label: "Chat", icon: MessageSquare },
                { key: "captions", label: "Captions", icon: Captions },
                { key: "notes", label: "Notes", icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSidePanel(tab.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    sidePanel === tab.key ? "bg-accent-blue text-white" : "bg-surface text-fg-2 hover:bg-card"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0">
              {sidePanel ? (
                <SidePanelWrapper
                  sidePanel={sidePanel}
                  setSidePanel={setSidePanel}
                  captions={captions}
                  clearCaptions={clearCaptions}
                  participants={participantsList}
                  currentUserId={currentUserId}
                  speakingUserId={speakingUserId}
                  chatMessages={chatMessages}
                  onSendChat={sendChat}
                  notes={notes}
                  onUpdateNotes={updateNotes}
                  notesLastSavedAt={notesLastSavedAt}
                  isLive={joined}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-fg-3">
                  Select a tab above
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        meetingId={meetingId}
        meetingTitle={meeting?.title}
        meetingCode={meeting?.meetingCode}
      />
    </div>
  );
}

function SidePanelWrapper({
  sidePanel, setSidePanel, captions, clearCaptions, participants,
  currentUserId, speakingUserId, chatMessages, onSendChat,
  notes, onUpdateNotes, notesLastSavedAt, isLive,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="hidden shrink-0 items-center gap-1 border-b border-line px-2 py-2 lg:flex">
        {[
          { key: "participants", label: "People", icon: Users },
          { key: "chat", label: "Chat", icon: MessageSquare },
          { key: "captions", label: "Captions", icon: Captions },
          { key: "notes", label: "Notes", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSidePanel(tab.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              sidePanel === tab.key ? "bg-accent-blue text-white" : "text-fg-2 hover:bg-surface"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {sidePanel === "participants" && (
          <div className="h-full overflow-y-auto p-3">
            <ParticipantList participants={participants} speakingUserId={speakingUserId} currentUserId={currentUserId} />
          </div>
        )}
        {sidePanel === "chat" && (
          <MeetingChat messages={chatMessages} currentUserId={currentUserId} onSend={onSendChat} />
        )}
        {sidePanel === "captions" && (
          <LiveCaptionsPanel captions={captions} onClose={() => setSidePanel(null)} onClear={clearCaptions} isLive={isLive} />
        )}
        {sidePanel === "notes" && (
          <MeetingNotes value={notes} onChange={onUpdateNotes} lastSavedAt={notesLastSavedAt} />
        )}
      </div>
    </div>
  );
}