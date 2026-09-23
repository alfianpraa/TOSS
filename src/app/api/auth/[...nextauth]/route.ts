import { handlers } from "@/auth";
import { applySessionCookieFix } from "@/lib/session-cookie";

export async function GET(...args: Parameters<typeof handlers.GET>) {
  return applySessionCookieFix(await handlers.GET(...args));
}

export async function POST(...args: Parameters<typeof handlers.POST>) {
  return applySessionCookieFix(await handlers.POST(...args));
}
