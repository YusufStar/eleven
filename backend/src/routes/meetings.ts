import { Elysia } from "elysia";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { notify, notifyOrganization } from "../lib/notify";

const s3 =
  process.env.R2_ENDPOINT && process.env.AWS_ACCESS_KEY_ID
    ? new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      })
    : null;
const R2_BUCKET = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL ?? "";

const MAX_RECORDING_BYTES = 1000 * 1024 * 1024; // 1000 MB
const RECORDING_TYPES = ["video/webm", "video/mp4"];

type MeetingAccess = {
  id: string;
  organizationId: string;
  isPublic: boolean;
  createdById: string;
  participants: { memberId: string }[];
};

function canAccessMeeting(meeting: MeetingAccess, organizationId: string, memberId: string) {
  return (
    meeting.organizationId === organizationId &&
    (meeting.isPublic ||
      meeting.createdById === memberId ||
      meeting.participants.some((p) => p.memberId === memberId))
  );
}

const CODE_LETTERS = "abcdefghijkmnpqrstuvwxyz";
function chunk(len: number) {
  return Array.from({ length: len }, () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]).join("");
}
async function newUniqueCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = `${chunk(3)}-${chunk(4)}-${chunk(3)}`;
    const exists = await prisma.meeting.findUnique({ where: { code } });
    if (!exists) return code;
  }
  return `${chunk(3)}-${chunk(4)}-${Date.now().toString(36)}`;
}

const participantInclude = {
  participants: {
    include: {
      member: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  },
  createdBy: { include: { user: { select: { id: true, name: true, image: true } } } },
} as const;

export const meetingsRoutes = new Elysia({ prefix: "/meetings" })
  .use(authPlugin)
  .post(
    "/",
    async ({ activeOrganizationId, activeMember, body, set }) => {
      const b = body as {
        title?: string;
        startsAt?: string | null;
        isPublic?: boolean;
        participantMemberIds?: string[];
      };
      const title = typeof b.title === "string" && b.title.trim() ? b.title.trim().slice(0, 200) : "Instant meeting";
      const startsAt = b.startsAt ? new Date(b.startsAt) : new Date();
      if (Number.isNaN(startsAt.getTime())) {
        set.status = 400;
        return { message: "Invalid start time" };
      }
      const isPublic = b.isPublic === true;
      const requestedIds = Array.isArray(b.participantMemberIds)
        ? b.participantMemberIds.filter((id): id is string => typeof id === "string")
        : [];

      // participants must belong to this organization
      const validMembers = requestedIds.length
        ? await prisma.member.findMany({
            where: { id: { in: requestedIds }, organizationId: activeOrganizationId! },
            select: { id: true },
          })
        : [];
      const participantIds = [...new Set([...validMembers.map((m) => m.id), activeMember!.id])];

      if (!isPublic && participantIds.length === 1 && requestedIds.length > 0) {
        set.status = 400;
        return { message: "No valid participants selected" };
      }

      const meeting = await prisma.meeting.create({
        data: {
          organizationId: activeOrganizationId!,
          code: await newUniqueCode(),
          title,
          startsAt,
          isPublic,
          createdById: activeMember!.id,
          participants: isPublic
            ? undefined
            : { create: participantIds.map((memberId) => ({ memberId })) },
        },
        include: participantInclude,
      });

      const when = startsAt.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const notification = {
        prisma,
        organizationId: activeOrganizationId!,
        actorId: activeMember!.id,
        type: "MEETING_INVITED" as const,
        title: "Meeting invitation",
        body: `${title} — ${when}`,
        link: `/meet/${meeting.code}`,
      };
      if (isPublic) {
        await notifyOrganization(notification);
      } else {
        await notify({ ...notification, recipientIds: participantIds });
      }
      return meeting;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/upcoming",
    async ({ activeOrganizationId, activeMember, query }) => {
      const limit = Math.min(50, Math.max(1, Number(query?.limit) || 10));
      // meetings from the last hour onwards that I can join
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const data = await prisma.meeting.findMany({
        where: {
          organizationId: activeOrganizationId!,
          startsAt: { gte: since },
          OR: [
            { isPublic: true },
            { createdById: activeMember!.id },
            { participants: { some: { memberId: activeMember!.id } } },
          ],
        },
        include: participantInclude,
        orderBy: { startsAt: "asc" },
        take: limit,
      });
      return { data };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/range",
    async ({ activeOrganizationId, activeMember, query, set }) => {
      const from = query?.from ? new Date(String(query.from)) : null;
      const to = query?.to ? new Date(String(query.to)) : null;
      if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        set.status = 400;
        return { message: "from and to are required ISO dates" };
      }
      const data = await prisma.meeting.findMany({
        where: {
          organizationId: activeOrganizationId!,
          startsAt: { gte: from, lte: to },
          OR: [
            { isPublic: true },
            { createdById: activeMember!.id },
            { participants: { some: { memberId: activeMember!.id } } },
          ],
        },
        include: participantInclude,
        orderBy: { startsAt: "asc" },
        take: 200,
      });
      return { data };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/by-code/:code",
    async ({ activeOrganizationId, activeMember, params, set }) => {
      const meeting = await prisma.meeting.findUnique({
        where: { code: params.code },
        include: participantInclude,
      });
      if (!meeting || meeting.organizationId !== activeOrganizationId) {
        set.status = 404;
        return { message: "Meeting not found" };
      }
      const allowed =
        meeting.isPublic ||
        meeting.createdById === activeMember!.id ||
        meeting.participants.some((p) => p.memberId === activeMember!.id);
      if (!allowed) {
        set.status = 403;
        return { message: "You are not invited to this meeting" };
      }
      return meeting;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/history",
    async ({ activeOrganizationId, activeMember, query }) => {
      const limit = Math.min(50, Math.max(1, Number(query?.limit) || 20));
      const data = await prisma.meeting.findMany({
        where: {
          organizationId: activeOrganizationId!,
          startsAt: { lte: new Date() },
          OR: [
            { isPublic: true },
            { createdById: activeMember!.id },
            { participants: { some: { memberId: activeMember!.id } } },
          ],
        },
        include: {
          ...participantInclude,
          attendance: {
            include: { member: { include: { user: { select: { id: true, name: true, image: true } } } } },
            orderBy: { joinedAt: "asc" },
          },
          recordings: {
            include: { createdBy: { include: { user: { select: { name: true } } } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { startsAt: "desc" },
        take: limit,
      });
      return { data };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/:code/recordings",
    async ({ params, request, activeOrganizationId, activeMember, set }) => {
      const meeting = await prisma.meeting.findUnique({
        where: { code: params.code },
        select: {
          id: true,
          organizationId: true,
          isPublic: true,
          createdById: true,
          participants: { select: { memberId: true } },
        },
      });
      if (!meeting || !canAccessMeeting(meeting, activeOrganizationId!, activeMember!.id)) {
        set.status = 404;
        return { message: "Meeting not found" };
      }
      const formData = await request.formData().catch(() => null);
      const file = formData?.get("file");
      const durationSec = Number(formData?.get("durationSec")) || null;
      if (!file || typeof file === "string") {
        set.status = 400;
        return { message: "No recording uploaded" };
      }
      if (file.size === 0 || file.size > MAX_RECORDING_BYTES) {
        set.status = 400;
        return { message: "Recording must be between 1 byte and 500 MB" };
      }
      const baseType = (file.type || "").split(";")[0];
      if (!RECORDING_TYPES.includes(baseType)) {
        set.status = 400;
        return { message: "Only webm/mp4 recordings are accepted" };
      }
      if (!s3 || !R2_BUCKET) {
        set.status = 503;
        return { message: "Storage is not configured" };
      }
      const ext = baseType === "video/mp4" ? "mp4" : "webm";
      const key = `meet-recordings/${meeting.id}/${Date.now()}.${ext}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: new Uint8Array(await file.arrayBuffer()),
          ContentType: baseType,
        })
      );
      const url = R2_PUBLIC_BASE_URL ? `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}` : key;
      const recording = await prisma.meetingRecording.create({
        data: {
          meetingId: meeting.id,
          url,
          sizeBytes: file.size,
          durationSec,
          createdById: activeMember!.id,
        },
      });
      return recording;
    },
    { requireAuth: true, requireActiveOrg: true }
  );
