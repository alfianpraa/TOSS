-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LEAD_HANDOFF';

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "salesOwnerId" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateIndex
CREATE INDEX "Card_salesOwnerId_idx" ON "Card"("salesOwnerId");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_salesOwnerId_fkey" FOREIGN KEY ("salesOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: existing leads created by a Sales user are owned by that Sales.
UPDATE "Card" SET "salesOwnerId" = "createdById"
WHERE "createdById" IN (SELECT "id" FROM "User" WHERE "role" = 'SALES');
