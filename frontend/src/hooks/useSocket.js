import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket({ token, enabled = true } = {}) {
  const socketRef = useRef(null);
  const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, "");

  useEffect(() => {
    if (!enabled || !socketUrl) return undefined;

    const socket = io(socketUrl, {
      withCredentials: true,
      ...(token ? { auth: { token } } : {}),
    });
    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, socketUrl, token]);

  return socketRef;
}
