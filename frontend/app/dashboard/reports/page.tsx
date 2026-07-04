"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { MarkdownView } from "@/components/ui/markdown-view";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, RefreshIcon, AiBrain01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { useAiReports, useGenerateAiReport, type AiReport, type AiReportKind } from "@/services/ai-reports";

const KINDS: { kind: AiReportKind; label: string; cadence: string; tone: string }[] = [
  { kind: "MINI", label: "Daily digest", cadence: "Covers the last 24 hours", tone: "from-status-blue/15" },
  { kind: "MEDIUM", label: "Weekly report", cadence: "Covers the last 7 days", tone: "from-brand/15" },
  { kind: "HIGH", label: "Monthly deep-dive", cadence: "Covers the last 30 days", tone: "from-status-purple/15" },
];

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function GenerateCard({
  kind,
  label,
  cadence,
  tone,
  disabled,
  onGenerate,
  pending,
}: {
  kind: AiReportKind;
  label: string;
  cadence: string;
  tone: string;
  disabled: boolean;
  onGenerate: (kind: AiReportKind) => void;
  pending: boolean;
}) {
  return (
    <Card size="sm" className={`relative overflow-hidden bg-gradient-to-br ${tone} to-transparent`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={AiBrain01Icon} className="size-4 text-brand" strokeWidth={2} />
          {label}
        </CardTitle>
        <CardDescription>{cadence}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button size="sm" className="gap-1.5" disabled={disabled || pending} onClick={() => onGenerate(kind)}>
          {pending ? <Spinner className="size-3.5" /> : <HugeiconsIcon icon={SparklesIcon} className="size-3.5" strokeWidth={2} />}
          Generate now
        </Button>
      </CardContent>
    </Card>
  );
}

function ReportView({ report }: { report: AiReport }) {
  const metricKeys = Object.keys(report.metrics ?? {});
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={SparklesIcon} className="size-4 text-brand" strokeWidth={2} />
            {report.title}
          </CardTitle>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" strokeWidth={2} />
            {fmtDate(report.periodStart)} – {fmtDate(report.periodEnd)}
            {report.model && <Badge variant="secondary" className="text-[10px]">{report.model}</Badge>}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MarkdownView content={report.content} />
        {metricKeys.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {metricKeys.map((k) => (
              <Badge key={k} variant="outline" className="text-[10px]">
                {k.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [activeKind, setActiveKind] = React.useState<AiReportKind>("MINI");
  const { data, isPending } = useAiReports();
  const generate = useGenerateAiReport();

  const aiConfigured = data?.aiConfigured ?? true;
  const reports = data?.data ?? [];
  const latest = reports.find((r) => r.kind === activeKind);

  const onGenerate = (kind: AiReportKind, force = false) => {
    generate.mutate(
      { kind, force },
      {
        onSuccess: (res) => {
          setActiveKind(kind);
          toast.success(res.fresh ? "Showing today's report." : "Report generated.");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="container mx-auto space-y-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            AI Reports
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">Claude</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Automated summaries of productivity, velocity, bottlenecks, and risks — grounded in your real data via tool calling.
          </p>
        </div>
      </div>

      {!aiConfigured && (
        <Card className="border-status-orange/40 bg-status-orange/5">
          <CardContent className="py-4 text-sm text-muted-foreground">
            AI reports are not configured yet. Set <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY</code> on the backend to enable report generation.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {KINDS.map((k) => (
          <GenerateCard
            key={k.kind}
            {...k}
            disabled={!aiConfigured}
            onGenerate={(kind) => onGenerate(kind)}
            pending={generate.isPending && generate.variables?.kind === k.kind}
          />
        ))}
      </div>

      {/* Kind switcher */}
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-lg border p-0.5">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              onClick={() => setActiveKind(k.kind)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                activeKind === k.kind ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        {latest && aiConfigured && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={generate.isPending}
            onClick={() => onGenerate(activeKind, true)}
          >
            <HugeiconsIcon icon={RefreshIcon} className="size-3.5" strokeWidth={2} />
            Regenerate
          </Button>
        )}
      </div>

      {/* Latest report of active kind */}
      {isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : latest ? (
        <ReportView report={latest} />
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <HugeiconsIcon icon={AiBrain01Icon} className="size-8 text-muted-foreground" strokeWidth={2} />
            <p className="text-sm text-muted-foreground">
              No {KINDS.find((k) => k.kind === activeKind)?.label.toLowerCase()} yet. Generate one to get an AI summary of your team&apos;s work.
            </p>
            {aiConfigured && (
              <Button size="sm" className="gap-1.5" disabled={generate.isPending} onClick={() => onGenerate(activeKind)}>
                <HugeiconsIcon icon={SparklesIcon} className="size-4" strokeWidth={2} />
                Generate now
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {reports.filter((r) => r.kind === activeKind && r.id !== latest?.id).length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Earlier reports</h2>
          <ul className="space-y-1.5">
            {reports
              .filter((r) => r.kind === activeKind && r.id !== latest?.id)
              .map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="truncate font-medium">{r.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
