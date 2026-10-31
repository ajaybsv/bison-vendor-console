-- CreateTable
CREATE TABLE "organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "regNo" TEXT,
    "vendorType" TEXT,
    "tech" TEXT,
    "primaryContact" TEXT,
    "address" TEXT,
    "notifReminders" BOOLEAN NOT NULL DEFAULT true,
    "notifDigest" BOOLEAN NOT NULL DEFAULT true,
    "notifExpiry" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Viewer',
    "status" TEXT NOT NULL DEFAULT 'Invited',
    "passwordHash" TEXT,
    "inviteToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "memberId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_requests" (
    "id" SERIAL NOT NULL,
    "client" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "frameworks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "due" TEXT,
    "contact" TEXT,
    "qDone" INTEGER NOT NULL DEFAULT 0,
    "qTotal" INTEGER NOT NULL DEFAULT 0,
    "evDone" INTEGER NOT NULL DEFAULT 0,
    "evTotal" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'In progress',
    "reqEvidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_answers" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "workspace_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "history" (
    "id" SERIAL NOT NULL,
    "client" TEXT NOT NULL,
    "completedOn" TEXT NOT NULL,
    "frameworks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "compliance" INTEGER NOT NULL,

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_answers" (
    "id" SERIAL NOT NULL,
    "control" TEXT NOT NULL,
    "q" TEXT NOT NULL,
    "a" TEXT NOT NULL,
    "updated" TEXT,
    "used" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uploaded" TEXT,
    "expiry" TEXT,
    "freshness" TEXT NOT NULL DEFAULT 'fresh',
    "usedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "control" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inTrustPack" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "sourceAnswerId" INTEGER,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "servicesDescription" TEXT,
    "contactName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "contactPhone" TEXT,
    "owner" TEXT NOT NULL,
    "criticality" TEXT NOT NULL,
    "dataSensitivity" TEXT NOT NULL,
    "frameworks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "country" TEXT,
    "contractStart" TEXT,
    "cadence" TEXT NOT NULL,
    "nextReview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_requests" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "vendorName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Awaiting response',
    "cadence" TEXT,
    "controlsSent" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qDone" INTEGER NOT NULL DEFAULT 0,
    "qTotal" INTEGER NOT NULL DEFAULT 0,
    "evidenceRequested" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evDone" INTEGER NOT NULL DEFAULT 0,
    "evTotal" INTEGER NOT NULL DEFAULT 0,
    "sentOn" TEXT NOT NULL,
    "due" TEXT,
    "completedOn" TEXT,

    CONSTRAINT "vendor_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_responses" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vendor_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_request_evidence" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "fileName" TEXT,
    "receivedOn" TEXT,

    CONSTRAINT "vendor_request_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_members_email_key" ON "team_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_inviteToken_key" ON "team_members"("inviteToken");

-- CreateIndex
CREATE INDEX "sessions_memberId_idx" ON "sessions"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_answers_requestId_questionId_key" ON "workspace_answers"("requestId", "questionId");

-- CreateIndex
CREATE INDEX "vendor_requests_vendorId_idx" ON "vendor_requests"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_responses_requestId_questionId_key" ON "vendor_responses"("requestId", "questionId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_answers" ADD CONSTRAINT "workspace_answers_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "client_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_requests" ADD CONSTRAINT "vendor_requests_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_responses" ADD CONSTRAINT "vendor_responses_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "vendor_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_request_evidence" ADD CONSTRAINT "vendor_request_evidence_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "vendor_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
