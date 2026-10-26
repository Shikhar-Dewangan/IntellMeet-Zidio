import mongoose from "mongoose";

import Meeting from "../models/meeting.model.js";

import {
  endMeetingLifecycle,
  scheduleHostInactivityEnd,
  clearHostInactivityEnd,
  touchMeetingActivity
} from "../services/meeting.service.js";

const getMeetingRoomName = (meetingId) => `meeting:${meetingId}`;

const getUserRoomName = (userId) => `user:${userId}`;

// ----------------------------------------------------
// Meeting Access
// ----------------------------------------------------

const verifyMeetingMembership = async (user, meetingId) => {
  if (!mongoose.Types.ObjectId.isValid(meetingId)) {
    throw new Error("Valid meeting id is required");
  }

  const meeting = await Meeting.findById(meetingId);

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  const userId = user._id.toString();

  const isHost = meeting.host.toString() === userId;

  const isParticipant = meeting.participants.some(
    (memberId) => memberId.toString() === userId,
  );

  // Invited (pending/accepted) users ko bhi allow karo, rejected ko nahi
  const isInvited = meeting.invitedUsers?.some(
    (inv) => inv.user?.toString() === userId && inv.status !== "rejected",
  );

  const isAdmin = user.role === "admin";

  if (!isHost && !isParticipant && !isInvited && !isAdmin) {
    throw new Error("You are not authorized to access this meeting");
  }

  return meeting;
};

// ----------------------------------------------------
// Live Room Access
// ----------------------------------------------------

const verifyLiveRoomAccess = async (socket, meetingId) => {
  const meeting = await verifyMeetingMembership(socket.user, meetingId);

  const roomName = getMeetingRoomName(meetingId);

  if (meeting.status !== "live" || !socket.rooms.has(roomName)) {
    throw new Error("Join a live meeting before using this event");
  }

  return meeting;
};

// ----------------------------------------------------
// WebRTC Signaling
// ----------------------------------------------------

const relayWebRtcSignal = async (io, socket, eventName, payload, signalKey) => {
  try {
    const { meetingId, toUserId } = payload || {};

    const signal = payload?.[signalKey];

    if (!toUserId || !mongoose.Types.ObjectId.isValid(toUserId) || !signal) {
      throw new Error(`Invalid WebRTC ${signalKey} payload`);
    }

    if (toUserId.toString() === socket.user._id.toString()) {
      throw new Error("Cannot send a WebRTC signal to yourself");
    }

    const meeting = await verifyLiveRoomAccess(socket, meetingId);

    const targetIsMember =
      meeting.host.toString() === toUserId.toString() ||
      meeting.participants.some(
        (memberId) => memberId.toString() === toUserId.toString(),
      );

    if (!targetIsMember) {
      throw new Error("Signal recipient is not a participant in this meeting");
    }

    const roomName = getMeetingRoomName(meetingId);

    const targetSockets = await io.in(getUserRoomName(toUserId)).fetchSockets();

    if (
      !targetSockets.some((targetSocket) => targetSocket.rooms.has(roomName))
    ) {
      throw new Error("Signal recipient is not connected to this meeting");
    }

    io.to(getUserRoomName(toUserId)).emit(eventName, {
      fromUserId: socket.user._id.toString(),

      meetingId,

      [signalKey]: signal,
    });
  } catch (error) {
    socket.emit("meeting:error", {
      message: error.message,
    });
  }
};

// ----------------------------------------------------
// Trusted Transcript Broadcast
// ----------------------------------------------------

/*
 * This function is called by the server-side
 * live transcription controller after the audio
 * has actually been transcribed.
 *
 * Do NOT allow the browser to directly emit
 * arbitrary transcript text as trusted data.
 */
const emitTranscriptSegment = (
  io,
  {
    meetingId,
    speakerId,
    speakerName,
    text,
    language = null,
    timestamp = new Date().toISOString(),
    sequence = null,
  },
) => {
  if (!meetingId || !speakerId || !text?.trim()) {
    return;
  }

  const payload = {
    meetingId: meetingId.toString(),

    speakerId: speakerId.toString(),

    speakerName: speakerName || "Participant",

    text: text.trim(),

    language,

    timestamp,

    sequence,
  };

  io.to(getMeetingRoomName(meetingId)).emit("transcript:segment", payload);
};

// ----------------------------------------------------
// Register Meeting Socket Handlers
// ----------------------------------------------------

const registerMeetingSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    const userRoom = getUserRoomName(socket.user._id.toString());

    socket.join(userRoom);

    // ------------------------------------------------
    // Meeting Join
    // ------------------------------------------------

    socket.on("meeting:join", async (payload = {}, callback) => {
      try {
        const { meetingId } = payload;

        const meeting = await verifyMeetingMembership(socket.user, meetingId);


        const roomName = getMeetingRoomName(meetingId);

        if (meeting.status !== "live") {
          throw new Error("Meeting is not live");
        }

         if (meeting.host.toString() !== socket.user._id.toString()) {
          await Meeting.updateOne(
            { _id: meetingId },
            {
              $addToSet: { participants: socket.user._id },
              $set: { "invitedUsers.$[inv].status": "accepted" },
            },
            { arrayFilters: [{ "inv.user": socket.user._id }] },
          );
        }
        
        const existingRoomSockets = await io.in(roomName).fetchSockets();

        const alreadyPresent = existingRoomSockets.some(
          (roomSocket) => roomSocket.data.userId === socket.user._id.toString(),
        );

        /*
         * Host returned to meeting.
         * Cancel inactivity shutdown.
         */
        if (meeting.host.toString() === socket.user._id.toString()) {
          clearHostInactivityEnd(meetingId);
        }

        socket.join(roomName);

        socket.data.meetingId = meetingId;

        // Touch activity
        await touchMeetingActivity(meetingId);

        const participantPayload = {
          userId: socket.user._id.toString(),

          fullName: socket.user.fullName,

          avatar: socket.user.avatar,
        };

        if (!alreadyPresent) {
          socket.to(roomName).emit("participant:joined", participantPayload);
        }

        const joinedSockets = await io.in(roomName).fetchSockets();

        const participants = new Map();

        joinedSockets.forEach((roomSocket) => {
          const participantId = roomSocket.data.userId;

          if (participantId && !participants.has(participantId)) {
            participants.set(participantId, {
              userId: participantId,

              fullName: roomSocket.data.participant?.fullName || "",

              avatar: roomSocket.data.participant?.avatar || "",
            });
          }
        });

        if (typeof callback === "function") {
          callback({
            ok: true,

            meetingId,

            userId: socket.user._id.toString(),

            participants: [...participants.values()],
          });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({
            ok: false,
            message: error.message,
          });
        }

        socket.emit("meeting:error", {
          message: error.message,
        });
      }
    });

    // ------------------------------------------------
    // Meeting Leave
    // ------------------------------------------------

    socket.on("meeting:leave", async (payload = {}, callback) => {
      try {
        const { meetingId } = payload;

        if (!mongoose.Types.ObjectId.isValid(meetingId)) {
          throw new Error("Valid meeting id is required");
        }

        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
          throw new Error("Meeting not found");
        }

        const roomName = getMeetingRoomName(meetingId);

        const wasInRoom = socket.rooms.has(roomName);

        socket.leave(roomName);

        socket.data.meetingId = null;

        if (wasInRoom) {
          socket.to(roomName).emit("participant:left", {
            userId: socket.user._id.toString(),

            meetingId: meeting._id.toString(),
          });

          /*
           * Host left.
           *
           * Do NOT end immediately.
           * Start 10-minute inactivity timer.
           */
          if (meeting.host.toString() === socket.user._id.toString()) {
            const remainingSockets = await io.in(roomName).fetchSockets();

            const hostStillPresent = remainingSockets.some(
              (roomSocket) =>
                roomSocket.data.userId === socket.user._id.toString(),
            );

            if (hostStillPresent) {
              clearHostInactivityEnd(meeting._id);
            } else {
              scheduleHostInactivityEnd(meeting._id, (endedMeeting) => {
                io.to(roomName).emit("meeting:ended", {
                  meetingId: endedMeeting._id.toString(),

                  endedBy: null,

                  reason: "host-inactivity",

                  endedAt: endedMeeting.endedAt,
                });
              });
            }
          }
        }

        if (typeof callback === "function") {
          callback({
            ok: true,

            meetingId: meeting._id.toString(),
          });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({
            ok: false,

            message: error.message,
          });
        }

        socket.emit("meeting:error", {
          message: error.message,
        });
      }
    });

    // ------------------------------------------------
    // Participant Activity Ping
    // ------------------------------------------------
    socket.on("participant:activity", async (payload = {}) => {
      try {
        const { meetingId } = payload;
        await verifyLiveRoomAccess(socket, meetingId);
        await touchMeetingActivity(meetingId);
      } catch {
        // Best-effort — silently ignore
      }
    });

    // ------------------------------------------------
    // Hand Raise
    // ------------------------------------------------
    socket.on("meeting:hand-raise", async (payload = {}) => {
      try {
        const { meetingId, raised } = payload;
        await verifyLiveRoomAccess(socket, meetingId);
        await touchMeetingActivity(meetingId);

        io.to(getMeetingRoomName(meetingId)).emit("meeting:hand-raise", {
          meetingId,
          userId: socket.user._id.toString(),
          fullName: socket.user.fullName,
          raised: !!raised,
        });
      } catch (error) {
        socket.emit("meeting:error", { message: error.message });
      }
    });

    // ------------------------------------------------
    // WebRTC
    // ------------------------------------------------

    socket.on("webrtc:offer", (payload) => {
      relayWebRtcSignal(io, socket, "webrtc:offer", payload, "offer");
    });

    socket.on("webrtc:answer", (payload) => {
      relayWebRtcSignal(io, socket, "webrtc:answer", payload, "answer");
    });

    socket.on("webrtc:ice-candidate", (payload) => {
      relayWebRtcSignal(
        io,
        socket,
        "webrtc:ice-candidate",
        payload,
        "candidate",
      );
    });

    // ------------------------------------------------
    // Host: Mute All
    // ------------------------------------------------

    socket.on("meeting:mute-all", async (payload = {}, callback) => {
      try {
        const { meetingId } = payload;

        const meeting = await verifyLiveRoomAccess(socket, meetingId);

        if (meeting.host.toString() !== socket.user._id.toString()) {
          throw new Error("Only meeting host can mute all participants");
        }

        //  Touch activity
        await touchMeetingActivity(meetingId);

        io.to(getMeetingRoomName(meetingId)).emit("meeting:mute-all", {
          meetingId,

          hostId: socket.user._id.toString(),
        });

        if (typeof callback === "function") {
          callback({
            ok: true,
          });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({
            ok: false,

            message: error.message,
          });
        }

        socket.emit("meeting:error", {
          message: error.message,
        });
      }
    });

    // ------------------------------------------------
    // Host: Camera Off All
    // ------------------------------------------------

    socket.on("meeting:camera-off-all", async (payload = {}, callback) => {
      try {
        const { meetingId } = payload;

        const meeting = await verifyLiveRoomAccess(socket, meetingId);

        if (meeting.host.toString() !== socket.user._id.toString()) {
          throw new Error("Only meeting host can turn off all cameras");
        }

        //  Touch activity
        await touchMeetingActivity(meetingId);

        io.to(getMeetingRoomName(meetingId)).emit("meeting:camera-off-all", {
          meetingId,

          hostId: socket.user._id.toString(),
        });

        if (typeof callback === "function") {
          callback({
            ok: true,
          });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({
            ok: false,

            message: error.message,
          });
        }

        socket.emit("meeting:error", {
          message: error.message,
        });
      }
    });

    // ------------------------------------------------
    // Host: End Meeting
    // ------------------------------------------------

    socket.on("meeting:ended", async (payload = {}, callback) => {
      try {
        const { meetingId } = payload;

        const meeting = await verifyLiveRoomAccess(socket, meetingId);

        if (meeting.host.toString() !== socket.user._id.toString()) {
          throw new Error("Only meeting host can end the meeting");
        }

        const endedMeeting = await endMeetingLifecycle(
          meetingId,
          socket.user._id,
        );

        io.to(getMeetingRoomName(meetingId)).emit("meeting:ended", {
          meetingId,

          endedBy: socket.user._id.toString(),

          endedAt: endedMeeting.endedAt,
        });

        if (typeof callback === "function") {
          callback({
            ok: true,
          });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({
            ok: false,

            message: error.message,
          });
        }

        socket.emit("meeting:error", {
          message: error.message,
        });
      }
    });

    // ------------------------------------------------
    // Disconnect
    // ------------------------------------------------

    socket.on("disconnecting", () => {
      const userId = socket.user?._id?.toString();

      if (!userId) {
        return;
      }

      for (const roomName of socket.rooms) {
        if (!roomName.startsWith("meeting:")) {
          continue;
        }

        const meetingId = roomName.slice("meeting:".length);

        io.in(roomName)
          .fetchSockets()
          .then((roomSockets) => {
            const userRemains = roomSockets.some(
              (roomSocket) =>
                roomSocket.id !== socket.id &&
                roomSocket.data.userId === userId,
            );

            if (userRemains) {
              return;
            }

            socket.to(roomName).emit("participant:left", {
              userId,

              meetingId,
            });

            Meeting.findById(meetingId)
              .then((meeting) => {
                if (
                  meeting?.status === "live" &&
                  meeting.host.toString() === userId
                ) {
                  scheduleHostInactivityEnd(meetingId, (endedMeeting) => {
                    io.to(roomName).emit("meeting:ended", {
                      meetingId: endedMeeting._id.toString(),

                      endedBy: null,

                      reason: "host-inactivity",

                      endedAt: endedMeeting.endedAt,
                    });
                  });
                }
              })
              .catch((error) => {
                console.error(
                  "Unable to schedule meeting host inactivity:",
                  error.message,
                );
              });
          })
          .catch(() => { });
      }
    });
  });
};

export { registerMeetingSocketHandlers, emitTranscriptSegment };
