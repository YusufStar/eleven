import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  KanbanIcon,
  FolderOpenIcon,
  CheckListIcon,
  Analytics01Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons";
import { Reveal } from "./reveal";

const features = [
  {
    icon: CheckListIcon,
    title: "Tasks & sprints",
    copy: "Subtasks, labels, priorities, estimates, dependencies, and time tracking — planned on boards or lists.",
  },
  {
    icon: KanbanIcon,
    title: "Projects",
    copy: "Progress, health, milestones, burndown, and velocity for every project, in one glance.",
  },
  {
    icon: Message01Icon,
    title: "Chat & meet",
    copy: "Threads, reactions, mentions, read receipts, and calls — right next to the work they're about.",
  },
  {
    icon: FolderOpenIcon,
    title: "Files",
    copy: "Drag-and-drop uploads, previews, folders, and version history — shared across the whole team.",
  },
  {
    icon: Analytics01Icon,
    title: "AI reports",
    copy: "Claude reads your real data and writes daily, weekly, and monthly summaries with the risks flagged.",
  },
  {
    icon: UserGroupIcon,
    title: "Team & presence",
    copy: "See who's online, what they're working on, their timezone, and their status — no standup required.",
  },
];

export function LandingFeatures() {
  return (
    <section id="capabilities" className="scroll-mt-16 border-b">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            01 — Capabilities
          </p>
          <h2 className="mt-4 max-w-2xl font-serif text-4xl tracking-tight md:text-5xl">
            Everything. <em>Nothing</em> extra.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-14">
          <div className="grid border-l border-t sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group border-b border-r p-8 transition-colors hover:bg-muted/50"
              >
                <HugeiconsIcon
                  icon={f.icon}
                  className="size-5 text-muted-foreground transition-colors group-hover:text-foreground"
                  strokeWidth={1.5}
                />
                <h3 className="mt-5 text-[15px] font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.copy}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
