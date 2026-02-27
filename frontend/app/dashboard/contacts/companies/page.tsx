"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useContactsCompaniesList } from "@/services/contacts";
import type { ContactStatus } from "@/services/contacts";
import { CompaniesDataTable } from "@/components/contacts/companies/data-table";
import { companiesColumns } from "@/components/contacts/companies/columns";
import { AddContactCompanyModal } from "@/components/contacts/companies/add-contact-company-modal";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Xls01Icon, Csv01Icon } from "@hugeicons/core-free-icons";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const STATUS_VALUES: (ContactStatus | "all")[] = ["all", "LEAD", "PROSPECT", "CUSTOMER", "CHURNED", "PARTNER"];
const SEARCH_DEBOUNCE_MS = 400;

export default function CompaniesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const statusParam = searchParams.get("status") || "all";
  const status = STATUS_VALUES.includes(statusParam as ContactStatus | "all") ? (statusParam as ContactStatus | "all") : "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const updateUrl = useCallback(
    (updates: { search?: string; status?: ContactStatus | "all"; page?: number }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.search !== undefined) {
        if (updates.search) next.set("search", updates.search);
        else next.delete("search");
      }
      if (updates.status !== undefined) {
        if (updates.status && updates.status !== "all") next.set("status", updates.status);
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

  const pageSize = 10;
  const params = { page, pageSize, search: search || undefined, status: status === "all" ? undefined : status };
  const { data, isPending, isFetching } = useContactsCompaniesList(params);
  const contacts = data?.data ?? [];
  const total = data?.total ?? 0;

  const onPageChange = useCallback((p: number) => updateUrl({ page: p }), [updateUrl]);
  const onSearchChange = useCallback(
    (v: string) => {
      setSearchInput(v);
      debouncedUpdateSearch(v);
    },
    [debouncedUpdateSearch]
  );
  const onStatusChange = useCallback((v: ContactStatus | "all") => updateUrl({ status: v, page: 1 }), [updateUrl]);

  return (
    <div className="container mx-auto py-2">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-muted-foreground text-sm">Your organization's company directory.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={Xls01Icon} className="size-4" strokeWidth={2} />
            Import Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={Csv01Icon} className="size-4" strokeWidth={2} />
            Import CSV
          </Button>
          <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
            Add company
          </Button>
        </div>
      </div>
      <AddContactCompanyModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      <CompaniesDataTable
        columns={companiesColumns}
        data={contacts}
        loading={isPending}
        fetching={isFetching && !isPending}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        search={searchInput}
        onSearchChange={onSearchChange}
        status={status}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
