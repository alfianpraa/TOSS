-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'REPLY';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_REPLY';

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Activity_parentId_idx" ON "Activity"("parentId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
