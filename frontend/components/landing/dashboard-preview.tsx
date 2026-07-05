const columns = [
  {
    stage: "To do",
    total: "5",
    tasks: [
      { name: "Auth: refresh token rotation", tag: "API", width: "w-1/4" },
      { name: "Empty states for Files", tag: "UI", width: "w-1/5" },
      { name: "Rate-limit the webhook", tag: "Infra", width: "w-1/3" },
    ],
  },
  {
    stage: "In progress",
    total: "3",
    tasks: [
      { name: "Sprint burndown chart", tag: "Analytics", width: "w-2/3" },
      { name: "Thread reactions", tag: "Chat", width: "w-1/2" },
    ],
  },
  {
    stage: "In review",
    total: "2",
    tasks: [
      { name: "AI weekly report", tag: "AI", width: "w-5/6" },
      { name: "Presence heartbeat", tag: "Team", width: "w-4/5" },
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
          eleven / sprint / board
        </span>
      </div>

      <div className="flex">
        {/* sidebar */}
        <div className="hidden w-44 shrink-0 border-r p-4 sm:block">
          {["Dashboard", "Tasks", "Sprints", "Projects", "Chat", "Analytics"].map(
            (item, i) => (
              <div
                key={item}
                className={`mb-1 rounded-md px-3 py-2 text-xs ${
                  i === 1
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground"
                }`}
              >
                {item}
              </div>
            ),
          )}
        </div>

        {/* task board */}
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
                {col.tasks.map((task) => (
                  <div
                    key={task.name}
                    className="rounded-lg border bg-background p-3"
                  >
                    <p className="truncate text-[11px] font-medium">{task.name}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {task.tag}
                    </p>
                    <div className="mt-2.5 h-1 rounded-full bg-muted">
                      <div className={`h-1 rounded-full bg-foreground/70 ${task.width}`} />
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
