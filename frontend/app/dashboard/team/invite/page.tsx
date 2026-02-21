"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { InviteDataTable } from "@/components/team/invite/invite-data-table";
import { invitesColumns } from "@/components/team/invite/columns";
import { InviteMemberModal } from "@/components/team/invite/invite-member-modal";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { OrgInvitation } from "@/components/team/invite/columns";

function normalizeInvitation(raw: Record<string, unknown>): OrgInvitation {
  const createdAt = raw.createdAt as string | Date | undefined;
  const expiresAt = raw.expiresAt as string | Date | null | undefined;
  return {
    id: String(raw.id ?? ""),
    email: String(raw.email ?? ""),
    role: String(raw.role ?? "member"),
    status: String(raw.status ?? "pending"),
    createdAt: createdAt ? new Date(createdAt) : new Date(),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    inviter: raw.inviter as OrgInvitation["inviter"],
  };
}

export default function TeamInvitePage() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: invitationsRaw, isPending } = useQuery({
    queryKey: ["organization", "invitations"],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listInvitations({});
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const invitations: OrgInvitation[] = (Array.isArray(invitationsRaw) ? invitationsRaw : []).map(
    (item) => normalizeInvitation(item as Record<string, unknown>)
  );

  const onSearchChange = useCallback((v: string) => setSearch(v), []);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
          <p className="text-muted-foreground text-sm">
            Manage pending invitations to your organization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/team">Back to members</Link>
          </Button>
          <Button className="gap-2" onClick={() => setInviteModalOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
            Invite member
          </Button>
        </div>
      </div>
      <InviteMemberModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
      <InviteDataTable
        columns={invitesColumns}
        data={invitations}
        loading={isPending}
        search={search}
        onSearchChange={onSearchChange}
      />
    </div>
  );
}
