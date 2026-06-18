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
    <footer className="relative border-t border-white/10 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                <ElevenLogo className="size-6 [&_path:first-child]:fill-white/0 [&_path:not(:first-child)]:fill-white" />
              </span>
              <span className="text-[17px] font-semibold tracking-tight text-white">
                Eleven
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              The CRM and project management workspace where your customers and
              your work finally live together.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-semibold text-zinc-300">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row">
          <p className="text-[13px] text-zinc-600">
            © {currentYear} Eleven. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-[13px] text-zinc-600">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
