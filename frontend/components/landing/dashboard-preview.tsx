const columns = [
  {
    stage: "Qualified",
    total: "$128k",
    deals: [
      { name: "Aldergate renewal", value: "$42,000", width: "w-3/4" },
      { name: "Porcelain Studio", value: "$18,500", width: "w-1/3" },
      { name: "Meridian pilot", value: "$67,500", width: "w-1/2" },
    ],
  },
  {
    stage: "Proposal",
    total: "$96k",
    deals: [
      { name: "Obsidian Group", value: "$54,000", width: "w-2/3" },
      { name: "Kairos expansion", value: "$42,000", width: "w-1/2" },
    ],
  },
  {
    stage: "Closing",
    total: "$210k",
    deals: [
      { name: "Northwind annual", value: "$150,000", width: "w-5/6" },
      { name: "Atelier onboarding", value: "$60,000", width: "w-2/5" },
    ],
  },
];

/** Static monochrome product mock shown in the hero. Decorative only. */
export function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-xl border bg-card text-left shadow-2xl"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="ml-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          eleven / deals / pipeline
        </span>
      </div>

      <div className="flex">
        {/* sidebar */}
        <div className="hidden w-44 shrink-0 border-r p-4 sm:block">
          {["Dashboard", "Contacts", "Deals", "Projects", "Tasks", "Metrics"].map(
            (item, i) => (
              <div
                key={item}
                className={`mb-1 rounded-md px-3 py-2 text-xs ${
                  i === 2
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground"
                }`}
              >
                {item}
              </div>
            ),
          )}
        </div>

        {/* pipeline board */}
        <div className="grid flex-1 grid-cols-3 gap-4 p-4 sm:p-6">
          {columns.map((col) => (
            <div key={col.stage} className="min-w-0">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <span className="truncate text-xs font-medium">{col.stage}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {col.total}
                </span>
              </div>
              <div className="space-y-3">
                {col.deals.map((deal) => (
                  <div
                    key={deal.name}
                    className="rounded-lg border bg-background p-3"
                  >
                    <p className="truncate text-[11px] font-medium">{deal.name}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {deal.value}
                    </p>
                    <div className="mt-2.5 h-1 rounded-full bg-muted">
                      <div className={`h-1 rounded-full bg-foreground/70 ${deal.width}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
