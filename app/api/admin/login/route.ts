import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  getAdminCookieOptions,
  isAdminPasswordConfigured,
  isSameOriginRequest,
  verifyAdminPassword,
} from "@/lib/server/adminAuth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403 });
  }
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json({ error: "إعداد كلمة مرور الأدمن غير مكتمل على الخادم" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = attempts.get(ip);
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى." }, { status: 429 });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400 });
  }

  if (!verifyAdminPassword(body.password)) {
    attempts.set(ip, {
      count: current && current.resetAt > now ? current.count + 1 : 1,
      resetAt: current && current.resetAt > now ? current.resetAt : now + WINDOW_MS,
    });
    return NextResponse.json({ error: "كلمة السر غير صحيحة" }, { status: 401 });
  }

  attempts.delete(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSession(), getAdminCookieOptions());
  return response;
}
