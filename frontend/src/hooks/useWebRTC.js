import { useCallback, useEffect, useRef, useState } from "react";

const defaultConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
  },
};

const buildIceServers = () => {
  const servers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl.split(",").map((u) => u.trim()),
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    });
  }
  return servers;
};

export default function useWebRTC({
  enabled = false,
  constraints = defaultConstraints,
  onLocalStream,
} = {}) {
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const streamWaitersRef = useRef([]);
  const [error, setError] = useState(null);

  const flushWaiters = (stream) => {
    streamWaitersRef.current.forEach((resolve) => resolve(stream));
    streamWaitersRef.current = [];
  };

  // Offer/answer banane se pehle ise await karo
  const waitForLocalStream = useCallback(() => {
    if (localStreamRef.current) return Promise.resolve(localStreamRef.current);
    return new Promise((resolve) => streamWaitersRef.current.push(resolve));
  }, []);

  useEffect(() => {
    if (!enabled || !navigator.mediaDevices?.getUserMedia) return undefined;
    let active = true;
    const peerConnections = peerConnectionsRef.current;

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (active) {
          localStreamRef.current = stream;
          onLocalStream?.(stream);
          flushWaiters(stream);
        } else {
          stream.getTracks().forEach((track) => track.stop());
        }
      })
      .catch((mediaError) => {
        if (active) {
          setError(mediaError);
          // Camera/mic na mile tab bhi signaling aage badhe (receive-only)
          flushWaiters(null);
        }
      });

    return () => {
      active = false;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      peerConnections.forEach((connection) => connection.close());
      peerConnections.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constraints, enabled]);

  const createPeerConnection = useCallback((peerId, onIceCandidate, onTrack) => {
    if (peerConnectionsRef.current.has(peerId)) {
      return peerConnectionsRef.current.get(peerId);
    }

    const connection = new RTCPeerConnection({
      iceServers: buildIceServers(),
      iceCandidatePoolSize: 10,
    });

    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        connection.addTrack(track, localStream);
      });
    } else {
      // Local media nahi hai to bhi doosre ka video/audio receive ho sake
      connection.addTransceiver("audio", { direction: "recvonly" });
      connection.addTransceiver("video", { direction: "recvonly" });
    }

    connection.onicecandidate = (event) => {
      if (event.candidate) onIceCandidate?.(peerId, event.candidate);
    };

    connection.ontrack = (event) => onTrack?.(peerId, event.streams[0]);

    connection.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(connection.connectionState)) {
        try { connection.close(); } catch { /* ignore */ }
        peerConnectionsRef.current.delete(peerId);
      }
    };

    peerConnectionsRef.current.set(peerId, connection);
    return connection;
  }, []);

  const closePeerConnection = useCallback((peerId) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) { 
      try { pc.close(); } catch { /* ignore */ }
      peerConnectionsRef.current.delete(peerId);
    }
  }, []);

  return {
    waitForLocalStream,
    createPeerConnection,
    closePeerConnection,
  };
}