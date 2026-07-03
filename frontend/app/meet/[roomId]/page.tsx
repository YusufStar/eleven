"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { MeetingRoom } from "@/components/meet/meeting-room";

function MeetingRoomContent() {
  const params = useParams<{ roomId: string }>();
  const roomId = decodeURIComponent(params.roomId ?? "");
  return <MeetingRoom roomId={roomId} />;
}

export default function MeetingRoomPage() {
  return (
    <Suspense fallback={null}>
      <MeetingRoomContent />
    </Suspense>
  );
}
