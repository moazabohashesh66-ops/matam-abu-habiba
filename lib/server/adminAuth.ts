import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "abu-habiba-admin";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 12;

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function isAdminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && sessionSecret());
}

export function verifyAdminPassword(value: unknown) {
  const password = process.env.ADMIN_PASSWORD;
  if (typeof value !== "string" || !password) return false;
  const supplied = Buffer.from(value);
  const expected = Buffer.from(password);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function signature(expiresAt: string) {
  return createHmac("sha256", sessionSecret()).update(expiresAt).digest("base64url");
}

export function createAdminSession() {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS);
  return `${expiresAt}.${signature(expiresAt)}`;
}

export function isValidAdminSession(value: string | undefined | null) {
  if (!value || !isAdminPasswordConfigured()) return false;
  const [expiresAt, providedSignature, extra] = value.split(".");
  if (!expiresAt || !providedSignature || extra || Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;
  const expectedSignature = Buffer.from(signature(expiresAt));
  const actualSignature = Buffer.from(providedSignature);
  return expectedSignature.length === actualSignature.length && timingSafeEqual(expectedSignature, actualSignature);
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
  };
}
