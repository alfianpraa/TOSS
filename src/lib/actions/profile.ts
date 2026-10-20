"use server";

import { revalidatePath } from "next/cache";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { allowedRolesFor } from "@/lib/permissions";
import { createNotification } from "@/lib/notify";

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "SALES", "DEVELOPER", "MARKETING"]),
});

export async function updateProfile(
  _prevState: { error?: string; success?: boolean; roleChangeRequested?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean; roleChangeRequested?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "You must be logged in." };

  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    employeeId: formData.get("employeeId") || undefined,
    phone: formData.get("phone") || undefined,
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const allowedRoles = allowedRolesFor(currentUser.role);
  if (!allowedRoles.includes(parsed.data.role)) {
    return { error: "You don't have permission to select that role." };
  }

  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar");

  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!(avatarFile.type in ALLOWED_MIME)) {
      return { error: "Photo format must be JPG, PNG, WEBP, or GIF." };
    }
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      return { error: "Photo size must be at most 3MB." };
    }

    const ext = ALLOWED_MIME[avatarFile.type];
    const filename = `${currentUser.id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    if (currentUser.avatarUrl?.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(process.cwd(), "public", currentUser.avatarUrl);
      await unlink(oldPath).catch(() => {});
    }

    avatarUrl = `/uploads/avatars/${filename}`;
  }

  const wantsRoleChange =
    parsed.data.role !== currentUser.role && currentUser.role !== "ADMIN";

  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      name: parsed.data.name,
      employeeId: parsed.data.employeeId,
      phone: parsed.data.phone,
      role: currentUser.role === "ADMIN" ? parsed.data.role : currentUser.role,
      pendingRole: wantsRoleChange ? parsed.data.role : currentUser.pendingRole,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });

  if (wantsRoleChange) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: "ROLE_CHANGE_REQUESTED",
          message: `${currentUser.name} requested to change their role to ${parsed.data.role}.`,
        })
      )
    );
  }

  revalidatePath("/", "layout");
  return { success: true, roleChangeRequested: wantsRoleChange };
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password confirmation doesn't match",
    path: ["confirmPassword"],
  });

export async function changePassword(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "You must be logged in." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { success: true };
}
