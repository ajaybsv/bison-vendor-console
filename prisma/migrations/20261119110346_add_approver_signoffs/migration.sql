-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "approverSignoffs" TEXT[] DEFAULT ARRAY[]::TEXT[];
