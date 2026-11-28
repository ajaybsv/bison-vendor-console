-- CreateTable
CREATE TABLE IF NOT EXISTS "incidents" (
    "id" SERIAL NOT NULL,
    "vendor" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL,
    "slaBreached" TEXT NOT NULL DEFAULT 'No',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "owner" TEXT NOT NULL,
    "startedAt" TEXT,
    "resolvedAt" TEXT,
    "impactDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);
