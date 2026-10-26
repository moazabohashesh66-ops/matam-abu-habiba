import { NextRequest, NextResponse } from "next/server";
import {
  createOrdersAdminSession,
  getAdminCookieOptions,
  isOrdersAdminPasswordConfigured,
  isSameOriginRequest,
  isValidOrdersAdminSession,
  ORDERS_ADMIN_COOKIE_NAME,
  verifyOrdersAdminPassword,
} from "@/lib/server/adminAuth";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/requestBody";
import { checkRateLimit, resetRateLimit } from "@/lib/server/rateLimit";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      authenticated: isValidOrdersAdminSession(request.cookies.get(ORDERS_ADMIN_COOKIE_NAME)?.value),
      configured: isOrdersAdminPasswordConfigured(),
    },
    { headers: privateHeaders },
  );
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403, headers: privateHeaders });
  }
  if (!isOrdersAdminPasswordConfigured()) {
    return NextResponse.json({ error: "إعداد كلمة مرور متابعة الطلبات غير مكتمل على الخادم" }, { status: 503, headers: privateHeaders });
  }

  const rateLimit = checkRateLimit(request, "orders-admin-login", 5, 15 * 60 * 1000);
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
    const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status, headers: privateHeaders });
  }

  if (!verifyOrdersAdminPassword(body.password)) {
    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401, headers: privateHeaders });
  }

  resetRateLimit(request, "orders-admin-login");
  const response = NextResponse.json({ ok: true }, { headers: privateHeaders });
  response.cookies.set(ORDERS_ADMIN_COOKIE_NAME, createOrdersAdminSession(), getAdminCookieOptions());
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403, headers: privateHeaders });
  }
  const response = NextResponse.json({ ok: true }, { headers: privateHeaders });
  response.cookies.set(ORDERS_ADMIN_COOKIE_NAME, "", { ...getAdminCookieOptions(), maxAge: 0 });
  return response;
}
