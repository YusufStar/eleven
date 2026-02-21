"use client";

import { useState, useCallback } from "react";
import { useTeamMembersList } from "@/services/team";
import { MembersDataTable } from "@/components/team/members/data-table";
import { membersColumns } from "@/components/team/members/columns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Xls01Icon, Csv01Icon } from "@hugeicons/core-free-icons";

export default function TeamMembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const pageSize = 10;
  const params = {
    page,
    pageSize,
    search: search || undefined,
    role: role === "all" ? undefined : role,
  };
  const { data, isPending, isFetching } = useTeamMembersList(params);
  const members = data?.data ?? [];
  const total = data?.total ?? 0;
  const onPageChange = useCallback((p: number) => setPage(p), []);
  const onSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  const onRoleChange = useCallback((v: string) => {
    setRole(v);
    setPage(1);
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-muted-foreground text-sm">
            Your organization&apos;s team members.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" disabled title="Coming soon">
            <HugeiconsIcon icon={Xls01Icon} className="size-4" strokeWidth={2} />
            Import Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2" disabled title="Coming soon">
            <HugeiconsIcon icon={Csv01Icon} className="size-4" strokeWidth={2} />
            Import CSV
          </Button>
          <Button asChild className="gap-2">
            <Link href="/dashboard/team/invite">
              <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
              Invite employee
            </Link>
          </Button>
        </div>
      </div>
      <MembersDataTable
        columns={membersColumns}
        data={members}
        loading={isPending}
        fetching={isFetching && !isPending}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        search={search}
        onSearchChange={onSearchChange}
        role={role}
        onRoleChange={onRoleChange}
      />
    </div>
  );
}
