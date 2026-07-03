"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * WebRTC mesh client for /meet rooms. One RTCPeerConnection per remote peer,
 * signaled over the backend WebSocket relay. Renegotiation (e.g. screen share)
 * uses the "perfect negotiation" pattern with a deterministic polite role.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export type RemotePeer = {
  id: string;
  name: string;
  mic: boolean;
  cam: boolean;
  hand: boolean;
  stream: MediaStream | null;
};

export type CallChatMessage = {
  id: string;
  name: string;
  text: string;
  time: string;
  self: boolean;
};

type PeerEntry = {
  pc: RTCPeerConnection;
  makingOffer: boolean;
  ignoreOffer: boolean;
  polite: boolean;
};

type ServerMessage =
  | { type: "welcome"; selfId: string; peers: Array<{ id: string; name: string; mic: boolean; cam: boolean; hand: boolean }> }
  | { type: "peer-joined"; peer: { id: string; name: string; mic: boolean; cam: boolean; hand: boolean } }
  | { type: "peer-left"; id: string }
  | { type: "signal"; from: string; data: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit } }
  | { type: "state"; id: string; mic: boolean; cam: boolean; hand: boolean }
  | { type: "chat"; from: string; name: string; text: string; time: string };

export function useWebrtcRoom({
  roomId,
  displayName,
  localStream,
  enabled,
}: {
  roomId: string;
  displayName: string;
  localStream: MediaStream | null;
  enabled: boolean;
}) {
  const [connected, setConnected] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [peers, setPeers] = useState<RemotePeer[]>([]);
  const [messages, setMessages] = useState<CallChatMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const selfIdRef = useRef("");
  const entriesRef = useRef(new Map<string, PeerEntry>());
  const localStreamRef = useRef(localStream);
  localStreamRef.current = localStream;

  const sendRaw = useCallback((msg: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  const updatePeer = useCallback((id: string, patch: Partial<RemotePeer>) => {
    setPeers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const createPeer = useCallback(
    (id: string, name: string, state: { mic: boolean; cam: boolean; hand: boolean }) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const entry: PeerEntry = {
        pc,
        makingOffer: false,
        ignoreOffer: false,
        polite: selfIdRef.current < id,
      };
      entriesRef.current.set(id, entry);

      const stream = localStreamRef.current;
      stream?.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) sendRaw({ type: "signal", to: id, data: { candidate: e.candidate.toJSON() } });
      };
      pc.ontrack = (e) => {
        const remote = e.streams[0];
        if (remote) updatePeer(id, { stream: remote });
      };
      pc.onnegotiationneeded = async () => {
        try {
          entry.makingOffer = true;
          await pc.setLocalDescription();
          sendRaw({ type: "signal", to: id, data: { description: pc.localDescription } });
        } catch {
          // connection torn down mid-negotiation
        } finally {
          entry.makingOffer = false;
        }
      };

      setPeers((prev) => [...prev.filter((p) => p.id !== id), { id, name, ...state, stream: null }]);
    },
    [sendRaw, updatePeer],
  );

  const handleSignal = useCallback(
    async (from: string, data: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) => {
      const entry = entriesRef.current.get(from);
      if (!entry) return;
      const { pc } = entry;
      try {
        if (data.description) {
          const description = data.description;
          const collision = description.type === "offer" && (entry.makingOffer || pc.signalingState !== "stable");
          entry.ignoreOffer = !entry.polite && collision;
          if (entry.ignoreOffer) return;
          await pc.setRemoteDescription(description);
          if (description.type === "offer") {
            await pc.setLocalDescription();
            sendRaw({ type: "signal", to: from, data: { description: pc.localDescription } });
          }
        } else if (data.candidate) {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (err) {
            if (!entry.ignoreOffer) throw err;
          }
        }
      } catch {
        // ignore — a dropped negotiation recovers on the next negotiationneeded
      }
    },
    [sendRaw],
  );

  useEffect(() => {
    if (!enabled) return;
    setFailed(null);
    const wsUrl = `${BASE.replace(/^http/, "ws")}/ws/meet/${encodeURIComponent(roomId)}?name=${encodeURIComponent(displayName)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onmessage = (ev) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(ev.data)) as ServerMessage;
      } catch {
        return;
      }
      switch (msg.type) {
        case "welcome":
          selfIdRef.current = msg.selfId;
          msg.peers.forEach((p) => createPeer(p.id, p.name, { mic: p.mic, cam: p.cam, hand: p.hand }));
          break;
        case "peer-joined":
          createPeer(msg.peer.id, msg.peer.name, { mic: msg.peer.mic, cam: msg.peer.cam, hand: msg.peer.hand });
          break;
        case "peer-left": {
          entriesRef.current.get(msg.id)?.pc.close();
          entriesRef.current.delete(msg.id);
          setPeers((prev) => prev.filter((p) => p.id !== msg.id));
          break;
        }
        case "signal":
          void handleSignal(msg.from, msg.data);
          break;
        case "state":
          updatePeer(msg.id, { mic: msg.mic, cam: msg.cam, hand: msg.hand });
          break;
        case "chat":
          setMessages((prev) => [
            ...prev,
            { id: `${msg.from}-${prev.length}`, name: msg.name, text: msg.text, time: msg.time, self: false },
          ]);
          break;
      }
    };
    ws.onclose = (e) => {
      setConnected(false);
      if (e.code === 4403) setFailed(e.reason || "You are not invited to this meeting");
      else if (e.code === 4401) setFailed("Sign in to join this meeting");
    };

    const entries = entriesRef.current;
    return () => {
      ws.close();
      wsRef.current = null;
      entries.forEach((e) => e.pc.close());
      entries.clear();
      selfIdRef.current = "";
      setPeers([]);
      setMessages([]);
      setConnected(false);
    };
  }, [enabled, roomId, displayName, createPeer, handleSignal, updatePeer]);

  const sendChat = useCallback(
    (text: string) => {
      sendRaw({ type: "chat", text });
      setMessages((prev) => [
        ...prev,
        { id: `self-${prev.length}`, name: displayName, text, time: new Date().toISOString(), self: true },
      ]);
    },
    [sendRaw, displayName],
  );

  const sendState = useCallback(
    (state: { mic?: boolean; cam?: boolean; hand?: boolean }) => sendRaw({ type: "state", ...state }),
    [sendRaw],
  );

  /** Swap the outgoing video track on every peer connection (screen share on/off). */
  const replaceVideoTrack = useCallback(async (track: MediaStreamTrack | null) => {
    const fallback = localStreamRef.current?.getVideoTracks()[0] ?? null;
    const next = track ?? fallback;
    await Promise.all(
      [...entriesRef.current.values()].flatMap(({ pc }) =>
        pc
          .getSenders()
          .filter((s) => s.track?.kind === "video")
          .map((s) => s.replaceTrack(next)),
      ),
    );
  }, []);

  return { connected, failed, peers, messages, sendChat, sendState, replaceVideoTrack };
}
