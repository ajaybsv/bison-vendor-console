-- AlterTable
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "defaultReviewFrequency" TEXT;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "isRbiRegulatedEntity" TEXT;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "nbfcLayer" TEXT;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "organisationType" TEXT;
