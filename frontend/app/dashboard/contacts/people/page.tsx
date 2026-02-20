"use client";

import { useState } from "react";
import { useContactsPeopleList } from "@/services/contacts";
import { PeopleDataTable } from "@/components/contacts/people/data-table";
import { peopleColumns } from "@/components/contacts/people/columns";
import { AddContactPeopleModal } from "@/components/contacts/people/add-contac-people-modal";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Xls01Icon, Csv01Icon } from "@hugeicons/core-free-icons";

export default function PeoplePage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data, isPending } = useContactsPeopleList({ page, pageSize });
  const contacts = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <p className="text-muted-foreground text-sm">Your organization's contact directory.</p>
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
            Add contact
          </Button>
        </div>
      </div>
      <AddContactPeopleModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      <PeopleDataTable
        columns={peopleColumns}
        data={contacts}
        loading={isPending}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
