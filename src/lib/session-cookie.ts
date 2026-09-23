/**
 * Auth.js always stamps the session cookie with an `Expires`/`Max-Age` derived
 * from `session.maxAge` (30 days) — on sign-in, on every background session
 * refresh (NextAuth's client polling on window focus), AND on every request
 * that passes through the `auth()` middleware wrapper in proxy.ts (it silently
 * re-signs and re-appends the cookie on every navigation). There is no public
 * config to opt out of this, so we strip those attributes ourselves at every
 * point the cookie gets (re)issued, turning it into a true browser session
 * cookie that the browser discards once it's fully closed.
 */
export const SESSION_COOKIE_PATTERN = /^(__Secure-)?authjs\.session-token/;

export function stripCookiePersistence(setCookieHeader: string): string {
  return setCookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => !/^expires=/i.test(part) && !/^max-age=/i.test(part))
    .join("; ");
}

export function applySessionCookieFix(res: Response): Response {
  const setCookies = res.headers.getSetCookie();
  if (setCookies.length === 0) return res;

  const headers = new Headers(res.headers);
  headers.delete("set-cookie");
  for (const raw of setCookies) {
    const name = raw.split("=")[0]?.trim() ?? "";
    headers.append(
      "set-cookie",
      SESSION_COOKIE_PATTERN.test(name) ? stripCookiePersistence(raw) : raw
    );
  }

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
