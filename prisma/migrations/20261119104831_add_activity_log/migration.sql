-- CreateTable
CREATE TABLE "activity_log" (
    "id" SERIAL NOT NULL,
    "entity" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "user" TEXT NOT NULL,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_log_entity_ts_idx" ON "activity_log"("entity", "ts");
