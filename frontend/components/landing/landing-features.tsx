import { HugeiconsIcon } from "@hugeicons/react";
import {
  SaleTag02Icon,
  UserGroupIcon,
  CheckmarkSquare02Icon,
  FolderLibraryIcon,
  AnalyticsUpIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "./reveal";

export function LandingFeatures() {
  return (
    <section id="features" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="rounded-full text-primary">
            Everything in one place
          </Badge>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            One workspace for the whole revenue motion
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
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
                  { n: "Lead", c: "bg-chart-3", h: "h-16" },
                  { n: "Qualified", c: "bg-chart-1", h: "h-24" },
                  { n: "Proposal", c: "bg-chart-4", h: "h-12" },
                  { n: "Won", c: "bg-chart-5", h: "h-20" },
                ].map((col) => (
                  <div key={col.n} className="flex flex-col justify-end gap-1.5">
                    <div className={`rounded-lg ${col.c} ${col.h} opacity-90`} />
                    <div className="rounded-md border bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
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
                    className="flex items-center gap-2.5 rounded-lg border bg-muted/40 px-2.5 py-2"
                  >
                    <span
                      className={`grid size-6 place-items-center rounded-full text-[9px] font-semibold text-primary-foreground ${
                        ["bg-chart-1", "bg-chart-2", "bg-chart-5"][i]
                      }`}
                    >
                      {p.split(" ").map((w) => w[0]).join("")}
                    </span>
                    <span className="text-[12px] text-muted-foreground">{p}</span>
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
                    className="flex-1 rounded-t bg-primary/70"
                    style={{ height: `${h}%`, minHeight: 8 }}
                  />
                ))}
              </div>
            </FeatureCard>
          </Reveal>
        </div>

        {/* team strip */}
        <Reveal delay={0.1}>
          <div className="mt-4 flex flex-col items-start gap-4 rounded-2xl border bg-gradient-to-r from-primary/[0.07] to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border bg-muted/40 text-primary">
                <HugeiconsIcon icon={UserMultiple02Icon} className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Built for teams, billed once
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
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
      className={`group relative overflow-hidden rounded-2xl border bg-card p-6 transition-colors hover:border-ring ${className}`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
      <span className="grid size-10 place-items-center rounded-xl border bg-muted/50 text-primary">
        <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.9} />
      </span>
      <h3 className="mt-4 text-[17px] font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      {children}
    </div>
  );
}
