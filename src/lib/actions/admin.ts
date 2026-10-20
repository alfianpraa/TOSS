"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notify";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Only Admins can perform this action.");
  }
  return session;
}

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: userId } },
  });
  if (emailTaken) {
    return { error: "Email is already in use by another user." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { ...parsed.data, pendingRole: null },
  });

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function approveRoleChange(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.pendingRole) {
    throw new Error("This user has no pending role change.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: user.pendingRole, pendingRole: null },
  });

  await createNotification({
    userId: user.id,
    type: "ROLE_CHANGE_APPROVED",
    message: `Your role change to ${user.pendingRole} has been approved.`,
  });

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");
}

export async function rejectRoleChange(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.pendingRole) {
    throw new Error("This user has no pending role change.");
  }

  const requestedRole = user.pendingRole;

  await prisma.user.update({
    where: { id: userId },
    data: { pendingRole: null },
  });

  await createNotification({
    userId: user.id,
    type: "ROLE_CHANGE_REJECTED",
    message: `Your role change request to ${requestedRole} was rejected.`,
  });

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");
}

const cardSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  clientName: z.string().min(2, "Client name is required"),
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const { assignedDeveloperId, ...rest } = parsed.data;

  if (assignedDeveloperId) {
    const dev = await prisma.user.findUnique({ where: { id: assignedDeveloperId } });
    if (!dev || dev.role !== "DEVELOPER") {
      return { error: "Invalid developer." };
    }
  }

  if (parsed.data.status === "IN_PROGRESS" && !assignedDeveloperId) {
    return { error: "Pick a developer before setting status to In Progress." };
  }

  const existingCard = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { ...rest, assignedDeveloperId: assignedDeveloperId ?? null, pendingDeveloperId: null, pendingStatus: null },
    }),
    prisma.activity.create({
      data: {
        cardId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        content: `Card data updated by Admin (${session.user.name}).`,
      },
    }),
  ]);

  if (assignedDeveloperId && assignedDeveloperId !== existingCard.assignedDeveloperId) {
    await createNotification({
      userId: assignedDeveloperId,
      type: "LEAD_ASSIGNED",
      message: `${session.user.name} assigned you to lead "${rest.title}".`,
      cardId,
    });
  }

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
