import Link from "next/link";
import ElevenLogo from "@/components/logo";

const currentYear = new Date().getFullYear();

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Workflow", href: "#workflow" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Contacts", href: "/signup" },
      { label: "Pipeline", href: "/signup" },
      { label: "Projects", href: "/signup" },
      { label: "Reports", href: "/signup" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Get started", href: "/signup" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t bg-card">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <ElevenLogo className="size-9" />
              <span className="text-[17px] font-semibold tracking-tight text-foreground">
                Eleven
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The CRM and project management workspace where your customers and
              your work finally live together.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-semibold text-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
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
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-7 sm:flex-row">
          <p className="text-[13px] text-muted-foreground">
            © {currentYear} Eleven. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
