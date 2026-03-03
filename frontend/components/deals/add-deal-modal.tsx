"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateDeal,
  usePipelines,
} from "@/services/deals";
import { useContactsPeopleList } from "@/services/contacts";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  value: z.string().optional(),
  currency: z.string().optional(),
  stageId: z.string().optional(),
  contactId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export type AddDealModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStageId?: string;
};

export function AddDealModal({ open, onOpenChange, defaultStageId }: AddDealModalProps) {
  const createDeal = useCreateDeal();
  const { data: pipelinesRes } = usePipelines();
  const pipeline = pipelinesRes?.data?.[0] ?? null;
  const stages = pipeline?.stages ?? [];
  const firstStageId = stages[0]?.id;

  const { data: contactsRes } = useContactsPeopleList({
    page: 1,
    pageSize: 100,
  });
  const contacts = contactsRes?.data ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      value: "",
      currency: "USD",
      stageId: defaultStageId ?? firstStageId ?? "",
      contactId: null,
    },
  });

  const stageId = watch("stageId");
  const contactId = watch("contactId");

  const onSubmit = (data: FormValues) => {
    const valueNum = data.value ? parseFloat(data.value) : undefined;
    if (data.value && (valueNum == null || Number.isNaN(valueNum) || valueNum < 0)) {
      toast.error("Value must be a positive number");
      return;
    }
    createDeal.mutate(
      {
        title: data.title.trim(),
        value: valueNum,
        currency: data.currency || "USD",
        stageId: data.stageId || undefined,
        pipelineId: pipeline?.id,
        contactId: data.contactId || null,
      },
      {
        onSuccess: () => {
          toast.success("Deal created");
          reset();
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message ?? "Failed to create deal"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add deal</DialogTitle>
          <DialogDescription>Create a new deal in your pipeline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <FieldLabel>Title *</FieldLabel>
            <Input {...register("title")} placeholder="Deal title" />
            <FieldError>{errors.title?.message}</FieldError>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Value</FieldLabel>
            <div className="flex gap-2">
              <Input {...register("value")} type="number" min={0} step="any" placeholder="0" />
              <Select
                value={watch("currency") || "USD"}
                onValueChange={(v) => setValue("currency", v)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FieldGroup>
          {stages.length > 0 && (
            <FieldGroup>
              <FieldLabel>Stage</FieldLabel>
              <Select
                value={stageId || "all"}
                onValueChange={(v) => setValue("stageId", v === "all" ? firstStageId ?? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
          <FieldGroup>
            <FieldLabel>Contact</FieldLabel>
            <Select
              value={contactId ?? "none"}
              onValueChange={(v) => setValue("contactId", v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No contact</SelectItem>
                {contacts.map((c) => {
                  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || c.companyName || c.email || c.id;
                  return (
                    <SelectItem key={c.id} value={c.id}>{name}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDeal.isPending}>
              {createDeal.isPending ? <Spinner className="size-4" /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
