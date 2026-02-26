"use client";

import * as React from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, Calendar03Icon, Folder01Icon, ViewIcon } from "@hugeicons/core-free-icons";
import type { Task } from "@/services/tasks";
import { TASK_STATUSES, type TaskStatusValue } from "@/services/tasks/types";
import { useUpdateTaskStatus } from "@/services/tasks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { motion } from "framer-motion";

const COLUMN_CONFIG: Record<TaskStatusValue, { label: string; className: string }> = {
  TODO: {
    label: "To do",
    className: "border-amber-200/60 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20",
  },
  IN_PROGRESS: {
    label: "In progress",
    className: "border-blue-200/60 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/20",
  },
  DONE: {
    label: "Done",
    className: "border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-slate-200/60 bg-slate-50/50 dark:border-slate-700/50 dark:bg-slate-800/20",
  },
};

export interface TasksKanbanViewProps {
  tasks: Task[];
  isPending: boolean;
  onStatusChange?: (taskId: string, status: string) => void;
}

function KanbanCard({
  task,
  isOverlay,
  onDetailClick,
}: {
  task: Task;
  isOverlay?: boolean;
  onDetailClick?: (task: Task) => void;
}) {
  const dueLabel = task.dueAt
    ? (() => {
        try {
          return new Date(task.dueAt).toLocaleDateString(undefined, { dateStyle: "medium" });
        } catch {
          return null;
        }
      })()
    : null;

  const content = (
    <>
      <p className="font-medium text-foreground line-clamp-2">{task.title?.trim() || "Untitled"}</p>
      {task.description?.trim() ? (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description.trim()}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {task.project?.name ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-1.5 py-0.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Folder01Icon} className="size-3" strokeWidth={2} />
            <span className="truncate max-w-[100px]">{task.project.name}</span>
          </span>
        ) : null}
        {task.assignee?.user?.name ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-1.5 py-0.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={UserIcon} className="size-3" strokeWidth={2} />
            <span className="truncate max-w-[80px]">{task.assignee.user.name}</span>
          </span>
        ) : null}
        {dueLabel ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Calendar03Icon} className="size-3" strokeWidth={2} />
            {dueLabel}
          </span>
        ) : null}
      </div>
    </>
  );

  if (isOverlay) {
    return (
      <motion.div
        initial={{ scale: 0.96, opacity: 0.9 }}
        animate={{ scale: 1.02, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="rounded-xl border border-border bg-card p-3 shadow-xl ring-2 ring-primary/25"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className="relative rounded-xl border bg-card p-3 shadow-sm">
      {onDetailClick && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="View details"
          onClick={(e) => {
            e.stopPropagation();
            onDetailClick(task);
          }}
        >
          <HugeiconsIcon icon={ViewIcon} className="size-4" strokeWidth={2} />
        </Button>
      )}
      {content}
    </div>
  );
}

function DraggableCard({ task, onDetailClick }: { task: Task; onDetailClick?: (task: Task) => void }) {
  const status = (task.status in COLUMN_CONFIG ? task.status : "TODO") as TaskStatusValue;
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: { task, status },
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-0 pointer-events-none"
      )}
    >
      <KanbanCard task={task} onDetailClick={onDetailClick} />
    </motion.div>
  );
}

function DroppableColumn({
  status,
  tasks,
  isPending,
  onDetailClick,
}: {
  status: TaskStatusValue;
  tasks: Task[];
  isPending: boolean;
  onDetailClick?: (task: Task) => void;
}) {
  const config = COLUMN_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      animate={{
        scale: isOver ? 1.02 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex min-h-[320px] flex-col rounded-xl border-2 p-3 transition-shadow",
        config.className,
        isOver && "ring-2 ring-primary/40 ring-offset-2 shadow-lg"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{config.label}</h3>
        <motion.span
          key={tasks.length}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {tasks.length}
        </motion.span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {isPending ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : (
          tasks.map((task) => (
            <DraggableCard key={task.id} task={task} onDetailClick={onDetailClick} />
          ))
        )}
      </div>
    </motion.div>
  );
}

export function TasksKanbanView({
  tasks,
  isPending,
  onStatusChange,
}: TasksKanbanViewProps) {
  const updateStatus = useUpdateTaskStatus();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [detailTaskId, setDetailTaskId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const tasksByStatus = React.useMemo(() => {
    const map: Record<TaskStatusValue, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      CANCELLED: [],
    };
    for (const task of tasks) {
      const s = (task.status in map ? task.status : "TODO") as TaskStatusValue;
      map[s].push(task);
    }
    return map;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const task = active.data.current?.task as Task | undefined;
    const newStatus = over.id as string;
    if (!task || !TASK_STATUSES.includes(newStatus as TaskStatusValue) || task.status === newStatus) return;

    onStatusChange?.(task.id, newStatus);
    updateStatus.mutate(
      { taskId: task.id, status: newStatus },
      {
        onError: (err) => toast.error(err.message ?? "Failed to update status"),
      }
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid w-full grid-cols-4 gap-4 pb-4">
        {TASK_STATUSES.map((status, index) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
          >
            <DroppableColumn
              status={status}
              tasks={tasksByStatus[status]}
              isPending={isPending}
              onDetailClick={(t) => setDetailTaskId(t.id)}
            />
          </motion.div>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="cursor-grabbing" style={{ width: "min(280px, 100%)" }}>
            <KanbanCard task={activeTask} isOverlay />
          </div>
        ) : null}
      </DragOverlay>

      <TaskDetailModal
        taskId={detailTaskId}
        open={!!detailTaskId}
        onOpenChange={(open) => !open && setDetailTaskId(null)}
      />
    </DndContext>
  );
}
