"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export function PaymentResultModal() {
  const searchParams = useSearchParams();
  const payment = searchParams.get("payment");

  if (payment !== "success" && payment !== "failed") return null;

  const isSuccess = payment === "success";

  return (
    <Dialog open={true}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${isSuccess ? "bg-green-500/15 text-green-600" : "bg-destructive/15 text-destructive"}`}
          >
            <HugeiconsIcon
              icon={isSuccess ? Tick02Icon : Cancel01Icon}
              strokeWidth={2}
              className="size-6"
            />
          </div>
          <DialogTitle className="text-center">
            {isSuccess ? "Payment successful" : "Payment failed"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSuccess
              ? "Your organization is now active. You can access the full dashboard and all features."
              : "Something went wrong. You can try again from the dashboard or contact support."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
