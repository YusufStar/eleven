export type Plan = "FREE" | "PROFESSIONAL";

export interface ActiveOrgPaymentStatus {
  plan: Plan;
  paidAt: string | null;
}
