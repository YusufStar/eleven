"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportKpi } from "@/services/ai-reports";

const bar: Record<string, string> = {
  neutral: "bg-status-neutral",
  blue: "bg-status-blue",
  green: "bg-status-green",
  orange: "bg-status-orange",
  red: "bg-status-red",
};

export function ReportKpiGrid({ kpis }: { kpis: ReportKpi[] }) {
  if (kpis.length === 0) return null;
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.id} size="sm" className="relative overflow-hidden">
          <span className={`absolute inset-x-0 top-0 h-0.5 ${bar[kpi.tone ?? "neutral"]} opacity-70`} />
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums">{kpi.value}</span>
            {kpi.sub && <p className="mt-0.5 text-xs text-muted-foreground">{kpi.sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
