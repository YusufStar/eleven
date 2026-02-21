import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Home02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-muted">
        <HugeiconsIcon icon={Cancel01Icon} className="size-10 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground text-sm">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link href="/dashboard">
          <HugeiconsIcon icon={Home02Icon} className="size-4" strokeWidth={2} />
          Back to dashboard
        </Link>
      </Button>
    </div>
  );
}
