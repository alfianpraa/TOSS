-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'DEADLINE_APPROACHING';

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE INDEX "Card_dueDate_idx" ON "Card"("dueDate");
