"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import ElevenLogo from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Capabilities", href: "#capabilities" },
  { label: "Method", href: "#method" },
  { label: "Pricing", href: "#pricing" },
  { label: "Questions", href: "#questions" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <ElevenLogo className="size-7" />
          <span className="text-[15px] font-medium tracking-tight">Eleven</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-5">
            <Link href="/signup">Start free</Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} className="size-5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-background px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Main">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="flex-1 rounded-full">
              <Link href="/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </Button>
            <Button asChild size="sm" className="flex-1 rounded-full">
              <Link href="/signup" onClick={() => setOpen(false)}>
                Start free
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
