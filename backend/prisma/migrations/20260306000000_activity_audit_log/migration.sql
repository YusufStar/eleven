-- Drop old activities table and enum (audit log redesign)
DROP TABLE IF EXISTS "activities";
DROP TYPE IF EXISTS "ActivityType";

-- Create new enums
CREATE TYPE "ActivityAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW');
CREATE TYPE "ActivityEntityType" AS ENUM ('CONTACT', 'DEAL', 'PROJECT', 'TASK', 'PIPELINE', 'STAGE', 'PROJECT_FILE', 'TASK_ATTACHMENT', 'PROJECT_MEMBER');

-- Create new activities (audit log) table
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityTitle" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activities_organizationId_idx" ON "activities"("organizationId");
CREATE INDEX "activities_organizationId_action_idx" ON "activities"("organizationId", "action");
CREATE INDEX "activities_organizationId_entityType_idx" ON "activities"("organizationId", "entityType");
CREATE INDEX "activities_organizationId_memberId_idx" ON "activities"("organizationId", "memberId");
CREATE INDEX "activities_organizationId_entityId_idx" ON "activities"("organizationId", "entityId");
CREATE INDEX "activities_organizationId_createdAt_idx" ON "activities"("organizationId", "createdAt");
CREATE INDEX "activities_organizationId_entityTitle_idx" ON "activities"("organizationId", "entityTitle");

ALTER TABLE "activities" ADD CONSTRAINT "activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
