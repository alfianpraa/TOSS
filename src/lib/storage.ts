import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { MAX_CARD_FILE_BYTES, ALLOWED_CARD_FILE_MIME } from "@/lib/fileLimits";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_ ]/g, "").slice(-150) || "file";
}

export async function saveCardFile({
  cardId,
  activityId,
  uploadedById,
  file,
}: {
  cardId: string;
  activityId?: string;
  uploadedById: string;
  file: File;
}) {
  if (!ALLOWED_CARD_FILE_MIME.has(file.type)) {
    throw new Error("Unsupported file type.");
  }

  if (file.size > MAX_CARD_FILE_BYTES) {
    throw new Error("File size must be at most 15MB.");
  }

  const safeName = sanitizeFilename(file.name);
  const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "cards", cardId);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, storedName), buffer);

  return prisma.cardFile.create({
    data: {
      cardId,
      activityId,
      uploadedById,
      filename: file.name,
      storedName,
      mimeType: file.type,
      size: file.size,
    },
  });
}
