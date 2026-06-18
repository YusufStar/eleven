"use client";

import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface DateTimePickerProps {
  value?: Date | null;
  onChange: (date: Date | null | undefined) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  use24HourFormat?: boolean;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  id,
  label,
  placeholder = "Pick date and time",
  error,
  use24HourFormat = true,
  disabled = false,
}: DateTimePickerProps) {
  const date = value ?? undefined;

  function handleDateSelect(selected: Date | undefined) {
    onChange(selected ?? null);
  }

  function handleTimeChange(type: "hour" | "minute" | "ampm", val: string) {
    const current = date ?? new Date();
    const next = new Date(current);
    if (type === "hour") {
      next.setHours(parseInt(val, 10));
    } else if (type === "minute") {
      next.setMinutes(parseInt(val, 10));
    } else if (type === "ampm") {
      const hours = next.getHours();
      if (val === "AM" && hours >= 12) next.setHours(hours - 12);
      else if (val === "PM" && hours < 12) next.setHours(hours + 12);
    }
    onChange(next);
  }

  return (
    <Field>
      {label && (
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      )}
      <Popover modal>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full pl-3 text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            {date
              ? format(
                  date,
                  use24HourFormat ? "MM/dd/yyyy HH:mm" : "MM/dd/yyyy hh:mm a",
                )
              : placeholder}
            <HugeiconsIcon icon={Calendar03Icon} className="ml-auto size-4 opacity-50" strokeWidth={2} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              autoFocus
            />
            <div className="flex flex-col divide-y sm:flex-row sm:h-[300px] sm:divide-y-0 sm:divide-x">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex p-2 sm:flex-col">
                  {Array.from(
                    { length: use24HourFormat ? 24 : 12 },
                    (_, i) => i,
                  ).map((hour) => (
                    <Button
                      key={hour}
                      type="button"
                      size="icon"
                      variant={
                        date &&
                        date.getHours() % (use24HourFormat ? 24 : 12) ===
                          hour % (use24HourFormat ? 24 : 12)
                          ? "default"
                          : "ghost"
                      }
                      className="shrink-0 aspect-square sm:w-full"
                      onClick={() => handleTimeChange("hour", String(hour))}
                    >
                      {String(hour).padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex p-2 sm:flex-col">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      type="button"
                      size="icon"
                      variant={
                        date && date.getMinutes() === minute ? "default" : "ghost"
                      }
                      className="shrink-0 aspect-square sm:w-full"
                      onClick={() =>
                        handleTimeChange("minute", String(minute))
                      }
                    >
                      {String(minute).padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
