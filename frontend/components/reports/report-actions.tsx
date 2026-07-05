"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  FlashIcon,
  PlayIcon,
  TaskDone01Icon,
} from "@hugeicons/core-free-icons";
import {
  useApplyAiReportAction,
  useApplyAllAiReportActions,
  type AiReportAction,
} from "@/services/ai-reports";

const TYPE_LABELS: Record<string, string> = {
  CREATE_TASK: "Create task",
  UPDATE_TASK_STATUS: "Update status",
  UPDATE_TASK_PRIORITY: "Set priority",
  REASSIGN_TASK: "Reassign",
  ADD_TASK_COMMENT: "Add comment",
};

function ActionRow({
  action,
  reportId,
  onApplied,
}: {
  action: AiReportAction;
  reportId: string;
  onApplied?: () => void;
}) {
  const apply = useApplyAiReportAction(reportId);
  const done = action.status === "APPLIED";
  const failed = action.status === "FAILED";

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{action.title}</span>
          <Badge variant="outline" className="text-[10px]">
            {TYPE_LABELS[action.type] ?? action.type}
          </Badge>
          {done && (
            <Badge variant="secondary" className="gap-1 text-[10px] text-status-green">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" strokeWidth={2} />
              Applied
            </Badge>
          )}
          {failed && (
            <Badge variant="destructive" className="text-[10px]">
              Failed
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{action.description}</p>
        {action.resultMessage && (
          <p className={`text-xs ${done ? "text-status-green" : failed ? "text-destructive" : "text-muted-foreground"}`}>
            {action.resultMessage}
          </p>
        )}
      </div>
      {action.status === "PENDING" && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5"
          disabled={apply.isPending}
          onClick={() =>
            apply.mutate(action.id, {
              onSuccess: (res) => {
                toast.success(res.message);
                onApplied?.();
              },
              onError: (e) => toast.error(e.message),
            })
          }
        >
          {apply.isPending ? <Spinner className="size-3.5" /> : <HugeiconsIcon icon={PlayIcon} className="size-3.5" strokeWidth={2} />}
          Apply
        </Button>
      )}
    </div>
  );
}

export function ReportActionsPanel({
  reportId,
  actions,
}: {
  reportId: string;
  actions: AiReportAction[];
}) {
  const applyAll = useApplyAllAiReportActions(reportId);
  const pending = actions.filter((a) => a.status === "PENDING");
  const applied = actions.filter((a) => a.status === "APPLIED");

  if (actions.length === 0) return null;

  return (
    <Card className="border-brand/20 bg-gradient-to-br from-brand/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={FlashIcon} className="size-4 text-brand" strokeWidth={2} />
          Recommended actions
        </CardTitle>
        <CardDescription>
          Apply AI suggestions directly to your workspace — one at a time or all at once.
          {applied.length > 0 && ` ${applied.length} already applied.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.length > 1 && (
          <Button
            size="sm"
            className="gap-1.5"
            disabled={applyAll.isPending}
            onClick={() =>
              applyAll.mutate(undefined, {
                onSuccess: (res) => {
                  toast.success(`Applied ${res.applied} action(s)${res.failed ? `, ${res.failed} failed` : ""}.`);
                },
                onError: (e) => toast.error(e.message),
              })
            }
          >
            {applyAll.isPending ? (
              <Spinner className="size-3.5" />
            ) : (
              <HugeiconsIcon icon={TaskDone01Icon} className="size-3.5" strokeWidth={2} />
            )}
            Apply all ({pending.length})
          </Button>
        )}
        <div className="space-y-2">
          {actions.map((action) => (
            <ActionRow key={action.id} action={action} reportId={reportId} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
