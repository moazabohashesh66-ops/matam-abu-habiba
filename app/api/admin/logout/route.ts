import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminCookieOptions, isSameOriginRequest } from "@/lib/server/adminAuth";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "", { ...getAdminCookieOptions(), maxAge: 0 });
  return response;
}
