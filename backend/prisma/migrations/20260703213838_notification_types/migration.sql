-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TASK_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'DEAL_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'CONTACT_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_FILE_ADDED';
