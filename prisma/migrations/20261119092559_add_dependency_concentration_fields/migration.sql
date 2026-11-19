-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "alternativeProviders" TEXT,
ADD COLUMN     "cloudProviders" TEXT,
ADD COLUMN     "dependencyReviewStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "internalDependencies" TEXT,
ADD COLUMN     "legalEntity" TEXT,
ADD COLUMN     "parentGroup" TEXT,
ADD COLUMN     "subcontractors" TEXT;
