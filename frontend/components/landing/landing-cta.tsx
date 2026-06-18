import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Reveal } from "./reveal";

export function LandingCta() {
  return (
    <section className="relative px-6 py-12 sm:py-20">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-violet-600/20 to-fuchsia-600/20 px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-grid mask-radial-faded opacity-30" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.4),transparent_70%)] blur-3xl" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Bring your CRM and projects together
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-base text-zinc-300">
              Set up your workspace in minutes. Start free, invite your team, and
              upgrade once when you're ready.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-black/20 transition-all hover:bg-zinc-200 sm:w-auto"
              >
                Get started for free
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2.2}
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
