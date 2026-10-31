-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "memberId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_resets_memberId_idx" ON "password_resets"("memberId");

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
