-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "pendingSalesId" TEXT;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_pendingSalesId_fkey" FOREIGN KEY ("pendingSalesId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
