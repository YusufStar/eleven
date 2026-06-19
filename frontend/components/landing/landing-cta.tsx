import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function LandingCta() {
  return (
    <section className="relative px-6 py-12 sm:py-20">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/20 via-primary/10 to-card px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-grid mask-radial-faded opacity-30" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Bring your CRM and projects together
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-base text-muted-foreground">
              Set up your workspace in minutes. Start free, invite your team, and
              upgrade once when you're ready.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="group w-full sm:w-auto">
                <Link href="/signup">
                  Get started for free
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2.2}
                  />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
