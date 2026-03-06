"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { DealDetailContent } from "./deal-detail-content";

function DetailSkeleton() {
  return (
    <div className="container mx-auto py-2 space-y-4">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function DealDetailWithId({ dealId }: { dealId: string }) {
  return <DealDetailContent dealId={dealId} />;
}

export function DealDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : null;

  useEffect(() => {
    if (!id) router.replace("/dashboard/deals");
  }, [id, router]);

  if (!id) return <DetailSkeleton />;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DealDetailWithId dealId={id} />
    </Suspense>
  );
}
