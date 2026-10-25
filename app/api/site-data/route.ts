import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminPasswordConfigured, isSameOriginRequest, isValidAdminSession, ADMIN_COOKIE_NAME } from "@/lib/server/adminAuth";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { defaultSiteData, type SiteData } from "@/lib/siteData";

export const dynamic = "force-dynamic";

function isValidSiteData(value: unknown): value is Partial<SiteData> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isValidMenuData(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > 100) return false;

  return value.every((category: unknown) => {
    if (!isRecord(category) || typeof category.id !== "string" || typeof category.name !== "string") return false;
    if (!Array.isArray(category.products) || category.products.length > 500) return false;

    return category.products.every((product: unknown) => {
      if (!isRecord(product)) return false;
      if (typeof product.id !== "string" || typeof product.name !== "string" || typeof product.isAvailable !== "boolean") return false;
      if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) return false;
      if (product.optionGroups === undefined) return true;
      if (!Array.isArray(product.optionGroups)) return false;

      return product.optionGroups.every((group: unknown) => {
        if (!isRecord(group) || typeof group.name !== "string" || typeof group.required !== "boolean" || typeof group.multiple !== "boolean") return false;
        if (!Array.isArray(group.options)) return false;

        return group.options.every((option: unknown) =>
          isRecord(option) && typeof option.name === "string" &&
          Number.isFinite(Number(option.priceAdjustment)) && Number(option.priceAdjustment) >= 0,
        );
      });
    });
  });
}

function isValidFieldValue(field: string, value: unknown) {
  if (field === "menuData") return isValidMenuData(value);
  if (field === "offers") return Array.isArray(value) && value.length <= 200 && value.every((offer) =>
    offer && typeof offer.id === "string" && typeof offer.name === "string" && Number.isFinite(Number(offer.price)) && Number(offer.price) >= 0 && typeof offer.isAvailable === "boolean",
  );
  if (field === "coupons") return Array.isArray(value) && value.length <= 1000 && value.every((coupon) =>
    coupon && typeof coupon.code === "string" && Number.isFinite(Number(coupon.discountValue)) && Number(coupon.discountValue) > 0 &&
    (coupon.discountType === "fixed" || coupon.discountType === "percentage") && typeof coupon.isActive === "boolean" &&
    (coupon.discountType !== "percentage" || Number(coupon.discountValue) <= 100),
  );
  if (field === "settings") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const settings = value as Record<string, unknown>;
    return Number.isFinite(Number(settings.deliveryFee)) && Number(settings.deliveryFee) >= 0 &&
      Number.isFinite(Number(settings.minimumOrderAmount)) && Number(settings.minimumOrderAmount) >= 0 &&
      typeof settings.acceptingOrders === "boolean";
  }
  return false;
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ data: null, configured: false, adminConfigured: isAdminPasswordConfigured() });
  }

  const { data, error } = await supabase.from("site_state").select("data").eq("id", 1).maybeSingle();
  if (error) {
    return NextResponse.json({ data: null, configured: true, databaseReady: false, error: "تعذر قراءة بيانات الموقع. تأكد من تشغيل ملف إعداد قاعدة البيانات." }, { status: 503 });
  }

  return NextResponse.json({ data: data?.data ?? null, configured: true, databaseReady: true, adminConfigured: isAdminPasswordConfigured() });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403 });
  }
  if (!isValidAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "سجّل الدخول إلى لوحة الأدمن أولاً" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "لم يتم ربط قاعدة البيانات بعد. أضف مفتاح Supabase السري إلى إعدادات الخادم." }, { status: 503 });
  }

  let body: { field?: unknown; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الحفظ غير صحيحة" }, { status: 400 });
  }

  if (body.field !== "all" && (typeof body.field !== "string" || !isValidFieldValue(body.field, body.value))) {
    return NextResponse.json({ error: "بيانات الحفظ غير مكتملة" }, { status: 400 });
  }
  if (body.field === "all" && !isValidSiteData(body.value)) {
    return NextResponse.json({ error: "بيانات الموقع غير صحيحة" }, { status: 400 });
  }

  const { data: current, error: readError } = await supabase.from("site_state").select("data").eq("id", 1).maybeSingle();
  if (readError) {
    return NextResponse.json({ error: "قاعدة البيانات غير مجهزة. شغّل ملف database/schema.sql أولاً." }, { status: 503 });
  }

  const currentData = { ...defaultSiteData, ...(current?.data ?? {}) } as SiteData;
  const nextData = body.field === "all"
    ? { ...currentData, ...(body.value as Partial<SiteData>) }
    : { ...currentData, [body.field as string]: body.value };

  const { error: writeError } = await supabase.from("site_state").upsert({ id: 1, data: nextData, updated_at: new Date().toISOString() });
  if (writeError) {
    return NextResponse.json({ error: "تعذر حفظ التغييرات. راجع صلاحيات قاعدة البيانات." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, data: nextData });
}
