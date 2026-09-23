"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActivityType, CardStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  allowedActivityTypes,
  canChangeStatus,
  canCreateCard,
  canTakeCard,
} from "@/lib/permissions";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Anda harus login.");
  return session;
}

const createCardSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  clientName: z.string().min(2, "Nama client wajib diisi"),
  clientContact: z.string().optional(),
  description: z.string().optional(),
});

export async function createCard(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  if (!canCreateCard(role)) {
    return { error: "Hanya Sales/Admin yang bisa membuat card baru." };
  }

  const parsed = createCardSchema.safeParse({
    title: formData.get("title"),
    clientName: formData.get("clientName"),
    clientContact: formData.get("clientContact") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const card = await prisma.card.create({
    data: {
      ...parsed.data,
      createdById: session.user.id,
      status: "NEW_LEAD",
    },
  });

  await prisma.activity.create({
    data: {
      cardId: card.id,
      authorId: session.user.id,
      type: "SALES_UPDATE",
      content: "Card lead baru dibuat.",
    },
  });

  revalidatePath("/board");
  return {};
}

export async function takeCard(cardId: string) {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  if (!canTakeCard(role)) {
    throw new Error("Hanya Developer/Admin yang bisa mengambil lead.");
  }

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  if (card.assignedDeveloperId) {
    throw new Error("Lead ini sudah diambil developer lain.");
  }

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: {
        assignedDeveloperId: session.user.id,
        status: "IN_PROGRESS",
      },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} mengambil lead ini dan mulai mengerjakan.`,
      },
    }),
  ]);

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
}

export async function updateCardStatus(cardId: string, status: CardStatus) {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  if (!canChangeStatus(role, session.user.id, card)) {
    throw new Error("Anda tidak punya izin mengubah status card ini.");
  }

  if (status === "IN_PROGRESS" && !card.assignedDeveloperId) {
    throw new Error("Pilih developer dulu sebelum memindahkan ke Dikerjakan.");
  }

  await prisma.$transaction([
    prisma.card.update({ where: { id: cardId }, data: { status } }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `Status diubah menjadi "${status}" oleh ${session.user.name}.`,
      },
    }),
  ]);

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
}

export async function assignDeveloperAndStart(cardId: string, developerId: string) {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  if (!canChangeStatus(role, session.user.id, card)) {
    throw new Error("Anda tidak punya izin memindahkan card ini.");
  }

  if (card.assignedDeveloperId) {
    throw new Error("Lead ini sudah punya developer.");
  }

  const developer = await prisma.user.findUnique({ where: { id: developerId } });
  if (!developer || developer.role !== "DEVELOPER") {
    throw new Error("Developer tidak valid.");
  }

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { assignedDeveloperId: developerId, status: "IN_PROGRESS" },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `${session.user.name} menugaskan ${developer.name} untuk mengerjakan lead ini.`,
      },
    }),
  ]);

  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
}

const addActivitySchema = z.object({
  content: z.string().min(2, "Isi laporan tidak boleh kosong"),
  type: z.custom<ActivityType>(),
  offerAmount: z.string().optional(),
});

export async function addActivity(
  cardId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireSession();
  const role = session.user.role as import("@prisma/client").Role;

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  const allowedTypes = allowedActivityTypes(role, session.user.id, card);

  const parsed = addActivitySchema.safeParse({
    content: formData.get("content"),
    type: formData.get("type"),
    offerAmount: formData.get("offerAmount") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  if (!allowedTypes.includes(parsed.data.type)) {
    return { error: "Anda tidak punya izin menambahkan jenis laporan ini." };
  }

  const offerAmount =
    parsed.data.type === "MARKETING_OFFER" && parsed.data.offerAmount
      ? Number(parsed.data.offerAmount)
      : undefined;

  await prisma.activity.create({
    data: {
      cardId,
      authorId: session.user.id,
      type: parsed.data.type,
      content: parsed.data.content,
      offerAmount: offerAmount !== undefined && !Number.isNaN(offerAmount) ? offerAmount : undefined,
    },
  });

  revalidatePath(`/cards/${cardId}`);
  revalidatePath("/board");
  return {};
}
