import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    desc: "Everything a small team needs to get organized.",
    cta: "Start for free",
    href: "/signup",
    featured: false,
    features: [
      "Create an organization",
      "Add team members",
      "Contacts, deals & pipelines",
      "Projects, tasks & files",
      "No credit card required",
    ],
  },
  {
    name: "Professional",
    price: "$1,000",
    cadence: "one-time, per org",
    desc: "Unlock full access for the whole team — pay once, use forever.",
    cta: "Upgrade your org",
    href: "/signup",
    featured: true,
    features: [
      "Everything in Free",
      "Unlimited members & seats",
      "Advanced reports & analytics",
      "Win/loss & pipeline insights",
      "Integrations & priority support",
      "Lifetime access — no subscription",
    ],
  },
];

export function LandingPricing() {
  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 border-t py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="rounded-full text-primary">
            Simple pricing
          </Badge>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Start free. Upgrade once.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            No seats to count every month. No surprise renewals. One transparent
            one-time upgrade per organization.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-3xl gap-5 sm:grid-cols-2">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-7",
                  plan.featured
                    ? "border-primary/40 bg-gradient-to-b from-primary/[0.12] to-card shadow-2xl"
                    : "bg-card"
                )}
              >
                {plan.featured && (
                  <Badge className="absolute right-6 top-6 rounded-full">
                    Most popular
                  </Badge>
                )}
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {plan.cadence}
                  </span>
                </div>

                <Button
                  asChild
                  variant={plan.featured ? "default" : "outline"}
                  className="group mt-6"
                >
                  <Link href={plan.href}>
                    {plan.cta}
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2.2}
                    />
                  </Link>
                </Button>

                <ul className="mt-7 space-y-3 border-t pt-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={cn(
                          "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full",
                          plan.featured
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          className="size-3"
                          strokeWidth={2.5}
                        />
                      </span>
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
