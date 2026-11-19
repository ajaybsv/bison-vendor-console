-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "crossFunctionalConfirmations" TEXT[] DEFAULT ARRAY[]::TEXT[];
