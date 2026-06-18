import { HugeiconsIcon } from "@hugeicons/react";
import {
  SaleTag02Icon,
  UserGroupIcon,
  CheckmarkSquare02Icon,
  FolderLibraryIcon,
  AnalyticsUpIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { Reveal } from "./reveal";

export function LandingFeatures() {
  return (
    <section id="features" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-violet-300">
            Everything in one place
          </span>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            One workspace for the whole revenue motion
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-zinc-400">
            Stop stitching together a CRM, a project tool, and a dozen
            spreadsheets. Eleven keeps relationships and delivery in the same
            place.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Pipeline — large */}
          <Reveal className="md:col-span-4">
            <FeatureCard
              icon={SaleTag02Icon}
              title="Visual sales pipeline"
              desc="Drag deals across configurable stages, see weighted value per column, and never lose track of what's about to close."
              className="h-full"
            >
              <div className="mt-6 grid grid-cols-4 gap-2">
                {[
                  { n: "Lead", c: "from-sky-400/70 to-sky-500/70", h: "h-16" },
                  { n: "Qualified", c: "from-violet-400/70 to-violet-500/70", h: "h-24" },
                  { n: "Proposal", c: "from-amber-400/70 to-amber-500/70", h: "h-12" },
                  { n: "Won", c: "from-emerald-400/70 to-emerald-500/70", h: "h-20" },
                ].map((col) => (
                  <div key={col.n} className="flex flex-col justify-end gap-1.5">
                    <div
                      className={`rounded-lg bg-gradient-to-b ${col.c} ${col.h} opacity-90`}
                    />
                    <div className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-400">
                      {col.n}
                    </div>
                  </div>
                ))}
              </div>
            </FeatureCard>
          </Reveal>

          {/* Contacts */}
          <Reveal className="md:col-span-2" delay={0.05}>
            <FeatureCard
              icon={UserGroupIcon}
              title="360° contacts"
              desc="People and companies with every linked deal, task, and activity on one timeline."
              className="h-full"
            >
              <div className="mt-6 space-y-2">
                {["Sarah Kline", "Marcus Reed", "Lena Ortiz"].map((p, i) => (
                  <div
                    key={p}
                    className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2"
                  >
                    <span
                      className={`grid size-6 place-items-center rounded-full bg-gradient-to-br text-[9px] font-semibold text-white ${
                        ["from-indigo-400 to-violet-500", "from-sky-400 to-cyan-500", "from-fuchsia-400 to-pink-500"][i]
                      }`}
                    >
                      {p.split(" ").map((w) => w[0]).join("")}
                    </span>
                    <span className="text-[12px] text-zinc-300">{p}</span>
                  </div>
                ))}
              </div>
            </FeatureCard>
          </Reveal>

          {/* Tasks */}
          <Reveal className="md:col-span-2" delay={0.1}>
            <FeatureCard
              icon={CheckmarkSquare02Icon}
              title="Tasks that ship"
              desc="Status, priority, assignees, and attachments — tied to the deal or project they belong to."
            />
          </Reveal>

          {/* Projects */}
          <Reveal className="md:col-span-2" delay={0.15}>
            <FeatureCard
              icon={FolderLibraryIcon}
              title="Projects & files"
              desc="Spin up projects with members, files, and task lists so delivery lives next to the deal."
            />
          </Reveal>

          {/* Reports */}
          <Reveal className="md:col-span-2" delay={0.2}>
            <FeatureCard
              icon={AnalyticsUpIcon}
              title="Reports & insights"
              desc="Win/loss, pipeline health, and team metrics — answers without exporting to a spreadsheet."
            >
              <div className="mt-6 flex items-end gap-1.5">
                {[40, 65, 50, 80, 60, 95, 72].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-indigo-500/40 to-violet-400/80"
                    style={{ height: `${h}%`, minHeight: 8 }}
                  />
                ))}
              </div>
            </FeatureCard>
          </Reveal>
        </div>

        {/* team strip */}
        <Reveal delay={0.1}>
          <div className="mt-4 flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/[0.07] to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
                <HugeiconsIcon icon={UserMultiple02Icon} className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Built for teams, billed once
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Organizations, roles, and invitations — unlock full access for
                  the whole team with a single one-time upgrade.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  children,
  className = "",
}: {
  icon: typeof SaleTag02Icon;
  title: string;
  desc: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 ${className}`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-violet-500/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
      <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] text-violet-300">
        <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.9} />
      </span>
      <h3 className="mt-4 text-[17px] font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{desc}</p>
      {children}
    </div>
  );
}
