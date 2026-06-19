"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  PlayCircleIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardPreview } from "./dashboard-preview";

const ease = [0.16, 1, 0.3, 1] as const;

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28">
      {/* background fx */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-radial-faded opacity-50" />
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute left-[15%] top-[20%] h-[320px] w-[320px] rounded-full bg-chart-2/15 blur-3xl" />
        <div className="absolute right-[12%] top-[8%] h-[360px] w-[360px] rounded-full bg-chart-5/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <Link href="#features" className="group inline-flex">
            <Badge
              variant="outline"
              className="gap-2 rounded-full bg-card/50 py-1.5 pl-1.5 pr-3.5 text-[13px] font-normal text-muted-foreground backdrop-blur transition-colors group-hover:border-ring"
            >
              <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                New
              </span>
              CRM + projects, finally in one place
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </Badge>
          </Link>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.08 }}
          className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl"
        >
          Where your customers and
          <br className="hidden sm:block" />{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            your work finally meet
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.16 }}
          className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
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
          <Button asChild size="lg" className="group w-full sm:w-auto">
            <Link href="/signup">
              Start for free
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.2}
              />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="#workflow">
              <HugeiconsIcon icon={PlayCircleIcon} className="size-4" />
              See how it works
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease, delay: 0.36 }}
          className="mt-7 flex flex-col items-center justify-center gap-3 text-[13px] text-muted-foreground sm:flex-row sm:gap-5"
        >
          <span className="flex items-center gap-1.5">
            <span className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <HugeiconsIcon
                  key={i}
                  icon={StarIcon}
                  className="size-3.5 fill-amber-400 text-amber-400"
                />
              ))}
            </span>
            Loved by fast-moving teams
          </span>
          <span className="hidden h-3 w-px bg-border sm:block" />
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
        <div className="absolute inset-x-10 -top-6 -bottom-10 -z-10 rounded-[2rem] bg-primary/15 blur-2xl" />
        <DashboardPreview />
        <div className="pointer-events-none absolute inset-x-0 -bottom-2 h-32 bg-gradient-to-t from-background to-transparent" />
      </motion.div>
    </section>
  );
}
