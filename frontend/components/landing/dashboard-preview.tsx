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
    tint: "from-sky-400/80 to-sky-500/80",
    deals: [
      { co: "Northwind", val: "$12.5k", who: "AM" },
      { co: "Acme Corp", val: "$8.2k", who: "JD" },
    ],
  },
  {
    name: "Qualified",
    tint: "from-violet-400/80 to-violet-500/80",
    deals: [
      { co: "Globex", val: "$34k", who: "SK" },
      { co: "Initech", val: "$19.8k", who: "RL" },
    ],
  },
  {
    name: "Proposal",
    tint: "from-amber-400/80 to-amber-500/80",
    deals: [{ co: "Umbrella", val: "$56k", who: "TM" }],
  },
  {
    name: "Won",
    tint: "from-emerald-400/80 to-emerald-500/80",
    deals: [{ co: "Soylent", val: "$72k", who: "EV" }],
  },
];

/**
 * Static, pixel-built mockup of the Eleven dashboard (pipeline board + stats).
 * No screenshots — everything is CSS so it stays crisp at any resolution and
 * inherits the page's dark glass aesthetic.
 */
export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl backdrop-blur-sm">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-950/60 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-red-400/80" />
          <span className="size-3 rounded-full bg-amber-400/80" />
          <span className="size-3 rounded-full bg-emerald-400/80" />
        </div>
        <div className="mx-auto flex w-full max-w-xs items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-500">
          <HugeiconsIcon icon={Search01Icon} className="size-3.5" />
          app.eleven.so/dashboard
        </div>
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-white/10 bg-zinc-950/40 p-3 sm:flex">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium ${
                item.active
                  ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white ring-1 ring-inset ring-white/10"
                  : "text-zinc-500"
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
              <p className="text-[11px] text-zinc-500">Pipeline</p>
              <h3 className="text-[15px] font-semibold text-white">
                Sales overview
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-400">
                <HugeiconsIcon icon={Notification03Icon} className="size-4" />
              </span>
              <span className="size-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500" />
            </div>
          </div>

          {/* stats */}
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <p className="truncate text-[10.5px] text-zinc-500">{s.label}</p>
                <p className="mt-1 text-base font-semibold text-white sm:text-lg">
                  {s.value}
                </p>
                <p
                  className={`mt-0.5 text-[10.5px] font-medium ${
                    s.up ? "text-emerald-400" : "text-rose-400"
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
                    <span
                      className={`size-2 rounded-full bg-gradient-to-br ${col.tint}`}
                    />
                    <span className="text-[11px] font-medium text-zinc-400">
                      {col.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-600">
                    {col.deals.length}
                  </span>
                </div>
                {col.deals.map((d) => (
                  <div
                    key={d.co}
                    className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 transition-colors hover:border-white/20"
                  >
                    <p className="text-[12px] font-medium text-zinc-200">
                      {d.co}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-white">
                        {d.val}
                      </span>
                      <span className="grid size-5 place-items-center rounded-full bg-white/10 text-[9px] font-semibold text-zinc-300">
                        {d.who}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-dashed border-white/10 py-1.5 text-center text-[10px] text-zinc-600">
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
