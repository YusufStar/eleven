"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon, Flag02Icon } from "@hugeicons/core-free-icons";
import {
  useProjectMilestones,
  useAddMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from "@/services/projects";

function fmtDate(s: string | null): string {
  if (!s) return "No due date";
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ProjectMilestones({ projectId }: { projectId: string }) {
  const { data: milestones, isPending } = useProjectMilestones(projectId);
  const addMilestone = useAddMilestone(projectId);
  const updateMilestone = useUpdateMilestone(projectId);
  const deleteMilestone = useDeleteMilestone(projectId);
  const [name, setName] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  const submit = () => {
    if (!name.trim()) return;
    addMilestone.mutate(
      { name: name.trim(), dueAt: dueAt || null },
      {
        onSuccess: () => {
          setName("");
          setDueAt("");
          setAdding(false);
          toast.success("Milestone added.");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Flag02Icon} className="size-4 text-status-purple" strokeWidth={2} />
          Milestones
        </CardTitle>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setAdding((v) => !v)}>
          <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Milestone name" className="min-w-40 flex-1" />
            <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-40" />
            <Button size="sm" onClick={submit} disabled={!name.trim() || addMilestone.isPending}>
              Add
            </Button>
          </div>
        )}
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (milestones ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones yet. Break the project into checkpoints.</p>
        ) : (
          <ul className="space-y-2">
            {milestones!.map((m) => {
              const pct = m.taskCount > 0 ? Math.round((m.doneCount / m.taskCount) * 100) : 0;
              return (
                <li key={m.id} className="group rounded-lg border p-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={!!m.completedAt}
                      onCheckedChange={(v) =>
                        updateMilestone.mutate({ milestoneId: m.id, body: { completed: !!v } })
                      }
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${m.completedAt ? "text-muted-foreground line-through" : ""}`}>
                          {m.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(m.dueAt)}</span>
                      </div>
                      {m.taskCount > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-status-purple transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {m.doneCount}/{m.taskCount}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete ${m.name}`}
                      className="text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                      onClick={() => deleteMilestone.mutate(m.id)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
