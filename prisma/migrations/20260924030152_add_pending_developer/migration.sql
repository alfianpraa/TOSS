-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ASSIGNMENT_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSIGNMENT_DECLINED';

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "pendingDeveloperId" TEXT;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_pendingDeveloperId_fkey" FOREIGN KEY ("pendingDeveloperId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
