"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDetailContent } from "./project-detail-content";

function DetailSkeleton() {
  return (
    <div className="container mx-auto py-2 space-y-4">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProjectDetailContent />
    </Suspense>
  );
}
