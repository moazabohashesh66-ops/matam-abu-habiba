import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, isSameOriginRequest, isValidAdminSession } from "@/lib/server/adminAuth";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import type { OrderStatus, StoredOrderItem } from "@/types/orders";

export const dynamic = "force-dynamic";

const orderStatuses: OrderStatus[] = ["new", "preparing", "ready", "completed", "cancelled"];
const recentOrderAttempts = new Map<string, number>();

function validOrderItems(value: unknown): value is StoredOrderItem[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 50 && value.every((item) =>
    item && typeof item.id === "string" && typeof item.name === "string" && item.name.length <= 120 &&
    Number.isFinite(item.price) && item.price >= 0 && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 50,
  );
}

export async function GET(request: NextRequest) {
  if (!isValidAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "سجّل الدخول إلى لوحة الأدمن أولاً" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مربوطة" }, { status: 503 });

  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "تعذر تحميل الطلبات. تأكد من إعداد قاعدة البيانات." }, { status: 503 });
  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مربوطة" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صحيحة" }, { status: 400 });
  }

  const orderCode = typeof body.orderCode === "string" ? body.orderCode.slice(0, 24) : "";
  const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.replace(/\D/g, "") : "";
  const fulfillmentMethod = body.fulfillmentMethod === "pickup" ? "pickup" : body.fulfillmentMethod === "delivery" ? "delivery" : null;
  const address = typeof body.deliveryAddress === "string" ? body.deliveryAddress.trim().slice(0, 500) : "";
  const items = body.items;
  if (!orderCode || customerPhone.length < 8 || customerPhone.length > 15 || !fulfillmentMethod || !validOrderItems(items) || (fulfillmentMethod === "delivery" && address.length < 5)) {
    return NextResponse.json({ error: "بيانات الطلب ناقصة" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const lastAttempt = recentOrderAttempts.get(ip) ?? 0;
  if (Date.now() - lastAttempt < 1200) return NextResponse.json({ error: "انتظر لحظة قبل إرسال طلب آخر" }, { status: 429 });
  recentOrderAttempts.set(ip, Date.now());

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { data: siteRow } = await supabase.from("site_state").select("data").eq("id", 1).maybeSingle();
  const settings = siteRow?.data?.settings ?? {};
  if (settings.acceptingOrders === false) return NextResponse.json({ error: "المطعم لا يستقبل طلبات الآن" }, { status: 409 });
  const minimumOrderAmount = Math.max(0, Number(settings.minimumOrderAmount) || 0);
  if (subtotal < minimumOrderAmount) return NextResponse.json({ error: `الحد الأدنى للطلب ${minimumOrderAmount} ج.م` }, { status: 400 });
  const normalizedCouponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";
  const coupon = (Array.isArray(siteRow?.data?.coupons) ? siteRow.data.coupons : []).find((item: { code?: string; isActive?: boolean; discountType?: string; discountValue?: number }) =>
    item.isActive && item.code?.toUpperCase() === normalizedCouponCode,
  );
  const discount = coupon
    ? Math.min(subtotal, coupon.discountType === "percentage"
      ? Math.round((subtotal * Number(coupon.discountValue)) / 100)
      : Math.max(0, Number(coupon.discountValue) || 0))
    : 0;
  const deliveryFee = fulfillmentMethod === "delivery" ? Math.max(0, Number(settings.deliveryFee) || 0) : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const { error } = await supabase.from("orders").insert({
    order_code: orderCode,
    customer_phone: customerPhone,
    fulfillment_method: fulfillmentMethod,
    delivery_address: fulfillmentMethod === "delivery" ? address : null,
    items,
    subtotal,
    discount,
    delivery_fee: deliveryFee,
    total,
    coupon_code: coupon ? normalizedCouponCode.slice(0, 40) : null,
    status: "new",
  });

  if (error) return NextResponse.json({ error: "تعذر تسجيل الطلب في لوحة المتابعة" }, { status: 503 });
  return NextResponse.json({ ok: true, orderCode });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403 });
  if (!isValidAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "سجّل الدخول إلى لوحة الأدمن أولاً" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مربوطة" }, { status: 503 });

  let body: { orderCode?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات التحديث غير صحيحة" }, { status: 400 });
  }
  if (typeof body.orderCode !== "string" || typeof body.status !== "string" || !orderStatuses.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: "حالة الطلب غير صحيحة" }, { status: 400 });
  }

  const { error } = await supabase.from("orders").update({ status: body.status }).eq("order_code", body.orderCode);
  if (error) return NextResponse.json({ error: "تعذر تحديث حالة الطلب" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
