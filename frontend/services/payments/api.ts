import type { ActiveOrgPaymentStatus } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers as HeadersInit) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const paymentsApi = {
  getActiveOrgPaymentStatus: () =>
    request<ActiveOrgPaymentStatus>("/payments/active-org-status"),
  createCheckoutSession: (organizationId: string) =>
    request<{ url: string }>("/payments/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ organizationId }),
    }),
};
