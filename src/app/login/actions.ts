"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { SESSION_COOKIE_PATTERN } from "@/lib/session-cookie";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/board");

  try {
    // redirect: false — the built-in signIn() would otherwise redirect
    // (throwing) before we get a chance to fix up the session cookie below.
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  // signIn() just set the session cookie with a 30-day Expires. Re-set it as
  // a browser-session cookie so it's cleared when the browser fully closes.
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

  redirect(callbackUrl);
}
