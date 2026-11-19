-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "materialityCustomerPct" TEXT,
ADD COLUMN     "materialityDisruptionHours" TEXT,
ADD COLUMN     "materialityFinancialImpact" TEXT;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "customersAffectedPct" TEXT,
ADD COLUMN     "disruptionToleranceHours" TEXT,
ADD COLUMN     "financialImpactEstimate" TEXT;
