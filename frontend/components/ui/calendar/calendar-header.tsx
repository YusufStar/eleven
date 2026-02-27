"use client";

import { motion } from "framer-motion";
import {
  CalendarRange,
  Columns,
  Grid2X2,
  Grid3X3,
  LayoutList,
  List,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  slideFromLeft,
  slideFromRight,
  transition,
} from "@/components/ui/calendar/animations";
import { useCalendar } from "@/components/ui/calendar/calendar-context";
import { AddEditEventDialog } from "@/components/ui/calendar/add-edit-event-dialog";
import { DateNavigator } from "@/components/ui/calendar/date-navigator";
import FilterEvents from "@/components/ui/calendar/filter";
import { TodayButton } from "@/components/ui/calendar/today-button";
import { UserSelect } from "@/components/ui/calendar/user-select";
import { Settings } from "@/components/ui/calendar/settings";
import Views from "./view-tabs";

export function CalendarHeader() {
  const { view, events } = useCalendar();

  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <motion.div
        className="flex items-center gap-3"
        variants={slideFromLeft}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </motion.div>

      <motion.div
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-1.5"
        variants={slideFromRight}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <div className="options flex-wrap flex items-center gap-4 md:gap-2">
          <FilterEvents />
          <Views />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-1.5">
          <UserSelect />

          <AddEditEventDialog>
            <Button>
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </AddEditEventDialog>
        </div>
        <Settings />
      </motion.div>
    </div>
  );
}
