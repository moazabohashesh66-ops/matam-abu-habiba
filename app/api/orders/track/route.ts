import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/server/adminAuth";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/requestBody";
import type { OrderStatus } from "@/types/orders";

export const dynamic = "force-dynamic";

const orderStatuses: OrderStatus[] = ["new", "preparing", "ready", "completed", "cancelled"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizePhone(value: string) {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const easternArabicDigits = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicDigits.indexOf(digit)))
    .replace(/\D/g, "");
}

export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403, headers });
  }

  const rateLimit = checkRateLimit(request, "track-orders", 12, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "تم إجراء استعلامات كثيرة. حاول مرة أخرى بعد قليل." },
      { status: 429, headers: { ...headers, "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody<Record<string, unknown>>(request, 2 * 1024);
  } catch (error) {
    const message = error instanceof RequestBodyTooLargeError ? "البيانات أكبر من المسموح" : "رقم الهاتف غير صحيح";
    return NextResponse.json({ error: message }, { status: 400, headers });
  }

  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : "";
  if (phone.length < 8 || phone.length > 15) {
    return NextResponse.json({ error: "اكتب رقم الهاتف الذي استخدمته في الطلب." }, { status: 400, headers });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "متابعة الطلبات غير متاحة حالياً." }, { status: 503, headers });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("order_code,status,created_at")
    .eq("customer_phone", phone)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: "تعذر البحث عن الطلب الآن. حاول مرة أخرى." }, { status: 503, headers });
  }

  const orders = (data ?? [])
    .filter((order) => orderStatuses.includes(order.status as OrderStatus))
    .map((order) => ({
      orderCode: order.order_code,
      status: order.status as OrderStatus,
      createdAt: order.created_at,
    }));

  return NextResponse.json({ orders }, { headers });
}
