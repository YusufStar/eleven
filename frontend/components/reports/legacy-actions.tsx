"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { FlashIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { parseLegacyActionsFromMarkdown } from "@/services/ai-reports";

export function LegacyActionsPanel({ content }: { content: string }) {
  const items = parseLegacyActionsFromMarkdown(content);
  if (items.length === 0) return null;

  return (
    <Card className="border-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={FlashIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
          Recommended actions
        </CardTitle>
        <CardDescription>
          This report was generated before one-click actions were available. Regenerate to apply suggestions directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.title}</span>
              <Badge variant="outline" className="text-[10px]">
                Read-only
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <HugeiconsIcon icon={InformationCircleIcon} className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
          Use Regenerate on a new report to get Apply buttons for each recommendation.
        </p>
      </CardContent>
    </Card>
  );
}
