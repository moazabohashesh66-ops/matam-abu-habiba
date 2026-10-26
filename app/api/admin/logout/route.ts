import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminCookieOptions, isSameOriginRequest } from "@/lib/server/adminAuth";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set(ADMIN_COOKIE_NAME, "", { ...getAdminCookieOptions(), maxAge: 0 });
  return response;
}
