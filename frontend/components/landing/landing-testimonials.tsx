import { Reveal } from "./reveal";

const aside = [
  {
    quote:
      "We replaced three tools the first week. Nobody asked for any of them back.",
    name: "Mara Lindqvist",
    role: "COO, Northwind",
  },
  {
    quote:
      "The AI reports catch blockers before standup does. Our velocity stopped being a guess.",
    name: "Deniz Aksoy",
    role: "Eng Lead, Kairos Labs",
  },
];

export function LandingTestimonials() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            03 — Proof
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <figure className="mt-10 max-w-3xl">
            <blockquote className="font-serif text-3xl leading-snug tracking-tight md:text-4xl">
              &ldquo;Eleven is the first tool that made our work look the way it
              feels when everything is <em>under control.</em>&rdquo;
            </blockquote>
            <figcaption className="mt-6 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Jonas Reber</span>
              {" — "}Founder, Atelier Mono
            </figcaption>
          </figure>
        </Reveal>

        <div className="mt-14 grid gap-px border bg-border sm:grid-cols-2">
          {aside.map((t, i) => (
            <Reveal key={t.name} delay={0.1 + i * 0.08} className="bg-background">
              <figure className="h-full p-8">
                <blockquote className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground"> — {t.role}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
