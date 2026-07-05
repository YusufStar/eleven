"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Task01Icon,
  Folder01Icon,
  RocketIcon,
  File02Icon,
  DashboardSquare01Icon,
  BubbleChatIcon,
  ChartLineData01Icon,
  UserGroupIcon,
  Notification01Icon,
  Settings02Icon,
  AiVideoIcon,
  Activity01Icon,
} from "@hugeicons/core-free-icons";
import { useGlobalSearch } from "@/services/search";
import { initials } from "@/lib/string";

const NAV: { label: string; href: string; icon: typeof Task01Icon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardSquare01Icon },
  { label: "Tasks", href: "/dashboard/tasks", icon: Task01Icon },
  { label: "Sprints", href: "/dashboard/sprints", icon: RocketIcon },
  { label: "Projects", href: "/dashboard/projects", icon: Folder01Icon },
  { label: "Files", href: "/dashboard/files", icon: File02Icon },
  { label: "Team", href: "/dashboard/team", icon: UserGroupIcon },
  { label: "Activity", href: "/dashboard/activities", icon: Activity01Icon },
  { label: "Analytics", href: "/dashboard/metrics", icon: ChartLineData01Icon },
  { label: "AI Reports", href: "/dashboard/reports", icon: ChartLineData01Icon },
  { label: "Chat", href: "/chat", icon: BubbleChatIcon },
  { label: "Meet", href: "/meet", icon: AiVideoIcon },
  { label: "Notifications", href: "/dashboard/notifications", icon: Notification01Icon },
  { label: "Settings", href: "/dashboard/settings", icon: Settings02Icon },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const deferredQ = React.useDeferredValue(q);
  const { data } = useGlobalSearch(deferredQ);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  React.useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const results = data ?? { tasks: [], projects: [], sprints: [], files: [], people: [] };
  const hasResults =
    results.tasks.length + results.projects.length + results.sprints.length + results.files.length + results.people.length > 0;
  const searching = q.trim().length >= 2;

  const navMatches = NAV.filter((n) => n.label.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search tasks, projects, people, and navigate.">
      <Command shouldFilter={false}>
        <CommandInput placeholder="Search tasks, projects, people…  (type to search)" value={q} onValueChange={setQ} />
        <CommandList>
        {searching && !hasResults && <CommandEmpty>No results for “{q}”.</CommandEmpty>}

        {searching && results.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {results.tasks.map((t) => (
              <CommandItem key={t.id} value={`task-${t.id}`} onSelect={() => go(`/dashboard/tasks/${t.id}`)}>
                <HugeiconsIcon icon={Task01Icon} className="size-4 text-status-blue" strokeWidth={2} />
                <span className="flex-1 truncate">{t.title}</span>
                <StatusBadge domain="task" value={t.status} size="sm" noTooltip />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searching && results.projects.length > 0 && (
          <CommandGroup heading="Projects">
            {results.projects.map((p) => (
              <CommandItem key={p.id} value={`project-${p.id}`} onSelect={() => go(`/dashboard/projects/${p.id}`)}>
                <HugeiconsIcon icon={Folder01Icon} className="size-4 text-status-purple" strokeWidth={2} />
                <span className="truncate">{p.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searching && results.sprints.length > 0 && (
          <CommandGroup heading="Sprints">
            {results.sprints.map((s) => (
              <CommandItem key={s.id} value={`sprint-${s.id}`} onSelect={() => go("/dashboard/sprints")}>
                <HugeiconsIcon icon={RocketIcon} className="size-4 text-brand" strokeWidth={2} />
                <span className="truncate">{s.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searching && results.files.length > 0 && (
          <CommandGroup heading="Files">
            {results.files.map((f) => (
              <CommandItem key={f.id} value={`file-${f.id}`} onSelect={() => go("/dashboard/files")}>
                <HugeiconsIcon icon={File02Icon} className="size-4 text-status-green" strokeWidth={2} />
                <span className="truncate">{f.fileName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searching && results.people.length > 0 && (
          <CommandGroup heading="People">
            {results.people.map((m) => (
              <CommandItem key={m.id} value={`person-${m.id}`} onSelect={() => go("/dashboard/team")}>
                <Avatar className="size-5">
                  <AvatarImage src={m.user.image ?? undefined} alt="" />
                  <AvatarFallback className="text-[9px]">{initials(m.user.name)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{m.user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{m.user.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(searching && hasResults) && <CommandSeparator />}

        <CommandGroup heading="Go to">
          {(searching ? navMatches : NAV).map((n) => (
            <CommandItem key={n.href} value={`nav-${n.href}`} onSelect={() => go(n.href)}>
              <HugeiconsIcon icon={n.icon} className="size-4 text-muted-foreground" strokeWidth={2} />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
