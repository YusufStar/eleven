import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    copy: "For a small team getting its first project off the ground.",
    features: ["2 seats", "1 project", "Tasks, chat & files", "Community support"],
    cta: "Start free",
    href: "/signup",
    inverted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per seat / month",
    copy: "For teams that plan in sprints and ship every week.",
    features: [
      "Unlimited seats & projects",
      "Sprints, milestones & time tracking",
      "AI reports & analytics",
      "Chat, meet & file storage",
    ],
    cta: "Start 14-day trial",
    href: "/signup",
    inverted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual billing",
    copy: "For organizations with their own rules about everything.",
    features: ["SSO & audit log", "Custom roles", "Priority support", "SLA"],
    cta: "Talk to us",
    href: "/signup",
    inverted: false,
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-b">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            04 — Pricing
          </p>
          <h2 className="mt-4 max-w-2xl font-serif text-4xl tracking-tight md:text-5xl">
            Pay for clarity, <em>not clutter.</em>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal
              key={plan.name}
              delay={i * 0.08}
              className={plan.inverted ? "bg-foreground" : "bg-background"}
            >
              <div
                className={`flex h-full flex-col p-8 md:p-10 ${
                  plan.inverted ? "text-background" : ""
                }`}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] opacity-60">
                  {plan.name}
                </p>
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-serif text-5xl tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs opacity-60">{plan.period}</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed opacity-70">
                  {plan.copy}
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-baseline gap-3">
                      <span aria-hidden className="opacity-40">
                        —
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-10 pt-2 md:mt-auto">
                  <Button
                    asChild
                    variant={plan.inverted ? "secondary" : "outline"}
                    className={`w-full rounded-full ${
                      plan.inverted
                        ? "bg-background text-foreground hover:bg-background/90"
                        : ""
                    }`}
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
