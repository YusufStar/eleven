"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useActivitiesList } from "@/services/activities";
import type { ActivityAction, ActivityEntityType } from "@/services/activities";
import { ActivitiesFilterBar } from "@/components/activities/activities-filter-bar";
import { ActivitiesDataTable } from "@/components/activities/activities-data-table";
import { activitiesColumns } from "@/components/activities/activities-columns";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const SEARCH_DEBOUNCE_MS = 400;

export default function ActivitiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const action = (searchParams.get("action") || "") as ActivityAction | "";
  const entityType = (searchParams.get("entityType") || "") as ActivityEntityType | "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const updateUrl = useCallback(
    (updates: {
      search?: string;
      action?: ActivityAction | "";
      entityType?: ActivityEntityType | "";
      dateFrom?: string;
      dateTo?: string;
      page?: number;
    }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.search !== undefined) {
        if (updates.search) next.set("search", updates.search);
        else next.delete("search");
      }
      if (updates.action !== undefined) {
        if (updates.action) next.set("action", updates.action);
        else next.delete("action");
      }
      if (updates.entityType !== undefined) {
        if (updates.entityType) next.set("entityType", updates.entityType);
        else next.delete("entityType");
      }
      if (updates.dateFrom !== undefined) {
        if (updates.dateFrom) next.set("dateFrom", updates.dateFrom);
        else next.delete("dateFrom");
      }
      if (updates.dateTo !== undefined) {
        if (updates.dateTo) next.set("dateTo", updates.dateTo);
        else next.delete("dateTo");
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

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const pageSize = 20;
  const params = {
    page,
    pageSize,
    search: search || undefined,
    action: action || undefined,
    entityType: entityType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data, isPending, isFetching } = useActivitiesList(params, {
    refetchInterval: 1000,
    enabled: true,
  });

  const activities = data?.data ?? [];
  const total = data?.total ?? 0;

  const hasActiveFilters = !!(search || action || entityType || dateFrom || dateTo);

  const onPageChange = useCallback((p: number) => updateUrl({ page: p }), [updateUrl]);
  const onSearchChange = useCallback(
    (v: string) => {
      setSearchInput(v);
      debouncedUpdateSearch(v);
    },
    [debouncedUpdateSearch]
  );
  const onActionChange = useCallback((a: ActivityAction | "") => updateUrl({ action: a, page: 1 }), [updateUrl]);
  const onEntityTypeChange = useCallback(
    (t: ActivityEntityType | "") => updateUrl({ entityType: t, page: 1 }),
    [updateUrl]
  );
  const onDateFromChange = useCallback((v: string) => updateUrl({ dateFrom: v, page: 1 }), [updateUrl]);
  const onDateToChange = useCallback((v: string) => updateUrl({ dateTo: v, page: 1 }), [updateUrl]);
  const onClearFilters = useCallback(() => {
    setSearchInput("");
    updateUrl({ search: "", action: "", entityType: "", dateFrom: "", dateTo: "", page: 1 });
  }, [updateUrl]);

  return (
    <div className="container mx-auto py-2">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity log</h1>
          <p className="text-muted-foreground text-sm">
            Live view of who viewed, created, updated, or deleted items. Refreshes every second.
          </p>
        </div>
      </div>
      <ActivitiesFilterBar
        search={searchInput}
        onSearchChange={onSearchChange}
        action={action}
        onActionChange={onActionChange}
        entityType={entityType}
        onEntityTypeChange={onEntityTypeChange}
        dateFrom={dateFrom}
        onDateFromChange={onDateFromChange}
        dateTo={dateTo}
        onDateToChange={onDateToChange}
        onClearFilters={onClearFilters}
        hasActiveFilters={hasActiveFilters}
        className="mb-4"
      />
      <ActivitiesDataTable
        columns={activitiesColumns()}
        data={activities}
        loading={isPending}
        fetching={isFetching}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}
