"use client";

import { useState, useEffect } from "react";
import {
  usePipelines,
  useCreatePipeline,
  useCreateStageForPipeline,
  useUpdateStage,
  useDeleteStage,
} from "@/services/deals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  MoreVerticalIcon,
  Edit02Icon,
  Delete02Icon,
  FolderIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import type { Pipeline, Stage } from "@/services/deals";

export default function DealsStagesPage() {
  const { data: pipelinesRes, isPending } = usePipelines();
  const pipelines = pipelinesRes?.data ?? [];
  const createPipeline = useCreatePipeline();

  const [editStage, setEditStage] = useState<Stage | null>(null);
  const [addStagePipelineId, setAddStagePipelineId] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [newPipelineName, setNewPipelineName] = useState("");

  const createStageForPipeline = useCreateStageForPipeline();
  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();

  const handleCreatePipeline = () => {
    createPipeline.mutate(
      { name: newPipelineName.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Pipeline created");
          setNewPipelineName("");
        },
        onError: (e) => toast.error(e.message ?? "Failed to create pipeline"),
      }
    );
  };

  const handleAddStage = (pipelineId: string) => {
    setAddStagePipelineId(pipelineId);
    setNewStageName("");
  };

  const handleSubmitAddStage = () => {
    if (!addStagePipelineId) return;
    const name = newStageName.trim() || "New stage";
    createStageForPipeline.mutate(
      { pipelineId: addStagePipelineId, name },
      {
        onSuccess: () => {
          toast.success("Stage added");
          setAddStagePipelineId(null);
          setNewStageName("");
        },
        onError: (e) => toast.error(e.message ?? "Failed to add stage"),
      }
    );
  };

  const handleUpdateStage = (id: string, name: string) => {
    updateStage.mutate(
      { id, body: { name: name.trim() } },
      {
        onSuccess: () => {
          toast.success("Stage updated");
          setEditStage(null);
        },
        onError: (e) => toast.error(e.message ?? "Failed to update"),
      }
    );
  };

  const handleDeleteStage = (stage: Stage) => {
    deleteStage.mutate(stage.id, {
      onSuccess: () => toast.success("Stage deleted"),
      onError: (e) => toast.error(e.message ?? "Cannot delete stage with deals"),
    });
  };

  if (isPending) {
    return (
      <div className="container mx-auto py-4 space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stages</h1>
        <p className="text-muted-foreground text-sm">Manage pipelines and stages for deals.</p>
      </div>

      {pipelines.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No pipeline yet</CardTitle>
            <CardDescription>Create a pipeline to organize deals by stages.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="Pipeline name (e.g. Sales)"
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleCreatePipeline} disabled={createPipeline.isPending}>
              Create pipeline
            </Button>
          </CardContent>
        </Card>
      )}

      {pipelines.map((pipeline) => (
        <Card key={pipeline.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={FolderIcon} className="size-5 text-muted-foreground" />
              <CardTitle>{pipeline.name}</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddStage(pipeline.id)}
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4 mr-1" />
              Add stage
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {pipeline.stages
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((stage) => (
                  <li
                    key={stage.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <span className="font-medium w-[250px] truncate">{stage.name}</span>
                    <span className="text-muted-foreground text-sm">Order: {stage.order}</span>
                    <div className="w-[250px] flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditStage(stage)}>
                            <HugeiconsIcon icon={Edit02Icon} className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteStage(stage)}
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {pipelines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>New pipeline</CardTitle>
            <CardDescription>Add another pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 w-full">
            <Input
              placeholder="Pipeline name"
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              className="w-full"
            />
            <Button onClick={handleCreatePipeline} disabled={createPipeline.isPending}>
              Create pipeline
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!addStagePipelineId} onOpenChange={(o) => !o && setAddStagePipelineId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add stage</DialogTitle>
            <DialogDescription>Enter the stage name.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Stage name"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitAddStage()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStagePipelineId(null)}>Cancel</Button>
            <Button onClick={handleSubmitAddStage} disabled={createStageForPipeline.isPending}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditStageDialog
        stage={editStage}
        onClose={() => setEditStage(null)}
        onSave={(id, name) => handleUpdateStage(id, name)}
        isPending={updateStage.isPending}
      />
    </div>
  );
}

function EditStageDialog({
  stage,
  onClose,
  onSave,
  isPending,
}: {
  stage: Stage | null;
  onClose: () => void;
  onSave: (id: string, name: string) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(stage?.name ?? "");
  useEffect(() => {
    if (stage) setName(stage.name);
  }, [stage]);
  if (!stage) return null;
  return (
    <Dialog open={!!stage} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit stage</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Stage name"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={isPending} onClick={() => onSave(stage.id, name)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
