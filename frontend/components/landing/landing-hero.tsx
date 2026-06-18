"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  PlayCircleIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { DashboardPreview } from "./dashboard-preview";

const ease = [0.16, 1, 0.3, 1] as const;

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28">
      {/* background fx */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-radial-faded opacity-50" />
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.35),transparent_65%)] blur-3xl" />
        <div className="absolute left-[15%] top-[20%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18),transparent_70%)] blur-3xl" />
        <div className="absolute right-[12%] top-[8%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(217,70,239,0.16),transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <Link
            href="#features"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3.5 text-[13px] text-zinc-300 backdrop-blur transition-colors hover:border-white/20"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              New
            </span>
            CRM + projects, finally in one place
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-3.5 text-zinc-500 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.08 }}
          className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl"
        >
          Where your customers and
          <br className="hidden sm:block" />{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
            your work finally meet
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.16 }}
          className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400"
        >
          Eleven brings contacts, deals, pipelines, projects, and tasks into a
          single fast workspace — so your team stops switching tools and starts
          closing.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.24 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/signup"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-black/20 transition-all hover:bg-zinc-200 sm:w-auto"
          >
            Start for free
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.2}
            />
          </Link>
          <Link
            href="#workflow"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 sm:w-auto"
          >
            <HugeiconsIcon icon={PlayCircleIcon} className="size-4" />
            See how it works
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease, delay: 0.36 }}
          className="mt-7 flex flex-col items-center justify-center gap-3 text-[13px] text-zinc-500 sm:flex-row sm:gap-5"
        >
          <span className="flex items-center gap-1.5">
            <span className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <HugeiconsIcon
                  key={i}
                  icon={StarIcon}
                  className="size-3.5 fill-amber-300 text-amber-300"
                />
              ))}
            </span>
            Loved by fast-moving teams
          </span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span>No credit card required</span>
        </motion.div>
      </div>

      {/* product preview */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease, delay: 0.3 }}
        className="relative mx-auto mt-16 max-w-5xl px-6"
      >
        <div className="absolute inset-x-10 -top-6 -bottom-10 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.25),transparent_70%)] blur-2xl" />
        <DashboardPreview />
        <div className="pointer-events-none absolute inset-x-0 -bottom-2 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
      </motion.div>
    </section>
  );
}
