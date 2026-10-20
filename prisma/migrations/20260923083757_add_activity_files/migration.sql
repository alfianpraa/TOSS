-- AlterTable
ALTER TABLE "CardFile" ADD COLUMN     "activityId" TEXT;

-- CreateIndex
CREATE INDEX "CardFile_activityId_idx" ON "CardFile"("activityId");

-- AddForeignKey
ALTER TABLE "CardFile" ADD CONSTRAINT "CardFile_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
