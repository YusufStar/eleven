-- Product pivot: CRM data is intentionally dropped.
-- Remove rows that use enum values deleted below, before the enum types are recreated.
DELETE FROM "notifications" WHERE "type" IN ('DEAL_STAGE_CHANGED', 'DEAL_WON', 'DEAL_ASSIGNED', 'CONTACT_ASSIGNED', 'CONTACTS_IMPORTED');
DELETE FROM "activities" WHERE "entityType" IN ('CONTACT', 'DEAL', 'PIPELINE', 'STAGE');

-- CreateEnum
CREATE TYPE "AiReportKind" AS ENUM ('MINI', 'MEDIUM', 'HIGH');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'COMMENT';
ALTER TYPE "ActivityAction" ADD VALUE 'ASSIGN';
ALTER TYPE "ActivityAction" ADD VALUE 'COMPLETE';
ALTER TYPE "ActivityAction" ADD VALUE 'MENTION';

-- AlterEnum
BEGIN;
CREATE TYPE "ActivityEntityType_new" AS ENUM ('PROJECT', 'TASK', 'SPRINT', 'MILESTONE', 'PROJECT_FILE', 'TASK_ATTACHMENT', 'PROJECT_MEMBER', 'MESSAGE', 'MEETING', 'MEMBER', 'AI_REPORT');
ALTER TABLE "activities" ALTER COLUMN "entityType" TYPE "ActivityEntityType_new" USING ("entityType"::text::"ActivityEntityType_new");
ALTER TYPE "ActivityEntityType" RENAME TO "ActivityEntityType_old";
ALTER TYPE "ActivityEntityType_new" RENAME TO "ActivityEntityType";
DROP TYPE "public"."ActivityEntityType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_COMMENT', 'MENTION', 'PROJECT_MEMBER_ADDED', 'PROJECT_FILE_ADDED', 'MEETING_INVITED', 'SPRINT_STARTED', 'GENERIC');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskStatus" ADD VALUE 'IN_REVIEW';
ALTER TYPE "TaskStatus" ADD VALUE 'BLOCKED';

-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_companyId_fkey";

-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_contactId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_pipelineId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_stageId_fkey";

-- DropForeignKey
ALTER TABLE "pipelines" DROP CONSTRAINT "pipelines_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "stages" DROP CONSTRAINT "stages_pipelineId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_contactId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_dealId_fkey";

-- AlterTable
ALTER TABLE "member" ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "statusEmoji" TEXT,
ADD COLUMN     "statusText" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "workingOn" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "mentionUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pinnedAt" TIMESTAMP(3),
ADD COLUMN     "replyToId" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'system',
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "snoozedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "project_files" ADD COLUMN     "folder" TEXT NOT NULL DEFAULT '/',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "versionHistory" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "contactId",
DROP COLUMN "dealId",
ADD COLUMN     "estimate" INTEGER,
ADD COLUMN     "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "milestoneId" TEXT,
ADD COLUMN     "sprintId" TEXT,
ADD COLUMN     "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "contacts";

-- DropTable
DROP TABLE "deals";

-- DropTable
DROP TABLE "pipelines";

-- DropTable
DROP TABLE "stages";

-- DropEnum
DROP TYPE "ContactSource";

-- DropEnum
DROP TYPE "ContactStatus";

-- DropEnum
DROP TYPE "ContactType";

-- DropEnum
DROP TYPE "DealStatus";

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_watchers" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_watchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_reads" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "categories" JSONB NOT NULL DEFAULT '{}',
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "digest" TEXT NOT NULL DEFAULT 'off',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" "AiReportKind" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "model" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sprints_organizationId_idx" ON "sprints"("organizationId");

-- CreateIndex
CREATE INDEX "sprints_organizationId_startsAt_idx" ON "sprints"("organizationId", "startsAt");

-- CreateIndex
CREATE INDEX "milestones_projectId_idx" ON "milestones"("projectId");

-- CreateIndex
CREATE INDEX "task_comments_taskId_idx" ON "task_comments"("taskId");

-- CreateIndex
CREATE INDEX "task_watchers_memberId_idx" ON "task_watchers"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "task_watchers_taskId_memberId_key" ON "task_watchers"("taskId", "memberId");

-- CreateIndex
CREATE INDEX "task_dependencies_dependsOnId_idx" ON "task_dependencies"("dependsOnId");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_taskId_dependsOnId_key" ON "task_dependencies"("taskId", "dependsOnId");

-- CreateIndex
CREATE INDEX "time_entries_taskId_idx" ON "time_entries"("taskId");

-- CreateIndex
CREATE INDEX "time_entries_memberId_idx" ON "time_entries"("memberId");

-- CreateIndex
CREATE INDEX "message_reactions_messageId_idx" ON "message_reactions"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_emoji_key" ON "message_reactions"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "chat_reads_userId_idx" ON "chat_reads"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_reads_chatId_userId_key" ON "chat_reads"("chatId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_memberId_key" ON "notification_preferences"("memberId");

-- CreateIndex
CREATE INDEX "ai_reports_organizationId_kind_createdAt_idx" ON "ai_reports"("organizationId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "messages_chatId_pinnedAt_idx" ON "messages"("chatId", "pinnedAt");

-- CreateIndex
CREATE INDEX "messages_replyToId_idx" ON "messages"("replyToId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_archivedAt_idx" ON "notifications"("recipientId", "archivedAt");

-- CreateIndex
CREATE INDEX "project_files_projectId_folder_idx" ON "project_files"("projectId", "folder");

-- CreateIndex
CREATE INDEX "tasks_organizationId_sprintId_idx" ON "tasks"("organizationId", "sprintId");

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_watchers" ADD CONSTRAINT "task_watchers_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_watchers" ADD CONSTRAINT "task_watchers_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
