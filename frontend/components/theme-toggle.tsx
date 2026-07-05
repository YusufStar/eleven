"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun03Icon, Moon02Icon, ComputerIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ThemeToggleProps = {
  className?: string;
  align?: "start" | "center" | "end";
};

export function ThemeToggle({ className, align = "end" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const options = [
    { value: "light", label: "Light", icon: Sun03Icon },
    { value: "dark", label: "Dark", icon: Moon02Icon },
    { value: "system", label: "System", icon: ComputerIcon },
  ] as const;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn("relative", className)}
              aria-label="Toggle theme"
            >
              <HugeiconsIcon
                icon={Sun03Icon}
                className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
                strokeWidth={2}
              />
              <HugeiconsIcon
                icon={Moon02Icon}
                className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
                strokeWidth={2}
              />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Toggle theme</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align={align}>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className="gap-2"
            data-active={mounted && theme === option.value}
          >
            <HugeiconsIcon icon={option.icon} className="size-4" strokeWidth={2} />
            {option.label}
            {mounted && theme === option.value ? (
              <span className="ml-auto size-1.5 rounded-full bg-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
