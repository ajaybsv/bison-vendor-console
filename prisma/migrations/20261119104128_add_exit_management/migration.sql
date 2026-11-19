-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "dataReturnStatus" TEXT,
ADD COLUMN     "exitClosureEvidence" TEXT,
ADD COLUMN     "exitPlanStatus" TEXT NOT NULL DEFAULT 'Not Required',
ADD COLUMN     "exitTransitionDate" TEXT;
