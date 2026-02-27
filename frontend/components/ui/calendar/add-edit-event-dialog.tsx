import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, format, set } from "date-fns";
import { type ReactNode, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COLORS } from "@/components/ui/calendar/constants";
import { useCalendar } from "@/components/ui/calendar/calendar-context";
import { useDisclosure } from "@/components/ui/calendar/hooks";
import type { IEvent } from "@/components/ui/calendar/interfaces";
import { eventSchema, type TEventFormData } from "@/components/ui/calendar/schemas";

interface IProps {
  children: ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
  event?: IEvent;
}

export function AddEditEventDialog({
  children,
  startDate,
  startTime,
  event,
}: IProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const { addEvent, updateEvent, use24HourFormat } = useCalendar();
  const isEditing = !!event;

  const initialDates = useMemo(() => {
    if (!isEditing && !event) {
      if (!startDate) {
        const now = new Date();
        return { startDate: now, endDate: addMinutes(now, 30) };
      }
      const start = startTime
        ? set(new Date(startDate), {
          hours: startTime.hour,
          minutes: startTime.minute,
          seconds: 0,
        })
        : new Date(startDate);
      const end = addMinutes(start, 30);
      return { startDate: start, endDate: end };
    }

    return {
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
    };
  }, [startDate, startTime, event, isEditing]);

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      startDate: initialDates.startDate,
      endDate: initialDates.endDate,
      color: event?.color ?? "blue",
    },
  });

  useEffect(() => {
    form.reset({
      title: event?.title ?? "",
      description: event?.description ?? "",
      startDate: initialDates.startDate,
      endDate: initialDates.endDate,
      color: event?.color ?? "blue",
    });
  }, [event, initialDates, form]);

  const onSubmit = (values: TEventFormData) => {
    try {
      const formattedEvent: IEvent = {
        ...values,
        startDate: format(values.startDate, "yyyy-MM-dd'T'HH:mm:ss"),
        endDate: format(values.endDate, "yyyy-MM-dd'T'HH:mm:ss"),
        id: isEditing ? event.id : Math.floor(Math.random() * 1000000),
        user: isEditing
          ? event.user
          : {
            id: Math.floor(Math.random() * 1000000).toString(),
            name: "Jeraidi Yassir",
            picturePath: null,
          },
        color: values.color,
      };

      if (isEditing) {
        updateEvent(formattedEvent);
        toast.success("Event updated successfully");
      } else {
        addEvent(formattedEvent);
        toast.success("Event created successfully");
      }

      onClose();
      form.reset();
    } catch (error) {
      console.error(`Error ${isEditing ? "editing" : "adding"} event:`, error);
      toast.error(`Failed to ${isEditing ? "edit" : "add"} event`);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onToggle} modal={false}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{isEditing ? "Edit Event" : "Add New Event"}</ModalTitle>
          <ModalDescription>
            {isEditing
              ? "Modify your existing event."
              : "Create a new event for your calendar."}
          </ModalDescription>
        </ModalHeader>

        <form
          id="event-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="event-title">Title</FieldLabel>
              <Input
                id="event-title"
                placeholder="Enter a title"
                {...form.register("title")}
              />
              <FieldError>{form.formState.errors.title?.message}</FieldError>
            </Field>
            <Controller
              control={form.control}
              name="startDate"
              render={({ field, fieldState }) => (
                <DateTimePicker
                  label="Start Date"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  use24HourFormat={use24HourFormat}
                />
              )}
            />
            <Controller
              control={form.control}
              name="endDate"
              render={({ field, fieldState }) => (
                <DateTimePicker
                  label="End Date"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  use24HourFormat={use24HourFormat}
                />
              )}
            />
            <Field>
              <FieldLabel>Variant</FieldLabel>
              <Controller
                control={form.control}
                name="color"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS.map((color) => (
                        <SelectItem value={color} key={color}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`size-3.5 rounded-full bg-${color}-600 dark:bg-${color}-700`}
                            />
                            {color}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{form.formState.errors.color?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="event-description">Description</FieldLabel>
              <Textarea
                id="event-description"
                placeholder="Enter a description"
                {...form.register("description")}
              />
              <FieldError>
                {form.formState.errors.description?.message}
              </FieldError>
            </Field>
          </FieldGroup>
        </form>
        <ModalFooter className="flex justify-end gap-2">
          <ModalClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </ModalClose>
          <Button form="event-form" type="submit">
            {isEditing ? "Save Changes" : "Create Event"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
