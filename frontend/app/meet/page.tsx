import { Suspense } from "react";
import { MeetHome } from "@/components/meet/meet-home";

export default function MeetPage() {
  return (
    <Suspense fallback={null}>
      <MeetHome />
    </Suspense>
  );
}
