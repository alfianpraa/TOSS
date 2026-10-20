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
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["SALES", "DEVELOPER", "MARKETING"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password confirmation doesn't match",
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  if (!SELF_REGISTER_ROLES.includes(parsed.data.role)) {
    return { error: "This role is not allowed for self-registration." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "Email is already registered. Please log in." };
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
      return { error: "Account created, but automatic login failed. Please log in manually." };
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
