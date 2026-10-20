"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveCardFile } from "@/lib/storage";

export async function uploadCardFile(
  cardId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "You must be logged in." };

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) return { error: "Card not found." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select a file to upload." };
  }

  try {
    await saveCardFile({ cardId, uploadedById: session.user.id, file });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload file." };
  }

  revalidatePath(`/cards/${cardId}`);
  return {};
}

export async function deleteCardFile(fileId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("You must be logged in.");

  const file = await prisma.cardFile.findUniqueOrThrow({ where: { id: fileId } });

  const isOwner = file.uploadedById === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    throw new Error("You don't have permission to delete this file.");
  }

  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "cards",
    file.cardId,
    file.storedName
  );
  await unlink(filePath).catch(() => {});

  await prisma.cardFile.delete({ where: { id: fileId } });

  revalidatePath(`/cards/${file.cardId}`);
}
