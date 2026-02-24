/*
  Warnings:

  - The values [FREE,PROFESSIONAL] on the enum `Plan` will be removed. If these variants are still used in the database, this will fail.

*/
-- Map existing STARTER/ENTERPRISE to new enum values before altering type
UPDATE "organization" SET "plan" = 'FREE' WHERE "plan" = 'FREE';
UPDATE "organization" SET "plan" = 'PROFESSIONAL' WHERE "plan" = 'PROFESSIONAL';

-- AlterEnum
BEGIN;
CREATE TYPE "Plan_new" AS ENUM ('FREE', 'PROFESSIONAL');
ALTER TABLE "public"."organization" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "organization" ALTER COLUMN "plan" TYPE "Plan_new" USING ("plan"::text::"Plan_new");
ALTER TYPE "Plan" RENAME TO "Plan_old";
ALTER TYPE "Plan_new" RENAME TO "Plan";
DROP TYPE "public"."Plan_old";
ALTER TABLE "organization" ALTER COLUMN "plan" SET DEFAULT 'FREE';
COMMIT;
