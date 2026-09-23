"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Hanya Admin yang bisa melakukan aksi ini.");
  }
  return session;
}

const userSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  role: z.enum(["ADMIN", "SALES", "DEVELOPER", "MARKETING"]),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
});

export async function adminUpdateUser(
  userId: string,
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    employeeId: formData.get("employeeId") || undefined,
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: userId } },
  });
  if (emailTaken) {
    return { error: "Email sudah dipakai user lain." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
  });

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");
  return { success: true };
}

const cardSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  clientName: z.string().min(2, "Nama client wajib diisi"),
  clientContact: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["NEW_LEAD", "IN_PROGRESS", "DONE", "CANCELLED"]),
  assignedDeveloperId: z.string().optional(),
});

export async function adminUpdateCard(
  cardId: string,
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAdmin();

  const parsed = cardSchema.safeParse({
    title: formData.get("title"),
    clientName: formData.get("clientName"),
    clientContact: formData.get("clientContact") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    assignedDeveloperId: formData.get("assignedDeveloperId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { assignedDeveloperId, ...rest } = parsed.data;

  if (assignedDeveloperId) {
    const dev = await prisma.user.findUnique({ where: { id: assignedDeveloperId } });
    if (!dev || dev.role !== "DEVELOPER") {
      return { error: "Developer tidak valid." };
    }
  }

  if (parsed.data.status === "IN_PROGRESS" && !assignedDeveloperId) {
    return { error: "Pilih developer sebelum set status Dikerjakan." };
  }

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { ...rest, assignedDeveloperId: assignedDeveloperId ?? null },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `Data card diperbarui oleh Admin (${session.user.name}).`,
      },
    }),
  ]);

  revalidatePath("/admin/cards");
  revalidatePath("/board");
  revalidatePath(`/cards/${cardId}`);
  return { success: true };
}

export async function adminDeleteCard(cardId: string) {
  await requireAdmin();
  await prisma.card.delete({ where: { id: cardId } });
  revalidatePath("/admin/cards");
  revalidatePath("/board");
}
