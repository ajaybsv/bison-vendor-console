-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "approvalBoardTrigger" TEXT,
ADD COLUMN     "approvalCeoTrigger" TEXT,
ADD COLUMN     "tierConcentrationTrigger" TEXT,
ADD COLUMN     "tierLimitedAlternativesTrigger" TEXT;
