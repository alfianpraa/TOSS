import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { applySessionCookieFix } from "@/lib/session-cookie";

const PUBLIC_PATHS = ["/login", "/signup"];

const authMiddleware = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isPublicPage = PUBLIC_PATHS.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (!isLoggedIn && !isPublicPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isPublicPage) {
    return NextResponse.redirect(new URL("/board", req.nextUrl.origin));
  }
});

// `auth()` middleware silently re-signs and re-appends the session cookie
// (with a persistent Expires) on every request it processes — strip that
// back out so the cookie stays a browser-session-only cookie.
export default async function proxy(
  ...args: Parameters<typeof authMiddleware>
) {
  const res = await authMiddleware(...args);
  return applySessionCookieFix(res ?? NextResponse.next());
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
