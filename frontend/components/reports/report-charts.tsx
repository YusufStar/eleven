"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportChart } from "@/services/ai-reports";

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function chartConfigFromSeries(chart: ReportChart): ChartConfig {
  const cfg: ChartConfig = {};
  for (const s of chart.series) {
    cfg[s.key] = { label: s.label, color: s.color ?? "var(--chart-1)" };
  }
  if (chart.type === "pie" && chart.data.length > 0) {
    const nameKey = chart.xKey ?? "name";
    chart.data.forEach((row, i) => {
      const key = String(row[nameKey] ?? i);
      cfg[key] = { label: key, color: PIE_COLORS[i % PIE_COLORS.length] };
    });
  }
  return cfg;
}

function ReportChartCard({ chart }: { chart: ReportChart }) {
  const config = chartConfigFromSeries(chart);
  const xKey = chart.xKey ?? (chart.data[0] ? Object.keys(chart.data[0]).find((k) => typeof chart.data[0][k] === "string") ?? "name" : "name");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{chart.title}</CardTitle>
        {chart.description && <CardDescription>{chart.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {chart.data.length === 0 ? (
          <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">No chart data.</p>
        ) : chart.type === "line" ? (
          <ChartContainer config={config} className="min-h-[220px] w-full">
            <LineChart accessibilityLayer data={chart.data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {chart.series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={`var(--color-${s.key})`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        ) : chart.type === "pie" ? (
          <ChartContainer config={config} className="mx-auto min-h-[220px] max-h-[280px] w-full aspect-square">
            <PieChart accessibilityLayer>
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey={xKey} />} />
              <Pie
                data={chart.data}
                dataKey={chart.series[0]?.key ?? "value"}
                nameKey={xKey}
                innerRadius={50}
                strokeWidth={2}
              >
                {chart.data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey={xKey} />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={config} className="min-h-[220px] w-full">
            <BarChart accessibilityLayer data={chart.data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {chart.series.map((s) => (
                <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={4} />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportChartsGrid({ charts }: { charts: ReportChart[] }) {
  if (charts.length === 0) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {charts.map((chart) => (
        <ReportChartCard key={chart.id} chart={chart} />
      ))}
    </div>
  );
}
