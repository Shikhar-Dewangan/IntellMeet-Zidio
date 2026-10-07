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

const defaultIceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export default function useWebRTC({
  enabled = false,
  constraints = defaultConstraints,
  onLocalStream,
} = {}) {
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const [error, setError] = useState(null);

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
        } else {
          stream.getTracks().forEach((track) => track.stop());
        }
      })
      .catch((mediaError) => {
        if (active) setError(mediaError);
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
    // Reuse existing
    if (peerConnectionsRef.current.has(peerId)) {
      return peerConnectionsRef.current.get(peerId);
    }

    const connection = new RTCPeerConnection({
      iceServers: defaultIceServers,
      iceCandidatePoolSize: 10, // ✅ Pre-gather ICE candidates
    });

    localStreamRef.current?.getTracks().forEach((track) => {
      connection.addTrack(track, localStreamRef.current);
    });

    connection.onicecandidate = (event) => {
      if (event.candidate) onIceCandidate?.(peerId, event.candidate);
    };

    connection.ontrack = (event) => onTrack?.(peerId, event.streams[0]);

    connection.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(connection.connectionState)) {
        try { connection.close(); } catch {}
        peerConnectionsRef.current.delete(peerId);
      }
    };

    peerConnectionsRef.current.set(peerId, connection);
    return connection;
  }, []);

  const closePeerConnection = useCallback((peerId) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      try { pc.close(); } catch {}
      peerConnectionsRef.current.delete(peerId);
    }
  }, []);

  return { localStreamRef, error, createPeerConnection, closePeerConnection };
}