import type { ReactNode } from "react";
import { LandingNav, LandingFooter } from "@/components/landing";

/** Shared chrome for /privacy and /terms — landing nav + footer around prose. */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh overflow-x-clip bg-background text-foreground antialiased">
      <LandingNav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-36 md:pt-44">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Legal</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-foreground [&_a]:text-foreground [&_a]:underline">
          {children}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
