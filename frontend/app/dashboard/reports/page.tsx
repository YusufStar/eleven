"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, RefreshIcon, AiBrain01Icon } from "@hugeicons/core-free-icons";
import {
  useAiReports,
  useAiReport,
  useGenerateAiReport,
  type AiReportKind,
} from "@/services/ai-reports";
import { ReportDashboardView } from "@/components/reports/report-dashboard";

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

export default function ReportsPage() {
  const reportViewRef = React.useRef<HTMLDivElement>(null);
  const [activeKind, setActiveKind] = React.useState<AiReportKind>("MINI");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { data, isPending: listPending } = useAiReports();
  const generate = useGenerateAiReport();

  const aiConfigured = data?.aiConfigured ?? true;
  const reports = data?.data ?? [];
  const kindReports = reports.filter((r) => r.kind === activeKind);
  const latest = kindReports[0];

  const effectiveId = selectedId ?? latest?.id ?? null;
  const { data: detailData, isPending: detailPending } = useAiReport(effectiveId);
  const displayedReport = detailData?.report ?? kindReports.find((r) => r.id === effectiveId) ?? latest;

  React.useEffect(() => {
    setSelectedId(null);
  }, [activeKind]);

  const selectReport = (id: string) => {
    setSelectedId(id);
    requestAnimationFrame(() => {
      reportViewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const onGenerate = (kind: AiReportKind, force = false) => {
    generate.mutate(
      { kind, force },
      {
        onSuccess: (res) => {
          setActiveKind(kind);
          setSelectedId(res.report.id);
          toast.success(res.fresh ? "Showing today's report." : "Report generated.");
          requestAnimationFrame(() => {
            reportViewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const loading = listPending || generate.isPending || (effectiveId != null && detailPending && !displayedReport);

  return (
    <div className="container mx-auto space-y-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            AI Reports
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">Claude</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Structured dashboards with charts, KPI cards, and one-click recommended actions — grounded in your real data.
          </p>
        </div>
      </div>

      {!aiConfigured && (
        <Card className="border-status-orange/40 bg-status-orange/5 print:hidden">
          <CardContent className="py-4 text-sm text-muted-foreground">
            AI reports are not configured yet. Set <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY</code> on the backend to enable report generation.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3 print:hidden">
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

      <div className="flex flex-wrap items-center gap-2 print:hidden">
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

      {kindReports.length > 0 && (
        <div className="print:hidden">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Report history
          </h2>
          <ul className="flex flex-wrap gap-2">
            {kindReports.map((r, i) => {
              const active = effectiveId === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => selectReport(r.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                      active ? "border-brand/50 bg-brand/10 ring-1 ring-brand/30" : ""
                    }`}
                  >
                    <span className="block font-medium">{i === 0 ? "Latest · " : ""}{fmtDate(r.createdAt)}</span>
                    <span className="block max-w-[220px] truncate text-xs text-muted-foreground">{r.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div ref={reportViewRef}>
        {loading ? (
          <Skeleton className="h-96 w-full rounded-xl print:hidden" />
        ) : displayedReport ? (
          <ReportDashboardView report={displayedReport} />
        ) : (
          <Card className="border-dashed print:hidden">
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
      </div>
    </div>
  );
}
