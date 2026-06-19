import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  SaleTag02Icon,
  FolderLibraryIcon,
  CheckmarkSquare02Icon,
  Calendar03Icon,
  AnalyticsUpIcon,
  Search01Icon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";

const navItems = [
  { icon: DashboardSquare01Icon, label: "Overview", active: true },
  { icon: UserGroupIcon, label: "Contacts" },
  { icon: SaleTag02Icon, label: "Pipeline" },
  { icon: FolderLibraryIcon, label: "Projects" },
  { icon: CheckmarkSquare02Icon, label: "Tasks" },
  { icon: Calendar03Icon, label: "Activities" },
  { icon: AnalyticsUpIcon, label: "Reports" },
];

const stats = [
  { label: "Open deals", value: "$284k", trend: "+12.4%", up: true },
  { label: "Win rate", value: "68%", trend: "+4.1%", up: true },
  { label: "Active tasks", value: "47", trend: "−6", up: false },
];

const columns = [
  {
    name: "Lead",
    tint: "bg-chart-3",
    deals: [
      { co: "Northwind", val: "$12.5k", who: "AM" },
      { co: "Acme Corp", val: "$8.2k", who: "JD" },
    ],
  },
  {
    name: "Qualified",
    tint: "bg-chart-1",
    deals: [
      { co: "Globex", val: "$34k", who: "SK" },
      { co: "Initech", val: "$19.8k", who: "RL" },
    ],
  },
  {
    name: "Proposal",
    tint: "bg-chart-4",
    deals: [{ co: "Umbrella", val: "$56k", who: "TM" }],
  },
  {
    name: "Won",
    tint: "bg-chart-5",
    deals: [{ co: "Soylent", val: "$72k", who: "EV" }],
  },
];

/**
 * Static, pixel-built mockup of the Eleven dashboard (pipeline board + stats).
 * No screenshots — everything is CSS so it stays crisp at any resolution and
 * follows the active theme through shadcn tokens.
 */
export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-destructive/70" />
          <span className="size-3 rounded-full bg-amber-400/80" />
          <span className="size-3 rounded-full bg-emerald-400/80" />
        </div>
        <div className="mx-auto flex w-full max-w-xs items-center gap-2 rounded-md border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
          <HugeiconsIcon icon={Search01Icon} className="size-3.5" />
          app.eleven.so/dashboard
        </div>
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside className="hidden w-44 shrink-0 flex-col gap-0.5 border-r bg-muted/30 p-3 sm:flex">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium ${
                item.active
                  ? "bg-primary/10 text-foreground ring-1 ring-inset ring-border"
                  : "text-muted-foreground"
              }`}
            >
              <HugeiconsIcon icon={item.icon} className="size-4" strokeWidth={1.8} />
              {item.label}
            </div>
          ))}
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">Pipeline</p>
              <h3 className="text-[15px] font-semibold text-foreground">
                Sales overview
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg border bg-muted/40 text-muted-foreground">
                <HugeiconsIcon icon={Notification03Icon} className="size-4" />
              </span>
              <span className="size-7 rounded-full bg-primary" />
            </div>
          </div>

          {/* stats */}
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border bg-muted/30 p-3">
                <p className="truncate text-[10.5px] text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground sm:text-lg">
                  {s.value}
                </p>
                <p
                  className={`mt-0.5 text-[10.5px] font-medium ${
                    s.up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                  }`}
                >
                  {s.trend}
                </p>
              </div>
            ))}
          </div>

          {/* board */}
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {columns.map((col) => (
              <div key={col.name} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${col.tint}`} />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {col.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {col.deals.length}
                  </span>
                </div>
                {col.deals.map((d) => (
                  <div
                    key={d.co}
                    className="rounded-lg border bg-muted/40 p-2.5 transition-colors hover:border-ring"
                  >
                    <p className="text-[12px] font-medium text-foreground">
                      {d.co}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-foreground">
                        {d.val}
                      </span>
                      <span className="grid size-5 place-items-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground">
                        {d.who}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-dashed py-1.5 text-center text-[10px] text-muted-foreground">
                  + Add
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
