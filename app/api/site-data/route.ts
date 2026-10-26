import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminPasswordConfigured, isSameOriginRequest, isValidAdminSession, ADMIN_COOKIE_NAME } from "@/lib/server/adminAuth";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { defaultSiteData, type SiteData } from "@/lib/siteData";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/requestBody";
import { checkRateLimit } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

function isValidSiteData(value: unknown): value is Partial<SiteData> {
  return isRecord(value) && Object.entries(value).every(([field, fieldValue]) =>
    isValidFieldValue(field, fieldValue),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]) {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isOptionalText(value: unknown, maximumLength: number) {
  return value === undefined || (typeof value === "string" && value.length <= maximumLength);
}

function isOptionalImage(value: unknown) {
  return isOptionalText(value, 2_500_000);
}

function isValidMenuData(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > 40) return false;
  let totalProducts = 0;

  return value.every((category: unknown) => {
    if (!isRecord(category) || !hasOnlyKeys(category, ["id", "name", "nameEn", "icon", "image", "products"])) return false;
    if (typeof category.id !== "string" || category.id.length > 80 || typeof category.name !== "string" || category.name.length > 120) return false;
    if (!isOptionalText(category.nameEn, 120) || !isOptionalText(category.icon, 20) || !isOptionalImage(category.image)) return false;
    if (!Array.isArray(category.products) || category.products.length > 150) return false;
    totalProducts += category.products.length;
    if (totalProducts > 1000) return false;

    return category.products.every((product: unknown) => {
      if (!isRecord(product) || !hasOnlyKeys(product, ["id", "name", "nameEn", "description", "price", "image", "isAvailable", "isPopular", "isNew", "size", "weight", "optionGroups"])) return false;
      if (typeof product.id !== "string" || product.id.length > 100 || typeof product.name !== "string" || product.name.length > 120 || typeof product.isAvailable !== "boolean") return false;
      if (!isOptionalText(product.nameEn, 120) || !isOptionalText(product.description, 1000) || !isOptionalText(product.size, 80) || !isOptionalText(product.weight, 80) || !isOptionalImage(product.image)) return false;
      if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0 || Number(product.price) > 1_000_000) return false;
      if (product.isPopular !== undefined && typeof product.isPopular !== "boolean") return false;
      if (product.isNew !== undefined && typeof product.isNew !== "boolean") return false;
      if (product.optionGroups === undefined) return true;
      if (!Array.isArray(product.optionGroups) || product.optionGroups.length > 20) return false;

      return product.optionGroups.every((group: unknown) => {
        if (!isRecord(group) || !hasOnlyKeys(group, ["id", "name", "required", "multiple", "options"]) || typeof group.id !== "string" || group.id.length > 100 || typeof group.name !== "string" || group.name.length > 120 || typeof group.required !== "boolean" || typeof group.multiple !== "boolean") return false;
        if (!Array.isArray(group.options) || group.options.length > 30) return false;

        return group.options.every((option: unknown) =>
          isRecord(option) && hasOnlyKeys(option, ["id", "name", "priceAdjustment", "defaultSelected"]) && typeof option.id === "string" && option.id.length <= 100 && typeof option.name === "string" && option.name.length <= 120 &&
          Number.isFinite(Number(option.priceAdjustment)) && Number(option.priceAdjustment) >= 0 && Number(option.priceAdjustment) <= 1_000_000 &&
          (option.defaultSelected === undefined || typeof option.defaultSelected === "boolean"),
        );
      });
    });
  });
}

function isValidFieldValue(field: string, value: unknown) {
  if (field === "menuData") return isValidMenuData(value);
  if (field === "offers") return Array.isArray(value) && value.length <= 100 && value.every((offer) =>
    isRecord(offer) && hasOnlyKeys(offer, ["id", "name", "description", "price", "originalPrice", "image", "badge", "isAvailable"]) &&
    typeof offer.id === "string" && offer.id.length <= 100 && typeof offer.name === "string" && offer.name.length <= 120 &&
    isOptionalText(offer.description, 1000) && isOptionalText(offer.badge, 120) && isOptionalImage(offer.image) &&
    Number.isFinite(Number(offer.price)) && Number(offer.price) >= 0 && Number(offer.price) <= 1_000_000 &&
    (offer.originalPrice === undefined || (Number.isFinite(Number(offer.originalPrice)) && Number(offer.originalPrice) >= Number(offer.price) && Number(offer.originalPrice) <= 1_000_000)) &&
    typeof offer.isAvailable === "boolean",
  );
  if (field === "coupons") return Array.isArray(value) && value.length <= 200 && value.every((coupon) =>
    isRecord(coupon) && hasOnlyKeys(coupon, ["id", "code", "discountType", "discountValue", "isActive"]) &&
    typeof coupon.id === "string" && coupon.id.length <= 100 && typeof coupon.code === "string" && coupon.code.length <= 40 && Number.isFinite(Number(coupon.discountValue)) && Number(coupon.discountValue) > 0 && Number(coupon.discountValue) <= 1_000_000 &&
    (coupon.discountType === "fixed" || coupon.discountType === "percentage") && typeof coupon.isActive === "boolean" &&
    (coupon.discountType !== "percentage" || Number(coupon.discountValue) <= 100),
  );
  if (field === "settings") {
    if (!isRecord(value) || !hasOnlyKeys(value, ["phoneNumber", "whatsappNumber", "restaurantName", "facebookUrl", "deliveryFee", "minimumOrderAmount", "deliveryAreas", "businessHours", "acceptingOrders"])) return false;
    const settings = value;
    return typeof settings.phoneNumber === "string" && settings.phoneNumber.length <= 30 &&
      typeof settings.whatsappNumber === "string" && settings.whatsappNumber.length <= 30 &&
      typeof settings.restaurantName === "string" && settings.restaurantName.length <= 120 &&
      typeof settings.facebookUrl === "string" && settings.facebookUrl.length <= 500 &&
      typeof settings.deliveryAreas === "string" && settings.deliveryAreas.length <= 1000 &&
      typeof settings.businessHours === "string" && settings.businessHours.length <= 200 &&
      Number.isFinite(Number(settings.deliveryFee)) && Number(settings.deliveryFee) >= 0 && Number(settings.deliveryFee) <= 1_000_000 &&
      Number.isFinite(Number(settings.minimumOrderAmount)) && Number(settings.minimumOrderAmount) >= 0 && Number(settings.minimumOrderAmount) <= 1_000_000 &&
      typeof settings.acceptingOrders === "boolean";
  }
  return false;
}

function getPublicSiteData(value: unknown): Partial<SiteData> | null {
  if (!isRecord(value)) return null;
  const data: Partial<SiteData> = {};
  if (isValidFieldValue("menuData", value.menuData)) data.menuData = value.menuData as SiteData["menuData"];
  if (isValidFieldValue("offers", value.offers)) data.offers = value.offers as SiteData["offers"];
  if (isValidFieldValue("coupons", value.coupons)) data.coupons = value.coupons as SiteData["coupons"];
  if (isValidFieldValue("settings", value.settings)) data.settings = value.settings as SiteData["settings"];
  return data;
}

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, "public-site-data", 120, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "طلبات كثيرة. حاول مرة أخرى بعد قليل." },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ data: null, configured: false, adminConfigured: isAdminPasswordConfigured() }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await supabase.from("site_state").select("data").eq("id", 1).maybeSingle();
  if (error) {
    return NextResponse.json({ data: null, configured: true, databaseReady: false, error: "تعذر قراءة بيانات الموقع. تأكد من تشغيل ملف إعداد قاعدة البيانات." }, { status: 503 });
  }

  return NextResponse.json(
    { data: getPublicSiteData(data?.data), configured: true, databaseReady: true, adminConfigured: isAdminPasswordConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "الطلب غير مسموح" }, { status: 403 });
  }
  if (!isValidAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "سجّل الدخول إلى لوحة الأدمن أولاً" }, { status: 401 });
  }
  const rateLimit = checkRateLimit(request, "admin-site-data", 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "حفظ سريع جدًا. انتظر قليلاً ثم حاول مرة أخرى." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "لم يتم ربط قاعدة البيانات بعد. أضف مفتاح Supabase السري إلى إعدادات الخادم." }, { status: 503 });
  }

  let body: { field?: unknown; value?: unknown };
  try {
    body = await readJsonBody<{ field?: unknown; value?: unknown }>(request, 4 * 1024 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "حجم البيانات أكبر من المسموح (4 ميجابايت)" }, { status: 413 });
    }
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
