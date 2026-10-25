export type SharedDataField = "menuData" | "offers" | "coupons" | "settings";

export async function saveSharedDataField(field: SharedDataField | "all", value: unknown) {
  const response = await fetch("/api/site-data", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ field, value }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "تعذر نشر البيانات على الموقع");
  return result;
}

export async function loadSharedSiteData() {
  const response = await fetch("/api/site-data", { cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "تعذر تحميل بيانات الموقع");
  return result as {
    data: Record<string, unknown> | null;
    configured: boolean;
    databaseReady?: boolean;
    error?: string;
  };
}
