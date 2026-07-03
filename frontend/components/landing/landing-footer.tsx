import Link from "next/link";
import ElevenLogo from "@/components/logo";

const groups = [
  {
    title: "Product",
    links: [
      { label: "Capabilities", href: "#capabilities" },
      { label: "Method", href: "#method" },
      { label: "Pricing", href: "#pricing" },
      { label: "Questions", href: "#questions" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Start free", href: "/signup" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-16 md:pt-20">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <ElevenLogo className="size-7" />
              <span className="text-[15px] font-medium tracking-tight">Eleven</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The monochrome workspace for teams that close deals and ship
              projects.
            </p>
          </div>

          <div className="flex gap-16 md:gap-24">
            {groups.map((g) => (
              <nav key={g.title} aria-label={g.title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  {g.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 flex items-center justify-between border-t pt-6 text-xs text-muted-foreground">
          <p>© Eleven. All rights reserved.</p>
          <p className="font-mono uppercase tracking-[0.3em]">Nº 11</p>
        </div>
      </div>

      {/* signature echo: cropped hairline wordmark closing the page */}
      <div
        aria-hidden
        className="mask-fade-b pointer-events-none select-none overflow-hidden"
      >
        <p className="text-outline -mb-[0.32em] text-center font-serif text-[22vw] leading-none">
          ELEVEN
        </p>
      </div>
    </footer>
  );
}
