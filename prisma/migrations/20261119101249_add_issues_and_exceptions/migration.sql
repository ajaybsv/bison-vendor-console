-- CreateTable
CREATE TABLE "issues" (
    "id" SERIAL NOT NULL,
    "vendor" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "owner" TEXT NOT NULL,
    "dueDate" TEXT,
    "exceptionJustification" TEXT,
    "exceptionStatus" TEXT,
    "riskAcceptanceRationale" TEXT,
    "riskAcceptanceExpiry" TEXT,
    "riskAcceptanceStatus" TEXT NOT NULL DEFAULT 'Not Required',
    "closureEvidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);
