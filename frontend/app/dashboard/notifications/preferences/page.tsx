"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Task01Icon,
  AtIcon,
  Folder01Icon,
  AiVideoIcon,
  Notification01Icon,
  Moon02Icon,
  Mail01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationCategory,
  type NotificationPreferences,
} from "@/services/notifications";

const CATEGORIES: { key: NotificationCategory; label: string; icon: typeof Task01Icon; desc: string }[] = [
  { key: "task", label: "Tasks", icon: Task01Icon, desc: "Assignments, completions, comments on your tasks" },
  { key: "mention", label: "Mentions", icon: AtIcon, desc: "When someone @mentions you in chat or a comment" },
  { key: "project", label: "Projects & Sprints", icon: Folder01Icon, desc: "Project membership, files, sprint updates" },
  { key: "meeting", label: "Meetings", icon: AiVideoIcon, desc: "Meeting invites and reminders" },
  { key: "system", label: "System", icon: Notification01Icon, desc: "Everything else" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function defaultPref(): NotificationPreferences {
  return {
    categories: {},
    emailEnabled: true,
    pushEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    digest: "off",
  };
}

export default function NotificationPreferencesPage() {
  const { data, isPending } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const [pref, setPref] = React.useState<NotificationPreferences | null>(null);

  React.useEffect(() => {
    if (data) setPref({ ...defaultPref(), ...data, categories: data.categories ?? {} });
  }, [data]);

  const catValue = (cat: NotificationCategory, channel: "inApp" | "email"): boolean => {
    const c = pref?.categories[cat];
    return c ? c[channel] : true;
  };

  const setCat = (cat: NotificationCategory, channel: "inApp" | "email", value: boolean) => {
    setPref((prev) => {
      if (!prev) return prev;
      const existing = prev.categories[cat] ?? { inApp: true, email: true };
      return { ...prev, categories: { ...prev.categories, [cat]: { ...existing, [channel]: value } } };
    });
  };

  const save = () => {
    if (!pref) return;
    update.mutate(pref, {
      onSuccess: () => toast.success("Preferences saved."),
      onError: (e) => toast.error(e.message),
    });
  };

  const quietEnabled = pref?.quietHoursStart != null && pref?.quietHoursEnd != null;

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-2">
      <div>
        <Link
          href="/dashboard/notifications"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
          Notifications
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Notification preferences</h1>
        <p className="text-sm text-muted-foreground">Choose what reaches you, and where.</p>
      </div>

      {isPending || !pref ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Per-category channels */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Categories</CardTitle>
              <CardDescription>In-app and email delivery per category.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span />
                <span className="w-14 text-center">In-app</span>
                <span className="w-14 text-center">Email</span>
              </div>
              {CATEGORIES.map((c) => (
                <div key={c.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <HugeiconsIcon icon={c.icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                  <div className="flex w-14 justify-center">
                    <Switch checked={catValue(c.key, "inApp")} onCheckedChange={(v) => setCat(c.key, "inApp", v)} />
                  </div>
                  <div className="flex w-14 justify-center">
                    <Switch
                      checked={catValue(c.key, "email") && pref.emailEnabled}
                      disabled={!pref.emailEnabled}
                      onCheckedChange={(v) => setCat(c.key, "email", v)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Channels */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={Mail01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
                  <span>
                    <span className="block text-sm font-medium">Email notifications</span>
                    <span className="block text-xs text-muted-foreground">Master switch for all emails</span>
                  </span>
                </span>
                <Switch
                  checked={pref.emailEnabled}
                  onCheckedChange={(v) => setPref({ ...pref, emailEnabled: v })}
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={SmartPhone01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
                  <span>
                    <span className="block text-sm font-medium">Push notifications</span>
                    <span className="block text-xs text-muted-foreground">Browser push (coming soon)</span>
                  </span>
                </span>
                <Switch checked={pref.pushEnabled} onCheckedChange={(v) => setPref({ ...pref, pushEnabled: v })} />
              </label>
            </CardContent>
          </Card>

          {/* Quiet hours + digest */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <HugeiconsIcon icon={Moon02Icon} className="size-4 text-status-purple" strokeWidth={2} />
                Quiet hours & digest
              </CardTitle>
              <CardDescription>Pause emails during focus time and choose a summary cadence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">Quiet hours</span>
                <Switch
                  checked={quietEnabled}
                  onCheckedChange={(v) =>
                    setPref({
                      ...pref,
                      quietHoursStart: v ? 22 : null,
                      quietHoursEnd: v ? 8 : null,
                    })
                  }
                />
              </div>
              {quietEnabled && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">From</span>
                  <Select
                    value={String(pref.quietHoursStart)}
                    onValueChange={(v) => setPref({ ...pref, quietHoursStart: Number(v) })}
                  >
                    <SelectTrigger size="sm" className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {String(h).padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">to</span>
                  <Select
                    value={String(pref.quietHoursEnd)}
                    onValueChange={(v) => setPref({ ...pref, quietHoursEnd: Number(v) })}
                  >
                    <SelectTrigger size="sm" className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {String(h).padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">Digest</span>
                <Select
                  value={pref.digest}
                  onValueChange={(v) => setPref({ ...pref, digest: v as NotificationPreferences["digest"] })}
                >
                  <SelectTrigger size="sm" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off (real-time)</SelectItem>
                    <SelectItem value="daily">Daily summary</SelectItem>
                    <SelectItem value="weekly">Weekly summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save preferences"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
