import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  getAdminCookieOptions,
  isAdminPasswordConfigured,
  isSameOriginRequest,
  verifyAdminPassword,
} from "@/lib/server/adminAuth";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/requestBody";
import { checkRateLimit, resetRateLimit } from "@/lib/server/rateLimit";

export async function POST(request: Request) {
  const privateHeaders = { "Cache-Control": "private, no-store" };
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403, headers: privateHeaders });
  }
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json({ error: "إعداد كلمة مرور الأدمن غير مكتمل على الخادم" }, { status: 503, headers: privateHeaders });
  }

  const rateLimit = checkRateLimit(request, "admin-login", 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى." },
      { status: 429, headers: { ...privateHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  let body: { password?: unknown };
  try {
    body = await readJsonBody<{ password?: unknown }>(request, 4096);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "حجم الطلب أكبر من المسموح" }, { status: 413, headers: privateHeaders });
    }
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400, headers: privateHeaders });
  }

  if (!verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "كلمة السر غير صحيحة" }, { status: 401, headers: privateHeaders });
  }

  resetRateLimit(request, "admin-login");
  const response = NextResponse.json({ ok: true }, { headers: privateHeaders });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSession(), getAdminCookieOptions());
  return response;
}
