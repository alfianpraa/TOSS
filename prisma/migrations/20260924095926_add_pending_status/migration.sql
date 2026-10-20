-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'STATUS_APPROVAL_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'STATUS_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'STATUS_REJECTED';

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "pendingStatus" "CardStatus";
