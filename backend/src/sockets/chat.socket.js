import Meeting from "../models/meeting.model.js";

const getMeetingRoomName = (meetingId) => `meeting:${meetingId}`;

const registerChatSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        socket.on("chat:message", async (payload = {}, callback) => {
            try {
                const { meetingId, message } = payload;

                if (!meetingId || !message || typeof message !== "string" || message.trim() === "" || message.length > 5000) {
                    throw new Error("Message content is required");
                }

                const meeting = await Meeting.findById(meetingId);

                if (!meeting) {
                    throw new Error("Meeting not found");
                }

                const isHost = meeting.host.toString() === socket.user._id.toString();
                const isParticipant = meeting.participants.some((memberId) => memberId.toString() === socket.user._id.toString());
                const isAdmin = socket.user.role === "admin";

                if (!isHost && !isParticipant && !isAdmin) {
                    throw new Error("You are not allowed to chat in this meeting");
                }

                if (meeting.status !== "live" || !socket.rooms.has(getMeetingRoomName(meetingId))) {
                    throw new Error("Join a live meeting before sending chat messages");
                }

                const payload = {
                    meetingId,
                    sender: {
                        _id: socket.user._id.toString(),
                        fullName: socket.user.fullName,
                        avatar: socket.user.avatar,
                    },
                    message: message.trim(),
                    timestamp: new Date().toISOString(),
                };

                io.to(getMeetingRoomName(meetingId)).emit("chat:message", payload);

                if (typeof callback === "function") {
                    callback({ ok: true, payload });
                }
            } catch (error) {
                if (typeof callback === "function") {
                    callback({ ok: false, message: error.message });
                }
                socket.emit("meeting:error", { message: error.message });
            }
        });
    });
};

export { registerChatSocketHandlers };
