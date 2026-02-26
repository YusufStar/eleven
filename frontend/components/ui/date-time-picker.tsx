"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

function toLocalISOString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function parseDateTime(value: string | null | undefined): Date | undefined {
  if (value == null || value === "") return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export type DateTimePickerProps = {
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Show time inputs (default true) */
  showTime?: boolean;
};

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date and time",
  disabled,
  id,
  className,
  showTime = true,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const initial = parseDateTime(value);
  const [date, setDate] = React.useState<Date | undefined>(initial);
  const [hours, setHours] = React.useState(
    initial ? String(initial.getHours()).padStart(2, "0") : "09"
  );
  const [minutes, setMinutes] = React.useState(
    initial ? String(initial.getMinutes()).padStart(2, "0") : "00"
  );

  React.useEffect(() => {
    const parsed = parseDateTime(value);
    setDate(parsed);
    if (parsed) {
      setHours(String(parsed.getHours()).padStart(2, "0"));
      setMinutes(String(parsed.getMinutes()).padStart(2, "0"));
    } else {
      setHours("09");
      setMinutes("00");
    }
  }, [value]);

  const handleSelect = (d: Date | undefined) => {
    if (!d) {
      setDate(undefined);
      onChange?.(null);
      return;
    }
    const h = Math.min(23, Math.max(0, parseInt(hours, 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(minutes, 10) || 0));
    const combined = new Date(d);
    combined.setHours(h, m, 0, 0);
    setDate(combined);
    onChange?.(toLocalISOString(combined));
  };

  const handleTimeChange = () => {
    if (!date) return;
    const h = Math.min(23, Math.max(0, parseInt(hours, 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(minutes, 10) || 0));
    const combined = new Date(date);
    combined.setHours(h, m, 0, 0);
    setDate(combined);
    onChange?.(toLocalISOString(combined));
  };

  const displayValue = date
    ? showTime
      ? format(date, "PPp")
      : format(date, "PPP")
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-empty={!date}
          id={id}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          <HugeiconsIcon icon={Calendar03Icon} className="mr-2 size-4" strokeWidth={2} />
          {displayValue ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          captionLayout="dropdown"
        />
        {showTime && date && (
          <div className="flex items-center gap-2 border-t border-border p-3">
            <span className="text-sm text-muted-foreground">Time</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => {
                setHours(e.target.value);
                setTimeout(handleTimeChange, 0);
              }}
              onBlur={() => {
                const h = Math.min(23, Math.max(0, parseInt(hours, 10) || 0));
                setHours(String(h).padStart(2, "0"));
                handleTimeChange();
              }}
              className="w-14 text-center"
              aria-label="Hour"
            />
            <span className="text-muted-foreground">:</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => {
                setMinutes(e.target.value);
                setTimeout(handleTimeChange, 0);
              }}
              onBlur={() => {
                const m = Math.min(59, Math.max(0, parseInt(minutes, 10) || 0));
                setMinutes(String(m).padStart(2, "0"));
                handleTimeChange();
              }}
              className="w-14 text-center"
              aria-label="Minute"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
