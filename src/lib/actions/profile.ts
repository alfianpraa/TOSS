"use server";

import { revalidatePath } from "next/cache";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { allowedRolesFor } from "@/lib/permissions";

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "SALES", "DEVELOPER", "MARKETING"]),
});

export async function updateProfile(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Anda harus login." };

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
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const allowedRoles = allowedRolesFor(currentUser.role);
  if (!allowedRoles.includes(parsed.data.role)) {
    return { error: "Anda tidak punya izin memilih role tersebut." };
  }

  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar");

  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!(avatarFile.type in ALLOWED_MIME)) {
      return { error: "Format foto harus JPG, PNG, WEBP, atau GIF." };
    }
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      return { error: "Ukuran foto maksimal 3MB." };
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

  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      name: parsed.data.name,
      employeeId: parsed.data.employeeId,
      phone: parsed.data.phone,
      role: parsed.data.role,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
