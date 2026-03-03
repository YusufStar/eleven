"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDealsList, usePipelines } from "@/services/deals";
import type { DealStatus } from "@/services/deals";
import { DealsFilterBar } from "@/components/deals/deals-filter-bar";
import { DealsDataTable } from "@/components/deals/deals-data-table";
import { dealsColumns } from "@/components/deals/deals-columns";
import { AddDealModal } from "@/components/deals/add-deal-modal";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const SEARCH_DEBOUNCE_MS = 400;

export default function DealsListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const pipelineId = searchParams.get("pipelineId") || "";
  const stageId = searchParams.get("stageId") || "";
  const status = (searchParams.get("status") || "") as DealStatus | "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const updateUrl = useCallback(
    (updates: { search?: string; pipelineId?: string; stageId?: string; status?: DealStatus | ""; page?: number }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.search !== undefined) {
        if (updates.search) next.set("search", updates.search);
        else next.delete("search");
      }
      if (updates.pipelineId !== undefined) {
        if (updates.pipelineId) next.set("pipelineId", updates.pipelineId);
        else next.delete("pipelineId");
      }
      if (updates.stageId !== undefined) {
        if (updates.stageId) next.set("stageId", updates.stageId);
        else next.delete("stageId");
      }
      if (updates.status !== undefined) {
        if (updates.status) next.set("status", updates.status);
        else next.delete("status");
      }
      if (updates.page !== undefined) {
        if (updates.page > 1) next.set("page", String(updates.page));
        else next.delete("page");
      }
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const debouncedUpdateSearch = useDebouncedCallback(
    (v: string) => updateUrl({ search: v, page: 1 }),
    SEARCH_DEBOUNCE_MS
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const { data: pipelinesRes } = usePipelines();
  const pipelines = pipelinesRes?.data ?? [];
  const selectedPipeline = pipelines.find((p) => p.id === pipelineId) ?? pipelines[0];
  const stages = selectedPipeline?.stages ?? [];

  const pageSize = 10;
  const params = {
    page,
    pageSize,
    search: search || undefined,
    pipelineId: pipelineId || undefined,
    stageId: stageId || undefined,
    status: status || undefined,
  };
  const { data, isPending, isFetching } = useDealsList(params);
  const deals = data?.data ?? [];
  const total = data?.total ?? 0;

  const hasActiveFilters = !!(search || pipelineId || stageId || status);

  const onPageChange = useCallback((p: number) => updateUrl({ page: p }), [updateUrl]);
  const onSearchChange = useCallback(
    (v: string) => {
      setSearchInput(v);
      debouncedUpdateSearch(v);
    },
    [debouncedUpdateSearch]
  );
  const onPipelineChange = useCallback((id: string) => updateUrl({ pipelineId: id, stageId: "", page: 1 }), [updateUrl]);
  const onStageChange = useCallback((id: string) => updateUrl({ stageId: id, page: 1 }), [updateUrl]);
  const onStatusChange = useCallback((s: DealStatus | "") => updateUrl({ status: s, page: 1 }), [updateUrl]);
  const onClearFilters = useCallback(() => {
    setSearchInput("");
    updateUrl({ search: "", pipelineId: "", stageId: "", status: "", page: 1 });
  }, [updateUrl]);

  return (
    <div className="container mx-auto py-2">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All deals</h1>
          <p className="text-muted-foreground text-sm">View and manage deals.</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} className="size-4 mr-2" />
          Add deal
        </Button>
      </div>
      <DealsFilterBar
        search={searchInput}
        onSearchChange={onSearchChange}
        pipelineId={pipelineId}
        onPipelineChange={onPipelineChange}
        stageId={stageId}
        onStageChange={onStageChange}
        pipelines={pipelines}
        stages={stages}
        status={status}
        onStatusChange={onStatusChange}
        onClearFilters={onClearFilters}
        hasActiveFilters={hasActiveFilters}
        className="mb-4"
      />
      <DealsDataTable
        columns={dealsColumns()}
        data={deals}
        loading={isPending}
        fetching={isFetching}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        useExternalFilters
        hasActiveFilters={hasActiveFilters}
      />
      <AddDealModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </div>
  );
}
