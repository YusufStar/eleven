import { HugeiconsIcon } from "@hugeicons/react";
import { QuoteDownIcon } from "@hugeicons/core-free-icons";
import { Reveal } from "./reveal";

const testimonials = [
  {
    quote:
      "We finally killed the spreadsheet-and-Slack-thread chaos. Deals, projects, and tasks live in one place and nothing slips anymore.",
    name: "Sarah Kline",
    role: "Head of Sales, Northwind",
    initials: "SK",
    tint: "from-indigo-400 to-violet-500",
  },
  {
    quote:
      "The pipeline board is fast and the contact timeline means every rep walks into a call already knowing the full story.",
    name: "Marcus Reed",
    role: "Founder, Globex",
    initials: "MR",
    tint: "from-sky-400 to-cyan-500",
  },
  {
    quote:
      "Pay once, use forever was an easy call. Onboarding the team took an afternoon and reports paid for themselves in a week.",
    name: "Lena Ortiz",
    role: "COO, Initech",
    initials: "LO",
    tint: "from-fuchsia-400 to-pink-500",
  },
];

export function LandingTestimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-violet-300">
            Loved by teams
          </span>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Teams run their whole motion on Eleven
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <HugeiconsIcon
                  icon={QuoteDownIcon}
                  className="size-7 text-violet-400/50"
                />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-zinc-200">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <span
                    className={`grid size-10 place-items-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${t.tint}`}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-[12.5px] text-zinc-500">{t.role}</p>
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
