import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
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
      className="relative scroll-mt-24 border-t border-white/5 py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.16),transparent_70%)] blur-3xl" />
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-violet-300">
            Simple pricing
          </span>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Start free. Upgrade once.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-zinc-400">
            No seats to count every month. No surprise renewals. One transparent
            one-time upgrade per organization.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-3xl gap-5 sm:grid-cols-2">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-7 ${
                  plan.featured
                    ? "border-violet-400/30 bg-gradient-to-b from-violet-500/[0.12] to-white/[0.02] shadow-2xl shadow-violet-500/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {plan.featured && (
                  <span className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{plan.desc}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-white">
                    {plan.price}
                  </span>
                  <span className="text-[13px] text-zinc-500">
                    {plan.cadence}
                  </span>
                </div>

                <Link
                  href={plan.href}
                  className={`group mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                    plan.featured
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2.2}
                  />
                </Link>

                <ul className="mt-7 space-y-3 border-t border-white/10 pt-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full ${
                          plan.featured
                            ? "bg-violet-500/20 text-violet-300"
                            : "bg-white/10 text-zinc-300"
                        }`}
                      >
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          className="size-3"
                          strokeWidth={2.5}
                        />
                      </span>
                      <span className="text-zinc-300">{f}</span>
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
