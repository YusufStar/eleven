import { Reveal } from "./reveal";

const steps = [
  {
    index: "01",
    title: "Plan",
    copy: "Break work into tasks and sprints. Estimates, priorities, and dependencies keep the plan honest, not aspirational.",
  },
  {
    index: "02",
    title: "Build",
    copy: "Move tasks across the board, talk it through in chat, and share files inline. The whole team stays on the same page.",
  },
  {
    index: "03",
    title: "Ship",
    copy: "Burndown, velocity, and AI reports keep the score — so you know what shipped, what's blocked, and what's at risk.",
  },
];

export function LandingWorkflow() {
  return (
    <section id="method" className="scroll-mt-16 border-b">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            02 — Method
          </p>
          <h2 className="mt-4 max-w-2xl font-serif text-4xl tracking-tight md:text-5xl">
            Backlog to <em>shipped.</em>
          </h2>
        </Reveal>

        <div className="mt-14">
          {steps.map((step, i) => (
            <Reveal key={step.index} delay={i * 0.08}>
              <div className="grid gap-4 border-t py-10 last:border-b md:grid-cols-[8rem_16rem_1fr] md:gap-8">
                <span className="font-serif text-5xl text-muted-foreground/40 md:text-6xl">
                  {step.index}
                </span>
                <h3 className="text-xl font-medium tracking-tight md:pt-3">
                  {step.title}
                </h3>
                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:pt-4">
                  {step.copy}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
