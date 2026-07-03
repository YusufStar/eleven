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
    icon: UserGroupIcon,
    title: "Contacts",
    copy: "People and companies with full history — every call, note, and file where you expect it.",
  },
  {
    icon: KanbanIcon,
    title: "Deals & pipeline",
    copy: "Stages you define, values you trust. Drag a deal forward and the numbers follow.",
  },
  {
    icon: FolderOpenIcon,
    title: "Projects",
    copy: "Won a deal? It becomes a project without re-typing a thing. Scope, files, and owners carry over.",
  },
  {
    icon: CheckListIcon,
    title: "Tasks",
    copy: "List, board, or calendar — the same tasks, arranged the way each person actually works.",
  },
  {
    icon: Analytics01Icon,
    title: "Metrics",
    copy: "Revenue, velocity, and workload on one page. No exports, no spreadsheet rituals.",
  },
  {
    icon: Message01Icon,
    title: "Chat & meet",
    copy: "Conversations and calls live next to the work they're about, not in another tab.",
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
