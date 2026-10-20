-- CreateTable
CREATE TABLE "CardFile" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardFile_cardId_idx" ON "CardFile"("cardId");

-- AddForeignKey
ALTER TABLE "CardFile" ADD CONSTRAINT "CardFile_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardFile" ADD CONSTRAINT "CardFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
