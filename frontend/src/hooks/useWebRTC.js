import { useCallback, useEffect, useRef, useState } from "react";

const defaultConstraints = { audio: true, video: true };

export default function useWebRTC({
  enabled = false,
  constraints = defaultConstraints,
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
        if (active) localStreamRef.current = stream;
        else stream.getTracks().forEach((track) => track.stop());
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
  }, [constraints, enabled]);

  const createPeerConnection = useCallback(
    (peerId, onIceCandidate, onTrack) => {
      const connection = new RTCPeerConnection();
      localStreamRef.current
        ?.getTracks()
        .forEach((track) => connection.addTrack(track, localStreamRef.current));
      connection.onicecandidate = (event) => {
        if (event.candidate) onIceCandidate?.(peerId, event.candidate);
      };
      connection.ontrack = (event) => onTrack?.(peerId, event.streams[0]);
      peerConnectionsRef.current.set(peerId, connection);
      return connection;
    },
    [],
  );

  const closePeerConnection = useCallback((peerId) => {
    peerConnectionsRef.current.get(peerId)?.close();
    peerConnectionsRef.current.delete(peerId);
  }, []);

  return { localStreamRef, error, createPeerConnection, closePeerConnection };
}
