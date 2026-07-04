import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { DashboardPreview } from "./dashboard-preview";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b">
      {/* signature: the brand numeral, hairline-outlined and cropped */}
      <span
        aria-hidden
        className="text-outline pointer-events-none absolute -right-6 top-20 hidden select-none font-serif text-[22rem] leading-none md:block lg:text-[30rem]"
      >
        11
      </span>

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-36 md:pb-28 md:pt-44">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            Nº 11 — the work platform for software teams
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Work, in its <em>purest</em> form.
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Tasks, sprints, projects, chat, files, and AI reports in one fast
            workspace — Slack, Jira, Linear, and Notion, without the tab sprawl.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/signup">Start free</Link>
            </Button>
            <Link
              href="#capabilities"
              className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              See what&apos;s inside
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.32} y={40} className="relative mt-16 md:mt-24">
          <div className="mask-fade-b">
            <DashboardPreview />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
