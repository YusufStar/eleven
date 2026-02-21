/**
 * Product copy and feature set — single source of truth for the CRM.
 * "A modern CRM built for small and growing teams. Clean interface, fast to set up, no bloat."
 */

export const PRODUCT = {
  tagline: "A modern CRM built for small and growing teams.",
  description:
    "Manage your contacts, track deals through a visual pipeline, and keep your entire team aligned — all in one place. Invite teammates, assign leads, and never lose track of a sales opportunity again.",
  pitch: "Clean interface, fast to set up, no bloat.",
} as const;

/** Sidebar / app structure — mirrors nav and clarifies scope. */
export const FEATURES = [
  { area: "Dashboard", items: ["Overview", "Metrics"] },
  { area: "Contacts", items: ["People", "Companies"] },
  { area: "Pipeline", items: ["Deal board", "All deals", "Stages"] },
  { area: "Team", items: ["Members", "Invite"] },
  { area: "Activities", items: ["Tasks", "Calendar", "Log"] },
  { area: "Reports", items: ["Sales analytics", "Win / Loss", "Pipeline report"] },
  { area: "Settings", items: ["Organization", "Profile", "Plan", "Integrations"] },
  { area: "Billing", items: ["Invoices", "Upgrade plan", "Payment method"] },
] as const;

export const PLAN_NAMES = {
  STARTER: "Free",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
} as const;
