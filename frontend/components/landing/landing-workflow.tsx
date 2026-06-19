import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserAdd01Icon,
  WorkflowSquare03Icon,
  RocketIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "./reveal";

const steps = [
  {
    icon: UserAdd01Icon,
    step: "01",
    title: "Bring your people in",
    desc: "Import contacts and companies, invite your team, and set up your pipeline stages in minutes.",
  },
  {
    icon: WorkflowSquare03Icon,
    step: "02",
    title: "Run deals & projects together",
    desc: "Move deals through stages while projects, tasks, and files stay linked to the right account.",
  },
  {
    icon: RocketIcon,
    step: "03",
    title: "See what's working",
    desc: "Reports surface win rates and pipeline health so the whole team knows where to focus next.",
  },
];

export function LandingWorkflow() {
  return (
    <section
      id="workflow"
      className="relative scroll-mt-24 border-t py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="rounded-full text-primary">
            How it works
          </Badge>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            From first contact to closed-won
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            Three steps to a single source of truth for your customers and your
            work.
          </p>
        </Reveal>

        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          {/* connecting line */}
          <div className="pointer-events-none absolute inset-x-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />

          {steps.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.08} className="relative">
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <span className="relative grid size-14 place-items-center overflow-hidden rounded-2xl border bg-card shadow-lg">
                  <span className="absolute inset-0 bg-primary/10" />
                  <HugeiconsIcon
                    icon={s.icon}
                    className="relative size-6 text-primary"
                    strokeWidth={1.8}
                  />
                </span>
                <span className="mt-5 text-xs font-semibold tracking-widest text-primary/80">
                  {s.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
