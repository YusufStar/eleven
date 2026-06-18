"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Menu01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import ElevenLogo from "@/components/logo";

const links = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4">
      <div
        className={`flex w-full max-w-6xl items-center justify-between rounded-2xl border px-3 py-2.5 transition-all duration-300 sm:px-4 ${
          scrolled
            ? "border-white/10 bg-zinc-950/70 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-violet-500/20">
            <ElevenLogo className="size-6 [&_path:first-child]:fill-white/0 [&_path:not(:first-child)]:fill-white" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-white">
            Eleven
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm transition-all hover:bg-zinc-200"
          >
            Get started
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.2}
            />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid size-9 place-items-center rounded-lg text-zinc-300 transition-colors hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Toggle menu"
        >
          <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} className="size-5" />
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-4 top-[72px] rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl md:hidden">
          <nav className="flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-white px-3 py-2.5 text-center text-sm font-semibold text-zinc-950"
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
