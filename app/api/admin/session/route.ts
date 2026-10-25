import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminPasswordConfigured, isValidAdminSession } from "@/lib/server/adminAuth";

export async function GET(request: NextRequest) {
  const authenticated = isValidAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  return NextResponse.json({ authenticated, configured: isAdminPasswordConfigured() });
}
