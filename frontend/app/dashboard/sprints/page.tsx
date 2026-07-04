"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon, RocketIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCreateSprint, useDeleteSprint, useSprints, type Sprint } from "@/services/tasks";

function fmtRange(s: Sprint): string {
  const opt = { month: "short", day: "numeric" } as const;
  return `${new Date(s.startsAt).toLocaleDateString(undefined, opt)} – ${new Date(s.endsAt).toLocaleDateString(undefined, opt)}`;
}

function SprintCard({ sprint, onDelete }: { sprint: Sprint; onDelete: (id: string) => void }) {
  const pct = sprint.taskCount > 0 ? Math.round((sprint.doneCount / sprint.taskCount) * 100) : 0;
  return (
    <Card size="sm" className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{sprint.name}</CardTitle>
          <div className="flex items-center gap-1.5">
            <StatusBadge domain="sprint" value={sprint.state} size="sm" />
            <button
              type="button"
              aria-label={`Delete ${sprint.name}`}
              className="text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
              onClick={() => onDelete(sprint.id)}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
            </button>
          </div>
        </div>
        <CardDescription>
          {fmtRange(sprint)}
          {sprint.goal ? ` — ${sprint.goal}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {sprint.doneCount}/{sprint.taskCount} tasks
            </span>
            <span className="tabular-nums text-muted-foreground">
              {sprint.completedPoints}/{sprint.committedPoints} pts
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-status-blue transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Link
          href={`/dashboard/tasks?sprintId=${sprint.id}&view=kanban`}
          className="inline-block text-sm text-primary hover:underline"
        >
          View board
        </Link>
      </CardContent>
    </Card>
  );
}

export default function SprintsPage() {
  const { data: sprints, isPending } = useSprints();
  const createSprint = useCreateSprint();
  const deleteSprint = useDeleteSprint();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [goal, setGoal] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");

  const submit = () => {
    if (!name.trim() || !startsAt || !endsAt) {
      toast.error("Name, start and end dates are required.");
      return;
    }
    createSprint.mutate(
      { name: name.trim(), goal: goal.trim() || null, startsAt, endsAt },
      {
        onSuccess: () => {
          toast.success("Sprint created.");
          setOpen(false);
          setName("");
          setGoal("");
          setStartsAt("");
          setEndsAt("");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const remove = (id: string) => {
    deleteSprint.mutate(id, {
      onSuccess: () => toast.success("Sprint deleted. Its tasks were kept."),
      onError: (e) => toast.error(e.message),
    });
  };

  const active = (sprints ?? []).filter((s) => s.state === "active");
  const upcoming = (sprints ?? []).filter((s) => s.state === "upcoming");
  const done = (sprints ?? []).filter((s) => s.state === "done");

  return (
    <div className="container mx-auto py-2">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sprints</h1>
          <p className="text-sm text-muted-foreground">Plan work in time-boxed iterations.</p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          New sprint
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : (sprints ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <HugeiconsIcon icon={RocketIcon} className="size-8 text-muted-foreground" strokeWidth={2} />
          <p className="text-sm text-muted-foreground">No sprints yet. Create your first one to start planning.</p>
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} /> New sprint
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { label: "Active", items: active },
            { label: "Upcoming", items: upcoming },
            { label: "Finished", items: done },
          ]
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <section key={g.label}>
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{g.label}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((s) => (
                    <SprintCard key={s.id} sprint={s} onDelete={remove} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New sprint</DialogTitle>
            <DialogDescription>Time-box the next iteration of work.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sprint-name">Name</Label>
              <Input id="sprint-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint 12" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint-goal">Goal (optional)</Label>
              <Input id="sprint-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ship the new billing flow" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sprint-start">Starts</Label>
                <Input id="sprint-start" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sprint-end">Ends</Label>
                <Input id="sprint-end" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={createSprint.isPending}>
              Create sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
