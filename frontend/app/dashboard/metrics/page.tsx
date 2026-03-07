"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDealsList, usePipelines } from "@/services/deals";
import type { DealListItem } from "@/services/deals";
import { useDealsOverTime } from "@/services/metrics";

const statusConfig = {
  OPEN: { label: "Open", color: "var(--chart-1)" },
  WON: { label: "Won", color: "var(--chart-2)" },
  LOST: { label: "Lost", color: "var(--chart-3)" },
} satisfies ChartConfig;

const valueByPipelineConfig = {
  value: { label: "Total value", color: "var(--chart-1)" },
} satisfies ChartConfig;

const dealsByStageConfig = {
  count: { label: "Deals", color: "var(--chart-2)" },
} satisfies ChartConfig;

const dealsOverTimeConfig = {
  count: { label: "Deals created", color: "var(--chart-1)" },
  value: { label: "Value", color: "var(--chart-2)" },
} satisfies ChartConfig;

function aggregateDeals(deals: DealListItem[]) {
  const byStatus: Record<string, number> = { OPEN: 0, WON: 0, LOST: 0 };
  const byStage: Record<string, number> = {};
  const byPipelineValue: Record<string, number> = {};
  let totalValue = 0;

  for (const d of deals) {
    byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
    const stageName = d.stage?.name ?? "Unknown";
    byStage[stageName] = (byStage[stageName] ?? 0) + 1;
    const pipelineName = d.pipeline?.name ?? "Unknown";
    const val = d.value != null ? Number(d.value) : 0;
    byPipelineValue[pipelineName] = (byPipelineValue[pipelineName] ?? 0) + val;
    totalValue += val;
  }

  const statusChartData = [
    { status: "Open", count: byStatus.OPEN, fill: "var(--chart-1)" },
    { status: "Won", count: byStatus.WON, fill: "var(--chart-2)" },
    { status: "Lost", count: byStatus.LOST, fill: "var(--chart-3)" },
  ];

  const stageChartData = Object.entries(byStage).map(([name, count]) => ({
    stage: name,
    count,
    fill: "var(--chart-2)",
  }));

  const pipelineValueData = Object.entries(byPipelineValue).map(([name, value]) => ({
    pipeline: name,
    value: Math.round(value * 100) / 100,
    fill: "var(--chart-1)",
  }));

  return {
    totalDeals: deals.length,
    open: byStatus.OPEN,
    won: byStatus.WON,
    lost: byStatus.LOST,
    totalValue,
    statusChartData,
    stageChartData,
    pipelineValueData,
  };
}

export default function MetricsPage() {
  const { data: dealsRes, isPending: dealsLoading } = useDealsList({
    page: 1,
    pageSize: 100,
  });
  const { data: pipelinesRes, isPending: pipelinesLoading } = usePipelines();
  const { data: overTimeRes, isPending: overTimeLoading } = useDealsOverTime({ days: 30 });

  const deals = dealsRes?.data ?? [];
  const pipelines = pipelinesRes?.data ?? [];
  const totalDealsCount = dealsRes?.total ?? 0;

  const aggregated = useMemo(() => aggregateDeals(deals), [deals]);

  const dealsOverTimeData = useMemo(() => {
    const raw = overTimeRes?.data ?? [];
    if (raw.length === 0) return [];
    const byDate = new Map(raw.map((r) => [r.date, r]));
    const start = raw[0]?.date ?? "";
    const end = raw[raw.length - 1]?.date ?? "";
    if (!start || !end) return raw;
    const out: { date: string; count: number; value: number }[] = [];
    const d = new Date(start);
    const endD = new Date(end);
    while (d <= endD) {
      const key = d.toISOString().slice(0, 10);
      out.push(byDate.get(key) ?? { date: key, count: 0, value: 0 });
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [overTimeRes?.data]);

  const isLoading = dealsLoading || pipelinesLoading || overTimeLoading;

  const defaultCurrency = deals[0]?.currency ?? "USD";

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Metrics</h1>
        <p className="text-muted-foreground text-sm">
          Pipeline and deal metrics. Based on {deals.length}
          {totalDealsCount > deals.length ? ` of ${totalDealsCount}` : ""} deals.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregated.totalDeals}</div>
              <p className="text-muted-foreground text-xs">In this view</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregated.open}</div>
              <p className="text-muted-foreground text-xs">Active deals</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregated.won}</div>
              <p className="text-muted-foreground text-xs">Closed won</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregated.lost}</div>
              <p className="text-muted-foreground text-xs">Closed lost</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: defaultCurrency,
                  maximumFractionDigits: 0,
                }).format(aggregated.totalValue)}
              </div>
              <p className="text-muted-foreground text-xs">Sum of deal values</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading &&
        (aggregated.statusChartData.some((d) => d.count > 0) ||
          aggregated.stageChartData.length > 0 ||
          aggregated.pipelineValueData.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {aggregated.statusChartData.some((d) => d.count > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Deals by status</CardTitle>
                  <CardDescription>Open, won, and lost</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={statusConfig} className="h-[260px] w-full">
                    <BarChart
                      accessibilityLayer
                      data={aggregated.statusChartData}
                      margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="status"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="count"
                        radius={4}
                        shape={(props: { payload?: { fill?: string }; fill?: string; x?: number; y?: number; width?: number; height?: number }) => {
                          const fill = props.payload?.fill ?? props.fill ?? "var(--chart-1)";
                          return (
                            <rect
                              x={props.x}
                              y={props.y}
                              width={props.width}
                              height={props.height}
                              fill={fill}
                              rx={4}
                              ry={4}
                            />
                          );
                        }}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {aggregated.stageChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deals by stage</CardTitle>
                  <CardDescription>Distribution across pipeline stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={dealsByStageConfig} className="h-[260px] w-full">
                    <BarChart
                      accessibilityLayer
                      data={aggregated.stageChartData}
                      margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="stage"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(v) => (v.length > 12 ? `${v.slice(0, 10)}…` : v)}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {aggregated.pipelineValueData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Total value by pipeline</CardTitle>
                  <CardDescription>Sum of deal values per pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={valueByPipelineConfig} className="h-[260px] w-full">
                    <BarChart
                      accessibilityLayer
                      data={aggregated.pipelineValueData}
                      margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="pipeline"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(v) => (v.length > 12 ? `${v.slice(0, 10)}…` : v)}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={(v) =>
                          typeof v === "number" && v >= 1000 ? `${v / 1000}k` : String(v)
                        }
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) =>
                              new Intl.NumberFormat(undefined, {
                                style: "currency",
                                currency: defaultCurrency,
                                maximumFractionDigits: 0,
                              }).format(Number(value))
                            }
                          />
                        }
                      />
                      <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {dealsOverTimeData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deals over time</CardTitle>
                  <CardDescription>Deals created per day (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={dealsOverTimeConfig} className="h-[260px] w-full">
                    <LineChart
                      accessibilityLayer
                      data={dealsOverTimeData}
                      margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(v) => (typeof v === "string" ? v.slice(5) : v)}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="var(--color-count)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      {!isLoading &&
        aggregated.statusChartData.every((d) => d.count === 0) &&
        aggregated.stageChartData.length === 0 &&
        aggregated.pipelineValueData.length === 0 && (
          <Card>
            <CardContent className="flex min-h-[200px] items-center justify-center text-muted-foreground">
              No deal data yet. Create deals to see metrics here.
            </CardContent>
          </Card>
        )}
    </div>
  );
}
