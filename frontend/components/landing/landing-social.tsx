import { Reveal } from "./reveal";

const logos = [
  "Northwind",
  "Globex",
  "Initech",
  "Umbrella",
  "Soylent",
  "Acme",
  "Hooli",
  "Stark",
];

const stats = [
  { value: "12k+", label: "Deals tracked" },
  { value: "98%", label: "Less tool switching" },
  { value: "3.4×", label: "Faster follow-ups" },
  { value: "120+", label: "Teams onboarded" },
];

export function LandingSocial() {
  return (
    <section className="relative border-y py-14">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-center text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
            Trusted by teams that move fast
          </p>
        </Reveal>

        {/* marquee */}
        <div className="relative mt-8 overflow-hidden mask-fade-x">
          <div className="flex w-max animate-marquee items-center gap-14 pr-14">
            {[...logos, ...logos].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="text-xl font-semibold tracking-tight text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* stats */}
        <Reveal delay={0.1}>
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card p-6 text-center">
                <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
