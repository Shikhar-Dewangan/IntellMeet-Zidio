import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import { registerMeetingSocketHandlers } from "./meeting.socket.js";
import { registerChatSocketHandlers } from "./chat.socket.js";

let io;

const initSocketServer = (server) => {
    if (io) {
        return io;
    }

    io = new Server(server, {
        cors: {
            origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((origin) => origin.trim()),
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        try {
            const authHeader = socket.handshake.headers.authorization || socket.handshake.auth?.token;
            const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
                ? authHeader.replace("Bearer ", "")
                : authHeader;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

            if (!user || !user.isActive) {
                return next(new Error("Invalid or inactive user token"));
            }

            socket.user = user;
            socket.data.userId = user._id.toString();
            socket.data.participant = {
                fullName: user.fullName,
                avatar: user.avatar,
            };
            next();
        } catch (error) {
            next(new Error(error?.message || "Invalid token"));
        }
    });

    registerMeetingSocketHandlers(io);
    registerChatSocketHandlers(io);

    io.on("connection", (socket) => {
        socket.emit("connected", {
            userId: socket.user._id.toString(),
            role: socket.user.role,
        });
    });

    return io;
};

const getSocketServer = () => io;

export { initSocketServer, getSocketServer };
