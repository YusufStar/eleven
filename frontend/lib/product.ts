/**
 * Product copy and feature set — single source of truth for the work platform.
 */

export const PRODUCT = {
  tagline: "The work platform for software teams.",
  description:
    "Tasks, sprints, projects, chat, files, and AI reports in one fast workspace. Plan the work, build it together, and ship it — without juggling four separate tools.",
  pitch: "Slack + Jira + Linear + Notion, without the tab sprawl.",
} as const;

/** Sidebar / app structure — mirrors nav and clarifies scope. */
export const FEATURES = [
  { area: "Dashboard", items: ["Today's focus", "Presence", "Activity"] },
  { area: "Tasks", items: ["Board", "List", "Subtasks", "Time tracking"] },
  { area: "Sprints", items: ["Milestones", "Burndown", "Velocity"] },
  { area: "Projects", items: ["Progress", "Health", "Files"] },
  { area: "Chat & Meet", items: ["Threads", "Reactions", "Calls"] },
  { area: "Analytics", items: ["Metrics", "AI reports"] },
  { area: "Team", items: ["Members", "Skills", "Invite"] },
  { area: "Settings", items: ["Organization", "Profile", "Plan", "Notifications"] },
] as const;

export const PLAN_NAMES = {
  FREE: "Free",
  PROFESSIONAL: "Professional",
} as const;
