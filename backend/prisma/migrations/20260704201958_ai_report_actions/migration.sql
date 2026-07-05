-- CreateEnum
CREATE TYPE "AiReportActionType" AS ENUM ('CREATE_TASK', 'UPDATE_TASK_STATUS', 'UPDATE_TASK_PRIORITY', 'REASSIGN_TASK', 'ADD_TASK_COMMENT');

-- CreateEnum
CREATE TYPE "AiReportActionStatus" AS ENUM ('PENDING', 'APPLIED', 'DISMISSED', 'FAILED');

-- AlterTable
ALTER TABLE "project_files" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ai_report_actions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "AiReportActionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "AiReportActionStatus" NOT NULL DEFAULT 'PENDING',
    "resultMessage" TEXT,
    "appliedAt" TIMESTAMP(3),
    "appliedByMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_report_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_report_actions_reportId_status_idx" ON "ai_report_actions"("reportId", "status");

-- CreateIndex
CREATE INDEX "ai_report_actions_organizationId_idx" ON "ai_report_actions"("organizationId");

-- AddForeignKey
ALTER TABLE "ai_report_actions" ADD CONSTRAINT "ai_report_actions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ai_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_report_actions" ADD CONSTRAINT "ai_report_actions_appliedByMemberId_fkey" FOREIGN KEY ("appliedByMemberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
