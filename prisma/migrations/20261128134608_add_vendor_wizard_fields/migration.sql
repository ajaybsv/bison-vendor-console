
-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "brandName" TEXT,
ADD COLUMN     "businessFunction" TEXT,
ADD COLUMN     "connectsToSystems" TEXT,
ADD COLUMN     "contractEndDate" TEXT,
ADD COLUMN     "contractValue" TEXT,
ADD COLUMN     "customerFacing" TEXT,
ADD COLUMN     "customerImpactDescription" TEXT,
ADD COLUMN     "dataCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "dataHandlingActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "handlesCustomerData" TEXT,
ADD COLUMN     "knownRegulatoryRequirement" TEXT,
ADD COLUMN     "mainPurpose" TEXT,
ADD COLUMN     "operatesCrossBorder" TEXT,
ADD COLUMN     "processesOnBehalf" TEXT,
ADD COLUMN     "providesHostingOrSoftware" TEXT,
ADD COLUMN     "providesSecurityMonitoring" TEXT,
ADD COLUMN     "regulatoryCoreNeed" TEXT,
ADD COLUMN     "replacementCostEstimate" TEXT,
ADD COLUMN     "replacementTimeMonths" TEXT,
ADD COLUMN     "supportsCustomerJourney" TEXT,
ADD COLUMN     "usesSubcontractor" TEXT;

