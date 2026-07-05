"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownView } from "@/components/ui/markdown-view";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Calendar03Icon,
  Download04Icon,
  InformationCircleIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import {
  getReportDashboard,
  type AiReport,
  type ReportHighlight,
} from "@/services/ai-reports";
import { ReportKpiGrid } from "./report-kpis";
import { ReportChartsGrid } from "./report-charts";
import { ReportActionsPanel } from "./report-actions";
import { LegacyActionsPanel } from "./legacy-actions";

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function HighlightCards({ items, variant }: { items: ReportHighlight[]; variant: "highlight" | "risk" }) {
  if (items.length === 0) return null;
  const icon = variant === "risk" ? Alert02Icon : InformationCircleIcon;
  const border =
    variant === "risk"
      ? "border-status-orange/30 bg-status-orange/5"
      : "border-status-blue/30 bg-status-blue/5";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Card key={item.id} size="sm" className={border}>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={icon} className="size-4 shrink-0" strokeWidth={2} />
              {item.title}
              {item.severity === "critical" && (
                <Badge variant="destructive" className="text-[10px]">
                  Critical
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{item.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReportDashboardView({ report }: { report: AiReport }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const dashboard = getReportDashboard(report);
  const actions = report.actions ?? [];

  const onExportPdf = () => {
    const el = ref.current;
    if (!el) return;
    const prev = document.title;
    document.title = report.title;
    window.print();
    document.title = prev;
  };

  return (
    <div ref={ref} className="report-print-root space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HugeiconsIcon icon={SparklesIcon} className="size-5 text-brand" strokeWidth={2} />
              {report.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" strokeWidth={2} />
                {fmtDate(report.periodStart)} – {fmtDate(report.periodEnd)}
              </span>
              {report.model && (
                <Badge variant="secondary" className="text-[10px]">
                  {report.model}
                </Badge>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onExportPdf}>
                <HugeiconsIcon icon={Download04Icon} className="size-3.5" strokeWidth={2} />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {dashboard ? (
        <>
          <ReportKpiGrid kpis={dashboard.kpis} />
          <ReportChartsGrid charts={dashboard.charts} />
          {dashboard.highlights.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Highlights</h3>
              <HighlightCards items={dashboard.highlights} variant="highlight" />
            </div>
          )}
          {dashboard.risks.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Risks & bottlenecks</h3>
              <HighlightCards items={dashboard.risks} variant="risk" />
            </div>
          )}
        </>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Report narrative</CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownView content={report.content} />
        </CardContent>
      </Card>

      {actions.length > 0 ? (
        <div className="print:hidden">
          <ReportActionsPanel reportId={report.id} actions={actions} />
        </div>
      ) : (
        <div className="print:hidden">
          <LegacyActionsPanel content={report.content} />
        </div>
      )}
    </div>
  );
}
