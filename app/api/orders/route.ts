import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ORDERS_ADMIN_COOKIE_NAME, isSameOriginRequest, isValidOrdersAdminSession } from "@/lib/server/adminAuth";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { defaultSiteData } from "@/lib/siteData";
import type { OrderStatus, StoredOrderItem } from "@/types/orders";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/requestBody";
import { checkRateLimit } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

const orderStatuses: OrderStatus[] = ["new", "preparing", "ready", "completed", "cancelled"];
type OrderCatalog = {
  menuData: unknown[];
  offers: unknown[];
  coupons: unknown[];
  settings: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function resolveOrderItems(value: unknown, catalog: OrderCatalog): StoredOrderItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) return null;

  const products = catalog.menuData.flatMap((category) =>
    isRecord(category) && Array.isArray(category.products) ? category.products.filter(isRecord) : [],
  );
  const resolved: StoredOrderItem[] = [];

  for (const rawItem of value) {
    if (!isRecord(rawItem) || typeof rawItem.id !== "string" || rawItem.id.length > 220 ||
      !Number.isInteger(rawItem.quantity) || Number(rawItem.quantity) < 1 || Number(rawItem.quantity) > 50) return null;

    const quantity = Number(rawItem.quantity);
    const offerId = typeof rawItem.offerId === "string"
      ? rawItem.offerId
      : rawItem.id.startsWith("offer-") ? rawItem.id.slice("offer-".length) : null;

    if (offerId) {
      const offer = catalog.offers.find((candidate) => isRecord(candidate) && candidate.id === offerId && candidate.isAvailable === true);
      if (!isRecord(offer) || rawItem.id !== `offer-${offerId}` || rawItem.productId !== undefined) return null;
      const price = Number(offer.price);
      if (!Number.isFinite(price) || price < 0 || price > 1_000_000 || typeof offer.name !== "string") return null;
      resolved.push({ id: rawItem.id, name: offer.name.slice(0, 120), price, quantity });
      continue;
    }

    const productId = typeof rawItem.productId === "string"
      ? rawItem.productId
      : rawItem.id.split("::", 1)[0];
    const product = products.find((candidate) => candidate.id === productId && candidate.isAvailable === true);
    if (!isRecord(product) || rawItem.offerId !== undefined) return null;

    const groups = Array.isArray(product.optionGroups) ? product.optionGroups.filter(isRecord) : [];
    let selectedOptionIds: string[];
    if (Array.isArray(rawItem.selectedOptionIds) && rawItem.selectedOptionIds.every((id) => typeof id === "string" && id.length <= 100)) {
      selectedOptionIds = rawItem.selectedOptionIds as string[];
    } else if (rawItem.id === productId) {
      selectedOptionIds = groups.flatMap((group) =>
        Array.isArray(group.options)
          ? group.options.filter((option) => isRecord(option) && option.defaultSelected === true).map((option) => String((option as Record<string, unknown>).id))
          : [],
      );
    } else {
      return null;
    }

    if (selectedOptionIds.length > 100 || new Set(selectedOptionIds).size !== selectedOptionIds.length) return null;
    let optionPrice = 0;
    const optionNames: string[] = [];
    const knownIds = new Set<string>();

    for (const group of groups) {
      const options = Array.isArray(group.options) ? group.options.filter(isRecord) : [];
      const selected = options.filter((option) => selectedOptionIds.includes(String(option.id)));
      for (const option of options) knownIds.add(String(option.id));
      if (group.required === true && selected.length === 0) return null;
      if (group.multiple === false && selected.length > 1) return null;
      for (const option of selected) {
        const adjustment = Number(option.priceAdjustment);
        if (!Number.isFinite(adjustment) || adjustment < 0 || adjustment > 1_000_000 || typeof option.name !== "string") return null;
        optionPrice += adjustment;
        optionNames.push(`${String(group.name)}: ${option.name}`);
      }
    }

    if (selectedOptionIds.some((id) => !knownIds.has(id))) return null;
    const canonicalOptionIds = [...selectedOptionIds].sort();
    const canonicalId = canonicalOptionIds.length ? `${productId}::${canonicalOptionIds.join("-")}` : productId;
    if (rawItem.id !== canonicalId || typeof product.name !== "string") return null;
    const basePrice = Number(product.price);
    const price = basePrice + optionPrice;
    if (!Number.isFinite(basePrice) || basePrice < 0 || !Number.isFinite(price) || price > 1_000_000) return null;
    resolved.push({
      id: canonicalId,
      name: `${product.name}${optionNames.length ? ` — ${optionNames.join("، ")}` : ""}`.slice(0, 120),
      price,
      quantity,
    });
  }

  return resolved;
}

export async function GET(request: NextRequest) {
  if (!isValidOrdersAdminSession(request.cookies.get(ORDERS_ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "سجّل الدخول إلى لوحة الأدمن أولاً" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  const rateLimit = checkRateLimit(request, "admin-orders-read", 60, 60 * 1000);
  if (!rateLimit.allowed) return NextResponse.json({ error: "طلبات كثيرة. حاول مرة أخرى بعد قليل." }, { status: 429, headers: { "Cache-Control": "private, no-store", "Retry-After": String(rateLimit.retryAfterSeconds) } });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مربوطة" }, { status: 503 });

  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "تعذر تحميل الطلبات. تأكد من إعداد قاعدة البيانات." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  return NextResponse.json({ orders: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مربوطة" }, { status: 503 });

  const rateLimit = checkRateLimit(request, "create-order", 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "تم إرسال طلبات كثيرة من هذا الاتصال. حاول مرة أخرى بعد قليل." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody<Record<string, unknown>>(request, 64 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "حجم الطلب أكبر من المسموح" }, { status: 413 });
    }
    return NextResponse.json({ error: "بيانات الطلب غير صحيحة" }, { status: 400 });
  }

  const orderCode = typeof body.orderCode === "string" ? body.orderCode.trim() : "";
  const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
  const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone : "";
  const fulfillmentMethod = body.fulfillmentMethod === "pickup" ? "pickup" : body.fulfillmentMethod === "delivery" ? "delivery" : null;
  const address = typeof body.deliveryAddress === "string" ? body.deliveryAddress.trim().slice(0, 500) : "";
  if (!/^[A-Za-z0-9_-]{4,24}$/.test(orderCode) || customerName.length < 2 || !/^\d{8,15}$/.test(customerPhone) || !fulfillmentMethod || (fulfillmentMethod === "delivery" && address.length < 5)) {
    return NextResponse.json({ error: "بيانات الطلب ناقصة" }, { status: 400 });
  }

  const { data: siteRow, error: siteError } = await supabase.from("site_state").select("data").eq("id", 1).maybeSingle();
  if (siteError) return NextResponse.json({ error: "تعذر التحقق من قائمة الأسعار. حاول مرة أخرى." }, { status: 503 });
  const siteData = isRecord(siteRow?.data) ? siteRow.data : defaultSiteData;
  const catalog: OrderCatalog = {
    menuData: Array.isArray(siteData.menuData) ? siteData.menuData : defaultSiteData.menuData,
    offers: Array.isArray(siteData.offers) ? siteData.offers : defaultSiteData.offers,
    coupons: Array.isArray(siteData.coupons) ? siteData.coupons : defaultSiteData.coupons,
    settings: (isRecord(siteData.settings) ? siteData.settings : defaultSiteData.settings) as unknown as Record<string, unknown>,
  };
  const items = resolveOrderItems(body.items, catalog);
  if (!items) return NextResponse.json({ error: "تعذر التحقق من المنتجات أو أسعارها. حدّث السلة ثم حاول مرة أخرى." }, { status: 400 });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const settings = catalog.settings;
  if (settings.acceptingOrders === false) return NextResponse.json({ error: "المطعم لا يستقبل طلبات الآن" }, { status: 409 });
  const minimumOrderAmount = Math.max(0, Number(settings.minimumOrderAmount) || 0);
  if (subtotal < minimumOrderAmount) return NextResponse.json({ error: `الحد الأدنى للطلب ${minimumOrderAmount} ج.م` }, { status: 400 });
  const normalizedCouponCode = typeof body.couponCode === "string" ? body.couponCode.trim().replace(/\s+/g, "").toUpperCase().slice(0, 40) : "";
  const coupon = catalog.coupons.find((item): item is Record<string, unknown> =>
    isRecord(item) && item.isActive === true && typeof item.code === "string" && item.code.toUpperCase() === normalizedCouponCode &&
    (item.discountType === "fixed" || item.discountType === "percentage") && Number.isFinite(Number(item.discountValue)) && Number(item.discountValue) > 0,
  );
  const discount = coupon
    ? Math.min(subtotal, coupon.discountType === "percentage"
      ? Math.round((subtotal * Math.min(100, Number(coupon.discountValue))) / 100)
      : Math.max(0, Number(coupon.discountValue)))
    : 0;
  const deliveryFee = fulfillmentMethod === "delivery" ? Math.max(0, Number(settings.deliveryFee) || 0) : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const { error } = await supabase.from("orders").insert({
    order_code: orderCode,
    customer_name: customerName,
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
  if (!isValidOrdersAdminSession(request.cookies.get(ORDERS_ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "سجّل الدخول إلى لوحة الأدمن أولاً" }, { status: 401 });
  }
  const rateLimit = checkRateLimit(request, "admin-orders-update", 60, 60 * 1000);
  if (!rateLimit.allowed) return NextResponse.json({ error: "طلبات كثيرة. حاول مرة أخرى بعد قليل." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مربوطة" }, { status: 503 });

  let body: { orderCode?: unknown; status?: unknown };
  try {
    body = await readJsonBody<{ orderCode?: unknown; status?: unknown }>(request, 4096);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "حجم الطلب أكبر من المسموح" }, { status: 413 });
    }
    return NextResponse.json({ error: "بيانات التحديث غير صحيحة" }, { status: 400 });
  }
  if (typeof body.orderCode !== "string" || body.orderCode.length > 24 || typeof body.status !== "string" || !orderStatuses.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: "حالة الطلب غير صحيحة" }, { status: 400 });
  }

  const { error } = await supabase.from("orders").update({ status: body.status }).eq("order_code", body.orderCode);
  if (error) return NextResponse.json({ error: "تعذر تحديث حالة الطلب" }, { status: 503 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403 });
  if (!isValidOrdersAdminSession(request.cookies.get(ORDERS_ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "سجّل الدخول إلى لوحة الأدمن أولاً" }, { status: 401 });
  }
  const rateLimit = checkRateLimit(request, "admin-orders-delete", 20, 60 * 1000);
  if (!rateLimit.allowed) return NextResponse.json({ error: "طلبات كثيرة. حاول مرة أخرى بعد قليل." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مربوطة" }, { status: 503 });

  let body: { orderCode?: unknown; deleteAll?: unknown };
  try {
    body = await readJsonBody<{ orderCode?: unknown; deleteAll?: unknown }>(request, 4096);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "حجم الطلب أكبر من المسموح" }, { status: 413 });
    }
    return NextResponse.json({ error: "بيانات الحذف غير صحيحة" }, { status: 400 });
  }
  if (body.deleteAll === true) {
    const { count, error } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .not("id", "is", null);
    if (error) return NextResponse.json({ error: "تعذر حذف الطلبات" }, { status: 503 });
    return NextResponse.json({ ok: true, deleted: count ?? 0 });
  }

  if (typeof body.orderCode !== "string" || !body.orderCode.trim() || body.orderCode.length > 24) {
    return NextResponse.json({ error: "رقم الطلب غير صحيح" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("order_code", body.orderCode)
    .in("status", ["completed", "cancelled"])
    .select("order_code")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "تعذر حذف سجل الطلب" }, { status: 503 });
  if (!data) return NextResponse.json({ error: "يمكن حذف الطلب بعد تحديده مكتمل أو ملغي فقط" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
