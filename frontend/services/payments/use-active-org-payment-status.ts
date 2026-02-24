"use client";

import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "./api";

const activeOrgPaymentStatusKey = (activeOrganizationId: string) => ["payments", "active-org-status", activeOrganizationId] as const;

export function useActiveOrgPaymentStatus(activeOrganizationId: string) {
  return useQuery({
    queryKey: activeOrgPaymentStatusKey(activeOrganizationId),
    queryFn: () => paymentsApi.getActiveOrgPaymentStatus(),
  });
}
