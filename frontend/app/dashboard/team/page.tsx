"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTeamMembersList } from "@/services/team";
import { MembersDataTable } from "@/components/team/members/data-table";
import { membersColumns } from "@/components/team/members/columns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { MyStatusDialog, TeamPresenceGrid } from "@/components/team/team-presence-grid";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const SEARCH_DEBOUNCE_MS = 400;

export default function TeamMembersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const updateUrl = useCallback(
    (updates: { search?: string; role?: string; page?: number }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.search !== undefined) {
        if (updates.search) next.set("search", updates.search);
        else next.delete("search");
      }
      if (updates.role !== undefined) {
        if (updates.role && updates.role !== "all") next.set("role", updates.role);
        else next.delete("role");
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

  const pageSize = 10;
  const params = {
    page,
    pageSize,
    search: search || undefined,
    role: role === "all" ? undefined : role,
  };
  const { data, isPending, isFetching } = useTeamMembersList(params);
  // Full list (no filters) powers the presence grid; refreshed for live presence dots.
  const { data: allData } = useTeamMembersList({ pageSize: 100 }, { refetchInterval: 60_000 });
  const members = data?.data ?? [];
  const total = data?.total ?? 0;
  const { data: session } = authClient.useSession();
  const me = (allData?.data ?? []).find((m) => m.userId === session?.user?.id) ?? null;
  const [statusOpen, setStatusOpen] = useState(false);

  const onPageChange = useCallback((p: number) => updateUrl({ page: p }), [updateUrl]);
  const onSearchChange = useCallback(
    (v: string) => {
      setSearchInput(v);
      debouncedUpdateSearch(v);
    },
    [debouncedUpdateSearch]
  );
  const onRoleChange = useCallback((v: string) => updateUrl({ role: v, page: 1 }), [updateUrl]);

  return (
    <div className="container mx-auto py-2">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-muted-foreground text-sm">
            Your organization&apos;s team members.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {me && (
            <Button variant="outline" size="sm" onClick={() => setStatusOpen(true)}>
              {me.statusEmoji ? `${me.statusEmoji} ` : ""}My status
            </Button>
          )}
          <Button asChild className="gap-2">
            <Link href="/dashboard/team/invite">
              <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
              Invite employee
            </Link>
          </Button>
        </div>
      </div>
      {(allData?.data ?? []).length > 0 && (
        <div className="mb-6">
          <TeamPresenceGrid
            members={allData?.data ?? []}
            myUserId={session?.user?.id ?? null}
            onEditStatus={() => setStatusOpen(true)}
          />
        </div>
      )}
      <MembersDataTable
        columns={membersColumns}
        data={members}
        loading={isPending}
        fetching={isFetching && !isPending}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        search={searchInput}
        onSearchChange={onSearchChange}
        role={role}
        onRoleChange={onRoleChange}
      />
      {me && <MyStatusDialog me={me} open={statusOpen} onOpenChange={setStatusOpen} />}
    </div>
  );
}
