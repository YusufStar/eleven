import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

/**
 * WebRTC signaling for /meet rooms. Pure relay — no media touches the server.
 * Mesh topology: the newest peer initiates an offer to every existing peer.
 * ponytail: in-memory rooms, fine for local/single-instance; move to Redis pub/sub to scale out.
 */

type PeerState = { mic: boolean; cam: boolean; hand: boolean };
type Peer = {
  id: string;
  name: string;
  userId: string;
  state: PeerState;
  send: (msg: ServerMessage) => void;
  close: () => void;
};

type ClientMessage =
  | { type: "signal"; to: string; data: unknown }
  | { type: "state"; mic?: boolean; cam?: boolean; hand?: boolean }
  | { type: "chat"; text: string };

type ServerMessage =
  | { type: "welcome"; selfId: string; peers: Array<{ id: string; name: string } & PeerState> }
  | { type: "peer-joined"; peer: { id: string; name: string } & PeerState }
  | { type: "peer-left"; id: string }
  | { type: "signal"; from: string; data: unknown }
  | { type: "state"; id: string; mic: boolean; cam: boolean; hand: boolean }
  | { type: "chat"; from: string; name: string; text: string; time: string };

const rooms = new Map<string, Map<string, Peer>>();

const MAX_MESSAGE_BYTES = 64 * 1024; // SDP offers are ~10 KB; anything bigger is abuse
const MAX_PEERS_PER_ROOM = 12; // mesh topology ceiling

function broadcast(room: Map<string, Peer>, msg: ServerMessage, exceptId?: string) {
  for (const peer of room.values()) {
    if (peer.id !== exceptId) peer.send(msg);
  }
}

export const meetSignalRoutes = new Elysia()
  .use(authPlugin)
  .ws("/ws/meet/:roomId", {
    async open(ws) {
      const { user, activeOrganizationId, activeMember } = ws.data as unknown as {
        user: { id: string; name: string } | null;
        activeOrganizationId: string | null;
        activeMember: { id: string } | null;
      };
      if (!user || !activeOrganizationId || !activeMember) {
        ws.close(4401, "Unauthorized");
        return;
      }
      const roomId = (ws.data as { params: { roomId: string } }).params.roomId;
      if (!/^[a-z0-9-]{1,64}$/i.test(roomId)) {
        ws.close(4400, "Invalid room");
        return;
      }
      // scheduled meetings enforce their invite list; unknown codes are ad-hoc org rooms
      const meeting = await prisma.meeting.findUnique({
        where: { code: roomId },
        select: {
          id: true,
          organizationId: true,
          isPublic: true,
          createdById: true,
          participants: { select: { memberId: true } },
        },
      });
      if (meeting) {
        const allowed =
          meeting.organizationId === activeOrganizationId &&
          (meeting.isPublic ||
            meeting.createdById === activeMember.id ||
            meeting.participants.some((p) => p.memberId === activeMember.id));
        if (!allowed) {
          ws.close(4403, "You are not invited to this meeting");
          return;
        }
        // attendance: one row per join session; leftAt closes it
        const attendance = await prisma.meetingAttendance.create({
          data: { meetingId: meeting.id, memberId: activeMember.id },
        });
        (ws.data as Record<string, unknown>).attendanceId = attendance.id;
      }
      // rooms are scoped per organization so codes never collide across tenants
      const roomKey = `${activeOrganizationId}:${roomId}`;
      let room = rooms.get(roomKey);
      if (!room) {
        room = new Map();
        rooms.set(roomKey, room);
      }
      if (room.size >= MAX_PEERS_PER_ROOM) {
        ws.close(4403, "Room is full");
        return;
      }

      const url = new URL((ws.data as { request: Request }).request.url);
      const displayName = (url.searchParams.get("name") || user.name || "Guest").slice(0, 60);

      const peer: Peer = {
        id: crypto.randomUUID(),
        name: displayName,
        userId: user.id,
        state: { mic: true, cam: true, hand: false },
        send: (msg) => ws.send(JSON.stringify(msg)),
        close: () => ws.close(),
      };
      (ws.data as Record<string, unknown>).peer = peer;
      (ws.data as Record<string, unknown>).roomKey = roomKey;

      peer.send({
        type: "welcome",
        selfId: peer.id,
        peers: [...room.values()].map((p) => ({ id: p.id, name: p.name, ...p.state })),
      });
      broadcast(room, { type: "peer-joined", peer: { id: peer.id, name: peer.name, ...peer.state } });
      room.set(peer.id, peer);
    },

    message(ws, raw) {
      const data = ws.data as unknown as { peer?: Peer; roomKey?: string };
      const peer = data.peer;
      const room = data.roomKey ? rooms.get(data.roomKey) : undefined;
      if (!peer || !room) return;

      const text = typeof raw === "string" ? raw : JSON.stringify(raw);
      if (text.length > MAX_MESSAGE_BYTES) return;

      let msg: ClientMessage;
      try {
        msg = (typeof raw === "string" ? JSON.parse(raw) : raw) as ClientMessage;
      } catch {
        return;
      }

      switch (msg.type) {
        case "signal": {
          if (typeof msg.to !== "string") return;
          room.get(msg.to)?.send({ type: "signal", from: peer.id, data: msg.data });
          break;
        }
        case "state": {
          if (typeof msg.mic === "boolean") peer.state.mic = msg.mic;
          if (typeof msg.cam === "boolean") peer.state.cam = msg.cam;
          if (typeof msg.hand === "boolean") peer.state.hand = msg.hand;
          broadcast(room, { type: "state", id: peer.id, ...peer.state }, peer.id);
          break;
        }
        case "chat": {
          const chatText = typeof msg.text === "string" ? msg.text.trim().slice(0, 2000) : "";
          if (!chatText) return;
          broadcast(room, {
            type: "chat",
            from: peer.id,
            name: peer.name,
            text: chatText,
            time: new Date().toISOString(),
          });
          break;
        }
      }
    },

    close(ws) {
      const data = ws.data as unknown as { peer?: Peer; roomKey?: string; attendanceId?: string };
      if (data.attendanceId) {
        prisma.meetingAttendance
          .update({ where: { id: data.attendanceId }, data: { leftAt: new Date() } })
          .catch(() => {});
      }
      const peer = data.peer;
      const roomKey = data.roomKey;
      if (!peer || !roomKey) return;
      const room = rooms.get(roomKey);
      if (!room) return;
      room.delete(peer.id);
      broadcast(room, { type: "peer-left", id: peer.id });
      if (room.size === 0) rooms.delete(roomKey);
    },
  });
