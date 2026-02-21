"use client";

import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "./api";

const activeOrgPaymentStatusKey = ["payments", "active-org-status"] as const;

export function useActiveOrgPaymentStatus() {
  return useQuery({
    queryKey: activeOrgPaymentStatusKey,
    queryFn: () => paymentsApi.getActiveOrgPaymentStatus(),
  });
}
