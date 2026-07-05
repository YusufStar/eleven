"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type IconButtonProps = React.ComponentProps<typeof Button> & {
  /** Accessible name + tooltip text. Required — an icon-only button must announce itself. */
  label: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
};

/** Icon-only button with a mandatory tooltip + aria-label. Use anywhere a button
 *  shows only an icon so it stays discoverable and accessible. */
export function IconButton({ label, tooltipSide = "top", size = "icon", children, ...props }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size={size} aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
