"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SELF_REGISTER_ROLES } from "@/lib/permissions";
import { SESSION_COOKIE_PATTERN } from "@/lib/session-cookie";

const signupSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
    role: z.enum(["SALES", "DEVELOPER", "MARKETING"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export async function signupAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  if (!SELF_REGISTER_ROLES.includes(parsed.data.role)) {
    return { error: "Role tidak diizinkan untuk daftar mandiri." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "Email sudah terdaftar. Silakan masuk." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Akun dibuat, tapi gagal masuk otomatis. Silakan masuk manual." };
    }
    throw error;
  }

  // Same fix as loginAction: turn the just-issued session cookie into a
  // browser-session cookie instead of Auth.js's default 30-day cookie.
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  for (const { name, value } of cookieStore.getAll()) {
    if (SESSION_COOKIE_PATTERN.test(name)) {
      cookieStore.set(name, value, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure,
      });
    }
  }

  redirect("/board");
}
