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
import { UserIcon, MoveIcon } from "@hugeicons/core-free-icons";
import type { DealListItem, Stage } from "@/services/deals";
import { useUpdateDeal } from "@/services/deals";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

function formatValue(value: string | null, currency: string) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

function DealCard({
  deal,
  isOverlay,
  onView,
  dragHandleProps,
}: {
  deal: DealListItem;
  isOverlay?: boolean;
  onView?: (deal: DealListItem) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}) {
  const valueStr = formatValue(deal.value, deal.currency);
  const contactName = deal.contact
    ? [deal.contact.firstName, deal.contact.lastName].filter(Boolean).join(" ") ||
      deal.contact.companyName ||
      "—"
    : null;

  const content = (
    <>
      <p className="font-medium text-foreground line-clamp-2">{deal.title?.trim() || "Untitled"}</p>
      {valueStr && (
        <p className="mt-1 text-sm font-medium text-primary">{valueStr}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {contactName && (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-1.5 py-0.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={UserIcon} className="size-3" strokeWidth={2} />
            <span className="truncate max-w-[120px]">{contactName}</span>
          </span>
        )}
        {deal.probability != null && (
          <span className="text-xs text-muted-foreground">{deal.probability}%</span>
        )}
      </div>
    </>
  );

  if (isOverlay) {
    return (
      <motion.div
        initial={{ scale: 0.96, opacity: 0.9 }}
        animate={{ scale: 1.02, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="rounded-xl border border-border bg-card p-3 shadow-xl ring-2 ring-primary/25 w-[280px]"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className="relative flex gap-2 rounded-xl border bg-card p-3 shadow-sm w-full">
      {onView !== undefined && dragHandleProps && (
        <span
          {...dragHandleProps}
          className="flex shrink-0 cursor-grab active:cursor-grabbing touch-none self-start rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Drag to move"
        >
          <HugeiconsIcon icon={MoveIcon} className="size-4" strokeWidth={2} />
        </span>
      )}
      <Link
        href={`/dashboard/deals/${deal.id}`}
        className="min-w-0 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={`Open ${deal.title}`}
      >
        {content}
      </Link>
    </div>
  );
}

function DraggableDealCard({
  deal,
  onView,
}: {
  deal: DealListItem;
  onView?: (deal: DealListItem) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(isDragging && "opacity-0 pointer-events-none")}
    >
      <DealCard deal={deal} onView={onView} dragHandleProps={{ ...listeners, ...attributes }} />
    </motion.div>
  );
}

function DroppableColumn({
  stage,
  deals,
  isPending,
  onView,
}: {
  stage: Stage;
  deals: DealListItem[];
  isPending: boolean;
  onView?: (deal: DealListItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const stageColor = stage.color || "bg-muted/30 border-muted";

  return (
    <motion.div
      ref={setNodeRef}
      layout
      animate={{ scale: isOver ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex h-full min-h-[420px] flex-col rounded-xl border-2 p-4 transition-shadow",
        stageColor,
        isOver && "ring-2 ring-primary/40 ring-offset-2 shadow-lg"
      )}
    >
      <div className="mb-4 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-foreground">{stage.name}</h3>
        <motion.span
          key={deals.length}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {deals.length}
        </motion.span>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto min-h-0">
        {isPending ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : (
          deals.map((deal) => (
            <DraggableDealCard key={deal.id} deal={deal} onView={onView} />
          ))
        )}
      </div>
    </motion.div>
  );
}

export interface DealsBoardViewProps {
  pipelineId: string;
  stages: Stage[];
  deals: DealListItem[];
  isPending: boolean;
  onDealMove?: (dealId: string, stageId: string) => void;
}

export function DealsBoardView({
  pipelineId,
  stages,
  deals,
  isPending,
  onDealMove,
}: DealsBoardViewProps) {
  const updateDeal = useUpdateDeal();
  const [activeDeal, setActiveDeal] = React.useState<DealListItem | null>(null);

  const dealsByStage = React.useMemo(() => {
    const map: Record<string, DealListItem[]> = {};
    for (const s of stages) map[s.id] = [];
    for (const d of deals) {
      if (d.pipelineId === pipelineId && map[d.stageId]) map[d.stageId].push(d);
    }
    return map;
  }, [pipelineId, stages, deals]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = event.active.data.current?.deal as DealListItem | undefined;
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const deal = active.data.current?.deal as DealListItem | undefined;
    const newStageId = over.id as string;
    if (!deal || !stages.some((s) => s.id === newStageId) || deal.stageId === newStageId) return;

    onDealMove?.(deal.id, newStageId);
    updateDeal.mutate(
      { id: deal.id, body: { stageId: newStageId } },
      { onError: (err) => toast.error(err.message ?? "Failed to move deal") }
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 overflow-x-auto pb-4 pt-1 min-h-[calc(100vh-12rem)]">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
            className="flex-shrink-0 w-[300px]"
          >
            <DroppableColumn
              stage={stage}
              deals={dealsByStage[stage.id] ?? []}
              isPending={isPending}
              onView={() => {}}
            />
          </motion.div>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDeal ? (
          <div className="cursor-grabbing w-[300px]">
            <DealCard deal={activeDeal} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
