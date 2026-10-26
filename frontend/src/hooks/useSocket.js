import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let sharedSocket = null;
let activeUsers = 0;
let disconnectTimer = null;

const getSocketUrl = () =>
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, "");

const getSharedSocket = () => {
  const url = getSocketUrl();
  if (!url) return null;

  if (!sharedSocket) {
    sharedSocket = io(url, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    sharedSocket.on("connect", () =>
      console.log("[socket] connected", sharedSocket.id),
    );
    sharedSocket.on("disconnect", (reason) =>
      console.warn("[socket] disconnected:", reason),
    );
    sharedSocket.on("connect_error", (err) =>
      console.warn("[socket] connect_error:", err.message),
    );
    sharedSocket.on("meeting:error", (e) =>
      console.warn("[socket] meeting:error:", e?.message),
    );
  }
  return sharedSocket;
};

export default function useSocket({ enabled = true } = {}) {
  const socketRef = useRef(null);

  // Render ke dauran hi set karo, taaki child effects ko null na mile
  if (enabled && !socketRef.current) {
    socketRef.current = getSharedSocket();
  }

  useEffect(() => {
    if (!enabled) return undefined;

    clearTimeout(disconnectTimer);
    if (!socketRef.current) socketRef.current = getSharedSocket();
    activeUsers += 1;

    return () => {
      activeUsers -= 1;
      disconnectTimer = setTimeout(() => {
        if (activeUsers === 0 && sharedSocket) {
          sharedSocket.disconnect();
          sharedSocket = null;
        }
      }, 1000);
    };
  }, [enabled]);

  return socketRef;
}