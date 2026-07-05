"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useSettingsGithub } from "@/services/settings/use-settings-github";
import { useActiveOrgPaymentStatus, paymentsApi } from "@/services/payments";
import { useTeamMembersList } from "@/services/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadModal } from "@/components/ui/upload-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GithubIcon,
  Building06Icon,
  UserGroupIcon,
  Notification01Icon,
  CreditCardIcon,
  Alert02Icon,
  ArrowRight02Icon,
} from "@hugeicons/core-free-icons";

function GeneralTab() {
  const { data: org } = authClient.useActiveOrganization();
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name ?? "");
      setLogo(org.logo ?? undefined);
    }
  }, [org]);

  const dirty = !!org && (name.trim() !== (org.name ?? "") || (logo ?? "") !== (org.logo ?? ""));

  const save = async () => {
    if (!org || !name.trim()) return;
    setSaving(true);
    try {
      await authClient.organization.update({
        organizationId: org.id,
        data: { name: name.trim(), logo: logo ?? undefined },
      });
      toast.success("Organization updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <UploadModal
        isAvatar
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload organization logo"
        onDrop={(_, __, url) => url && setLogo(url)}
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"] }}
        maxFiles={1}
        maxSize={10 * 1024 * 1024}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Your organization&apos;s name and logo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 cursor-pointer rounded-lg" onClick={() => setUploadOpen(true)}>
              <AvatarImage src={logo} className="rounded-lg" />
              <AvatarFallback className="rounded-lg">
                <HugeiconsIcon icon={Building06Icon} className="size-6" strokeWidth={2} />
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
              Change logo
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            <Input id="org-slug" value={org?.slug ?? ""} readOnly disabled />
            <p className="text-xs text-muted-foreground">The slug is fixed once the organization is created.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function IntegrationsTab() {
  const { connection, canManage, isPending, disconnect, isDisconnecting } = useSettingsGithub();
  const connectUrl =
    typeof window !== "undefined"
      ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"}/settings/github/connect`
      : "";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={GithubIcon} className="size-5" strokeWidth={2} />
          Organization GitHub
        </CardTitle>
        <CardDescription>
          {canManage
            ? "Link your company's main GitHub account. Only the owner can connect or disconnect."
            : "The organization's GitHub connection. Only the owner can change it."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : connection ? (
          <div className="flex flex-wrap items-center gap-4">
            {connection.avatarUrl && <img src={connection.avatarUrl} alt="" className="size-10 rounded-full" />}
            <div>
              <p className="font-medium">{connection.githubLogin}</p>
              <p className="text-sm text-muted-foreground">GitHub user ID: {connection.githubUserId}</p>
            </div>
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => disconnect()} disabled={isDisconnecting} className="ml-auto">
                {isDisconnecting ? "Disconnecting…" : "Disconnect"}
              </Button>
            )}
          </div>
        ) : canManage ? (
          <a href={connectUrl}>
            <Button>
              <HugeiconsIcon icon={GithubIcon} className="mr-2 size-4" strokeWidth={2} />
              Connect organization GitHub
            </Button>
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No GitHub account connected to this organization.</p>
        )}
      </CardContent>
    </Card>
  );
}

function MembersTab() {
  const { data } = useTeamMembersList({ pageSize: 1 });
  const total = data?.total ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={UserGroupIcon} className="size-5" strokeWidth={2} />
          Members & roles
        </CardTitle>
        <CardDescription>
          {total} member{total === 1 ? "" : "s"} in this organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="gap-1.5">
          <Link href="/dashboard/team">
            Manage members <HugeiconsIcon icon={ArrowRight02Icon} className="size-4" strokeWidth={2} />
          </Link>
        </Button>
        <Button asChild variant="ghost" className="gap-1.5">
          <Link href="/dashboard/team/invite">Invite people</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function NotificationsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={Notification01Icon} className="size-5" strokeWidth={2} />
          Notifications
        </CardTitle>
        <CardDescription>Choose what reaches you and where — per category, quiet hours, and digest.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="gap-1.5">
          <Link href="/dashboard/notifications/preferences">
            Open preferences <HugeiconsIcon icon={ArrowRight02Icon} className="size-4" strokeWidth={2} />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function BillingTab({ organizationId }: { organizationId: string }) {
  const { data: status, isPending } = useActiveOrgPaymentStatus(organizationId);
  const [loading, setLoading] = useState(false);
  const isPro = status?.plan === "PROFESSIONAL" || !!status?.paidAt;

  const pay = async () => {
    setLoading(true);
    try {
      const { url } = await paymentsApi.createCheckoutSession(organizationId);
      if (url) window.location.href = url;
      else setLoading(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start checkout");
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={CreditCardIcon} className="size-5" strokeWidth={2} />
          Billing
        </CardTitle>
        <CardDescription>Your current plan and payment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{isPro ? "Professional" : "Free"}</p>
                <p className="text-sm text-muted-foreground">
                  {isPro
                    ? status?.paidAt
                      ? `Active since ${new Date(status.paidAt).toLocaleDateString()}`
                      : "Active"
                    : "Limited to 2 members and 1 project."}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isPro ? "bg-status-green/12 text-status-green" : "bg-status-neutral/12 text-muted-foreground"
                }`}
              >
                {isPro ? "Professional" : "Free"}
              </span>
            </div>
            {!isPro && (
              <Button onClick={pay} disabled={loading}>
                {loading ? "Redirecting…" : "Upgrade to Professional"}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DangerTab({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { data: org } = authClient.useActiveOrganization();

  const del = async () => {
    setDeleting(true);
    try {
      await authClient.organization.delete({ organizationId });
      toast.success("Organization deleted.");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <Card className="border-status-red/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-status-red">
          <HugeiconsIcon icon={Alert02Icon} className="size-5" strokeWidth={2} />
          Danger zone
        </CardTitle>
        <CardDescription>Deleting an organization is permanent. All projects, tasks, and files are lost.</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete organization</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this organization?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. Type <span className="font-semibold">{org?.slug}</span> to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={org?.slug ?? "slug"} />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={del}
                disabled={deleting || confirm !== org?.slug}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deleting ? "Deleting…" : "Delete forever"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { data: org } = authClient.useActiveOrganization();

  useEffect(() => {
    const status = searchParams.get("github");
    if (status === "connected" || status === "error") {
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto max-w-3xl py-2">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Organization settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">Manage your organization, integrations, and billing.</p>

      <Tabs defaultValue="general">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
        <TabsContent value="members">
          <MembersTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="billing">{org && <BillingTab organizationId={org.id} />}</TabsContent>
        <TabsContent value="danger">{org && <DangerTab organizationId={org.id} />}</TabsContent>
      </Tabs>
    </div>
  );
}
