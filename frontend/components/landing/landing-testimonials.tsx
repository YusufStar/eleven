import { HugeiconsIcon } from "@hugeicons/react";
import { QuoteDownIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "./reveal";

const testimonials = [
  {
    quote:
      "We finally killed the spreadsheet-and-Slack-thread chaos. Deals, projects, and tasks live in one place and nothing slips anymore.",
    name: "Sarah Kline",
    role: "Head of Sales, Northwind",
    initials: "SK",
    tint: "bg-chart-1",
  },
  {
    quote:
      "The pipeline board is fast and the contact timeline means every rep walks into a call already knowing the full story.",
    name: "Marcus Reed",
    role: "Founder, Globex",
    initials: "MR",
    tint: "bg-chart-2",
  },
  {
    quote:
      "Pay once, use forever was an easy call. Onboarding the team took an afternoon and reports paid for themselves in a week.",
    name: "Lena Ortiz",
    role: "COO, Initech",
    initials: "LO",
    tint: "bg-chart-5",
  },
];

export function LandingTestimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="rounded-full text-primary">
            Loved by teams
          </Badge>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Teams run their whole motion on Eleven
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border bg-card p-6">
                <HugeiconsIcon
                  icon={QuoteDownIcon}
                  className="size-7 text-primary/50"
                />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground/90">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t pt-5">
                  <span
                    className={`grid size-10 place-items-center rounded-full text-xs font-semibold text-primary-foreground ${t.tint}`}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-[12.5px] text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
