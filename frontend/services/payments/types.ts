export type Plan = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export interface ActiveOrgPaymentStatus {
  plan: Plan;
  paidAt: string | null;
}
